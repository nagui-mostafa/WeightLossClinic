import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ProductCategory, WeightLossProduct } from '@prisma/client';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import type { File as MulterFile } from 'multer';
import { PrismaService, ObjectStorageService } from '../common';
import {
  ProductFaqDto,
  ProductHowItWorksStepDto,
  ProductImageInputDto,
  ProductImageUpdateDto,
  ProductPlanOptionDto,
  ProductWhyChooseDto,
  CreateWeightLossProductDto,
  UpdateWeightLossProductDto,
} from './dto/create-product.dto';
import {
  ProductResponseDto,
  ProductImageResponseDto,
  CategoryResponseDto,
} from './dto/product-response.dto';
import {
  ProductFaq,
  ProductHowItWorksStep,
  ProductImageData,
  ProductPlanOption,
  ProductWhyChoose,
  ProductMetadata,
} from './interfaces/weight-loss-product.types';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly objectStorage: ObjectStorageService,
  ) {}

  async create(dto: CreateWeightLossProductDto): Promise<ProductResponseDto> {
    const token = this.normalizeIdentifier(dto.token);
    const category = this.normalizeCategory(dto.category);
    const payload = this.buildCreateData(dto, token, category);
    const created = await this.prisma.weightLossProduct.create({
      data: payload,
    });
    return this.toResponse(created);
  }

  async findAll(category?: ProductCategory): Promise<ProductResponseDto[]> {
    const products = await this.prisma.weightLossProduct.findMany({
      where: category ? { category } : undefined,
    });
    const sorted = products.sort((a, b) => {
      const orderDelta = this.getDisplayOrder(a) - this.getDisplayOrder(b);
      if (orderDelta !== 0) {
        return orderDelta;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    return sorted.map((product) => this.toResponse(product));
  }

  async findByToken(token: string): Promise<ProductResponseDto> {
    const normalizedToken = this.normalizeIdentifier(token);
    const product = await this.prisma.weightLossProduct.findUnique({
      where: { token: normalizedToken },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.toResponse(product);
  }

  async update(
    token: string,
    dto: UpdateWeightLossProductDto,
    files: MulterFile[] = [],
  ): Promise<ProductResponseDto> {
    const normalizedToken = this.normalizeIdentifier(token);
    const existing = await this.prisma.weightLossProduct.findUnique({
      where: { token: normalizedToken },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    try {
      const existingImages = this.parseImages(existing.images);
      const dtoWithUploads = await this.applyUploadedAssets(
        normalizedToken,
        existing.category,
        dto,
        files,
      );
      const sanitizedDto = this.sanitizeImageUpdates(
        dtoWithUploads,
        existingImages,
      );
      const payload = this.buildUpdateData(sanitizedDto);
      const updated = await this.prisma.weightLossProduct.update({
        where: { token: normalizedToken },
        data: payload,
      });
      return this.toResponse(updated);
    } catch (error) {
      this.logger.error(
        `Failed to update product ${normalizedToken}: ${error?.message ?? error}`,
        error?.stack,
      );
      throw error;
    }
  }

  async remove(token: string): Promise<void> {
    const normalizedToken = this.normalizeIdentifier(token);
    const existing = await this.prisma.weightLossProduct.findUnique({
      where: { token: normalizedToken },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    await this.prisma.weightLossProduct.delete({
      where: { token: normalizedToken },
    });
  }

  async listByCategorySlug(slug: string): Promise<ProductResponseDto[]> {
    const category = this.categoryFromSlug(slug);
    return this.findAll(category);
  }

  async categories(): Promise<CategoryResponseDto[]> {
    const products = await this.prisma.weightLossProduct.findMany();
    const grouped: Record<ProductCategory, WeightLossProduct[]> = {
      [ProductCategory.WEIGHT_LOSS]: [],
      [ProductCategory.SEXUAL_HEALTH]: [],
      [ProductCategory.WELLNESS]: [],
    };

    for (const product of products) {
      grouped[product.category]?.push(product);
    }

    const order: ProductCategory[] = [
      ProductCategory.WEIGHT_LOSS,
      ProductCategory.SEXUAL_HEALTH,
      ProductCategory.WELLNESS,
    ];

    return order.map((category) => ({
      label: this.categoryLabel(category),
      slug: this.categorySlug(category),
      products: this.sortProducts(grouped[category]).map((p) =>
        this.toResponse(p),
      ),
    }));
  }

  private async applyUploadedAssets(
    token: string,
    category: ProductCategory,
    dto: UpdateWeightLossProductDto,
    files: MulterFile[],
  ): Promise<UpdateWeightLossProductDto> {
    if (!dto || !files?.length) {
      return dto;
    }

    const fileMap = new Map(files.map((file) => [file.fieldname, file]));
    let updatedDto = dto;

    if (dto.images?.length) {
      const updatedImages = await Promise.all(
        dto.images.map(async (image) => {
          if (!image.uploadField) {
            return image;
          }
          const selectedFile = fileMap.get(image.uploadField);
          if (!selectedFile) {
            return image;
          }
          const uploadResult = await this.uploadProductImage(
            token,
            category,
            image,
            selectedFile,
          );
          return {
            ...image,
            bucket: uploadResult.bucket,
            objectKey: uploadResult.objectKey,
            url: uploadResult.url,
          };
        }),
      );

      updatedDto = {
        ...updatedDto,
        images: updatedImages,
      };
    }

    if (dto.whyChoose?.length) {
      const updatedWhyChoose = await Promise.all(
        dto.whyChoose.map(async (item, index) => {
          if (!item.imgSrcUploadField) {
            return item;
          }
          const file = fileMap.get(item.imgSrcUploadField);
          if (!file) {
            return item;
          }
          const uploadResult = await this.uploadWhyChooseImage(
            token,
            category,
            item,
            index,
            file,
          );
          return {
            ...item,
            imgSrc: uploadResult.url ?? item.imgSrc,
          };
        }),
      );

      updatedDto = {
        ...updatedDto,
        whyChoose: updatedWhyChoose,
      };
    }

    return updatedDto;
  }

  private sanitizeImageUpdates(
    dto: UpdateWeightLossProductDto,
    existingImages: ProductImageData[],
  ): UpdateWeightLossProductDto {
    if (!dto?.images) {
      return dto;
    }

    const existingMap = new Map(existingImages.map((img) => [img.id, img]));

    const sanitizedImages = dto.images.map((image) => {
      if (image.uploadField) {
        return image;
      }

      const incomingKey = this.objectStorage.normalizeObjectKey(
        image.objectKey,
      );
      const normalizedBucket = this.normalizeOptionalString(image.bucket);
      const sanitized: ProductImageUpdateDto = { ...image };

      if (!image.id) {
        if (incomingKey || normalizedBucket) {
          throw new BadRequestException(
            'objectKey and bucket are read-only. Upload a file to generate a storage key.',
          );
        }
        delete sanitized.objectKey;
        delete sanitized.bucket;
        return sanitized;
      }

      const existing = existingMap.get(image.id);
      if (!existing) {
        if (incomingKey || normalizedBucket) {
          throw new BadRequestException(
            'objectKey and bucket are read-only. Upload a file to generate a storage key.',
          );
        }
        delete sanitized.objectKey;
        delete sanitized.bucket;
        return sanitized;
      }

      const existingKey = this.objectStorage.normalizeObjectKey(
        existing.objectKey,
      );
      if (incomingKey && incomingKey !== existingKey) {
        throw new BadRequestException(
          'objectKey is read-only. Upload a replacement image to change it.',
        );
      }

      const existingBucket = this.normalizeOptionalString(existing.bucket);
      if (normalizedBucket && normalizedBucket !== existingBucket) {
        throw new BadRequestException(
          'bucket is read-only. Upload a replacement image to change it.',
        );
      }

      sanitized.bucket = existing.bucket ?? undefined;
      sanitized.objectKey = existing.objectKey ?? undefined;
      return sanitized;
    });

    return {
      ...dto,
      images: sanitizedImages,
    };
  }

  private async uploadProductImage(
    productToken: string,
    category: ProductCategory,
    image: ProductImageUpdateDto,
    file: MulterFile,
  ): Promise<{ bucket: string; objectKey: string; url: string | null }> {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new Error('Uploaded image file is empty');
    }

    const bucket =
      this.normalizeOptionalString(image.bucket) ??
      this.objectStorage.getDefaultBucket();
    const safeToken = this.normalizeIdentifier(productToken);
    const extension = this.resolveFileExtension(file);
    const baseId =
      this.normalizeOptionalString(image.id) ?? `image-${randomUUID()}`;
    const providedKey = image.uploadField
      ? null
      : this.objectStorage.normalizeObjectKey(image.objectKey);
    const generatedKey = `${this.categorySlug(category).replace(/\//g, '')}/products/${safeToken}/${baseId}${extension}`;
    const objectKey =
      providedKey ?? this.objectStorage.normalizeObjectKey(generatedKey);

    if (!objectKey) {
      throw new Error('Failed to generate object key for uploaded image');
    }

    try {
      await this.objectStorage.uploadObject({
        bucket,
        objectKey,
        body: file.buffer,
        contentType: file.mimetype,
      });

      const url =
        this.objectStorage.getPublicUrl(objectKey, bucket) ??
        `/${bucket}/${objectKey}`;

      return { bucket, objectKey, url };
    } catch (error) {
      this.logger.error(
        `Failed to upload image ${image.id ?? 'unknown'} for ${productToken}: ${error?.message ?? error}`,
        error?.stack,
      );
      throw error;
    }
  }

  private async uploadWhyChooseImage(
    productToken: string,
    category: ProductCategory,
    item: ProductWhyChooseDto,
    index: number,
    file: MulterFile,
  ): Promise<{ bucket: string; objectKey: string; url: string | null }> {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new Error('Uploaded image file is empty');
    }

    const bucket = this.objectStorage.getDefaultBucket();
    const extension = this.resolveFileExtension(file);
    const safeToken = this.normalizeIdentifier(productToken);
    const rawTitle =
      this.normalizeOptionalString(item.title) ?? `why-${index + 1}`;
    const titleSlug =
      rawTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `why-${index + 1}`;
    const slug = `${titleSlug}-${randomUUID()}`;
    const rawKey = `${this.categorySlug(category).replace(/\//g, '')}/products/${safeToken}/why-choose/${slug}${extension}`;
    const objectKey = this.objectStorage.normalizeObjectKey(rawKey);

    if (!objectKey) {
      throw new Error('Failed to generate object key for why-choose upload');
    }

    try {
      await this.objectStorage.uploadObject({
        bucket,
        objectKey,
        body: file.buffer,
        contentType: file.mimetype,
      });

      const url =
        this.objectStorage.getPublicUrl(objectKey, bucket) ??
        `/${bucket}/${objectKey}`;

      return { bucket, objectKey, url };
    } catch (error) {
      this.logger.error(
        `Failed to upload why-choose image for ${productToken}: ${error?.message ?? error}`,
        error?.stack,
      );
      throw error;
    }
  }

  private resolveFileExtension(file: MulterFile): string {
    const fromName = extname(file.originalname ?? '').toLowerCase();
    if (fromName) {
      return fromName;
    }
    switch (file.mimetype) {
      case 'image/png':
        return '.png';
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/webp':
        return '.webp';
      default:
        return '';
    }
  }

  private buildCreateData(
    dto: CreateWeightLossProductDto,
    token: string,
    category: ProductCategory,
  ): Prisma.WeightLossProductCreateInput {
    return {
      token,
      category,
      name: this.normalizeRequiredString(dto.name),
      href: this.normalizeRequiredString(dto.href),
      hrefForm: this.normalizeOptionalString(dto.hrefForm),
      oldPrice: this.normalizeDecimal(dto.oldPrice),
      price: this.ensureDecimal(dto.price),
      popular: dto.popular ?? false,
      inStock: dto.inStock ?? true,
      badge: this.normalizeOptionalString(dto.badge),
      description: this.normalizeOptionalString(dto.description),
      shipping: this.normalizeOptionalString(dto.shipping),
      instructions: this.normalizeOptionalString(dto.instructions),
      sideEffects: this.normalizeOptionalString(dto.sideEffects),
      features: this.normalizeStringArray(dto.features),
      whyChoose: this.toJsonValue(this.normalizeWhyChoose(dto.whyChoose)),
      plan: this.toJsonValue(this.normalizePlan(dto.plan)),
      question: this.toJsonValue(this.normalizeFaqs(dto.question)),
      howItWorks: this.toJsonValue(this.normalizeSteps(dto.howItWorks)),
      images: this.toJsonValue(this.normalizeImages(dto.images)),
      metadata: this.toJsonValue(dto.metadata ?? undefined),
    };
  }

  private buildUpdateData(
    dto: UpdateWeightLossProductDto,
  ): Prisma.WeightLossProductUpdateInput {
    const payload: Prisma.WeightLossProductUpdateInput = {};

    if (dto.category !== undefined) {
      payload.category = this.normalizeCategory(dto.category);
    }
    if (dto.name !== undefined) {
      payload.name = this.normalizeRequiredString(dto.name);
    }
    if (dto.href !== undefined) {
      payload.href = this.normalizeRequiredString(dto.href);
    }
    if (dto.hrefForm !== undefined) {
      payload.hrefForm = this.normalizeOptionalString(dto.hrefForm);
    }
    if (dto.oldPrice !== undefined) {
      payload.oldPrice = this.normalizeDecimal(dto.oldPrice);
    }
    if (dto.price !== undefined) {
      payload.price = this.ensureDecimal(dto.price);
    }
    if (dto.popular !== undefined) {
      payload.popular = dto.popular;
    }
    if (dto.inStock !== undefined) {
      payload.inStock = dto.inStock;
    }
    if (dto.badge !== undefined) {
      payload.badge = this.normalizeOptionalString(dto.badge);
    }
    if (dto.description !== undefined) {
      payload.description = this.normalizeOptionalString(dto.description);
    }
    if (dto.shipping !== undefined) {
      payload.shipping = this.normalizeOptionalString(dto.shipping);
    }
    if (dto.instructions !== undefined) {
      payload.instructions = this.normalizeOptionalString(dto.instructions);
    }
    if (dto.sideEffects !== undefined) {
      payload.sideEffects = this.normalizeOptionalString(dto.sideEffects);
    }
    if (dto.features !== undefined) {
      payload.features = this.normalizeStringArray(dto.features);
    }
    if (dto.whyChoose !== undefined) {
      payload.whyChoose = this.toJsonValue(
        this.normalizeWhyChoose(dto.whyChoose),
      );
    }
    if (dto.plan !== undefined) {
      payload.plan = this.toJsonValue(this.normalizePlan(dto.plan));
    }
    if (dto.question !== undefined) {
      payload.question = this.toJsonValue(this.normalizeFaqs(dto.question));
    }
    if (dto.howItWorks !== undefined) {
      payload.howItWorks = this.toJsonValue(
        this.normalizeSteps(dto.howItWorks),
      );
    }
    if (dto.images !== undefined) {
      payload.images = this.toJsonValue(this.normalizeImages(dto.images));
    }
    if (dto.metadata !== undefined) {
      payload.metadata = this.toJsonValue(dto.metadata ?? undefined);
    }

    return payload;
  }

  private toResponse(product: WeightLossProduct): ProductResponseDto {
    const plan = this.parsePlan(product.plan);
    const question = this.parseFaqs(product.question);
    const whyChoose = this.parseWhyChoose(product.whyChoose);
    const howItWorks = this.parseSteps(product.howItWorks);
    const images = this.parseImages(product.images);
    const metadata = this.parseMetadata(product.metadata);

    const imageResponses: ProductImageResponseDto[] = images.map((image) => {
      const url =
        this.objectStorage.getPublicUrl(
          image.objectKey ?? undefined,
          image.bucket,
        ) ??
        image.fallbackUrl ??
        null;
      return {
        id: image.id,
        bucket: image.bucket,
        objectKey: image.objectKey ?? undefined,
        altText: image.altText ?? undefined,
        fallbackUrl: image.fallbackUrl ?? undefined,
        variant: image.variant ?? undefined,
        metadata: image.metadata ?? undefined,
        url,
      };
    });

    return {
      id: product.id,
      token: product.token,
      category: product.category,
      categorySlug: this.categorySlug(product.category),
      name: product.name,
      href: product.href,
      hrefForm: product.hrefForm,
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      price: Number(product.price),
      popular: product.popular,
      inStock: product.inStock,
      badge: product.badge,
      description: product.description,
      features: Array.isArray(product.features) ? product.features : [],
      shipping: product.shipping,
      instructions: product.instructions,
      sideEffects: product.sideEffects,
      whyChoose,
      plan,
      question,
      howItWorks,
      images: imageResponses,
      metadata,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private categorySlug(category: ProductCategory): string {
    switch (category) {
      case ProductCategory.WEIGHT_LOSS:
        return '/weight-loss';
      case ProductCategory.SEXUAL_HEALTH:
        return '/sexual-health';
      case ProductCategory.WELLNESS:
        return '/wellness';
      default:
        return '/weight-loss';
    }
  }

  private categoryLabel(category: ProductCategory): string {
    switch (category) {
      case ProductCategory.WEIGHT_LOSS:
        return 'Weight Loss';
      case ProductCategory.SEXUAL_HEALTH:
        return 'Sexual Health';
      case ProductCategory.WELLNESS:
        return 'Wellness';
      default:
        return 'Weight Loss';
    }
  }

  private categoryFromSlug(slug: string): ProductCategory {
    const normalized = (slug || '').replace(/^\/+/, '').toLowerCase();
    if (normalized.startsWith('weight-loss')) {
      return ProductCategory.WEIGHT_LOSS;
    }
    if (normalized.startsWith('sexual-health')) {
      return ProductCategory.SEXUAL_HEALTH;
    }
    if (normalized.startsWith('wellness')) {
      return ProductCategory.WELLNESS;
    }
    throw new BadRequestException('Unknown category');
  }

  private normalizeCategory(
    category: ProductCategory | string,
  ): ProductCategory {
    if (typeof category === 'string') {
      const upper = category.toUpperCase();
      if ((Object.values(ProductCategory) as string[]).includes(upper)) {
        return upper as ProductCategory;
      }
      return this.categoryFromSlug(category);
    }
    return category;
  }

  private normalizeIdentifier(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizeRequiredString(value?: string): string {
    const normalized = this.normalizeOptionalString(value);
    if (!normalized) {
      throw new Error('Required field cannot be empty');
    }
    return normalized;
  }

  private normalizeOptionalString(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private normalizeDecimal(value?: number | null): Prisma.Decimal | null {
    if (value === undefined || value === null) {
      return null;
    }
    return new Prisma.Decimal(value);
  }

  private ensureDecimal(value: number): Prisma.Decimal {
    return new Prisma.Decimal(value);
  }

  private normalizeStringArray(values?: string[]): string[] {
    if (!Array.isArray(values)) {
      return [];
    }
    return values
      .map((value) => this.normalizeOptionalString(value) ?? '')
      .filter((value) => value.length > 0);
  }

  private normalizePlan(plan?: ProductPlanOptionDto[]): ProductPlanOption[] {
    if (!Array.isArray(plan)) {
      return [];
    }
    const results: ProductPlanOption[] = [];
    plan.forEach((option, index) => {
      const id =
        this.normalizeOptionalString(option?.id) ?? `plan-${index + 1}`;
      const title =
        this.normalizeOptionalString(option?.title) ?? `Plan ${index + 1}`;
      if (!title) {
        return;
      }
      const price = Number(option?.price ?? 0);
      const oldPrice =
        option?.oldPrice === undefined || option?.oldPrice === null
          ? undefined
          : Number(option.oldPrice);
      const href = this.normalizeOptionalString(option?.href) ?? undefined;
      results.push({
        id,
        title,
        price,
        oldPrice,
        href,
      });
    });
    return results;
  }

  private normalizeFaqs(question?: ProductFaqDto[]): ProductFaq[] {
    if (!Array.isArray(question)) {
      return [];
    }
    return question.map((faq, index) => ({
      title:
        this.normalizeOptionalString(faq?.title) ?? `Question ${index + 1}`,
      description: this.normalizeOptionalString(faq?.description) ?? '',
    }));
  }

  private normalizeWhyChoose(
    whyChoose?: ProductWhyChooseDto[],
  ): ProductWhyChoose[] {
    if (!Array.isArray(whyChoose)) {
      return [];
    }
    return whyChoose.map((item) => ({
      title: this.normalizeOptionalString(item?.title) ?? '',
      excerpt: this.normalizeOptionalString(item?.excerpt) ?? '',
      imgSrc: this.normalizeOptionalString(item?.imgSrc) ?? undefined,
    }));
  }

  private normalizeSteps(
    steps?: ProductHowItWorksStepDto[],
  ): ProductHowItWorksStep[] {
    if (!Array.isArray(steps)) {
      return [];
    }
    return steps.map((step, index) => ({
      step: Number(step?.step ?? index + 1),
      title: this.normalizeOptionalString(step?.title) ?? `Step ${index + 1}`,
      description: this.normalizeOptionalString(step?.description) ?? '',
    }));
  }

  private normalizeImages(images?: ProductImageInputDto[]): ProductImageData[] {
    if (!Array.isArray(images)) {
      return [];
    }
    const results: ProductImageData[] = [];
    images.forEach((image, index) => {
      const { uploadField: _uploadField, ...imageData } =
        image as ProductImageUpdateDto;
      const objectKey = this.objectStorage.normalizeObjectKey(
        imageData?.objectKey,
      );
      const fallbackUrl = this.normalizeOptionalString(imageData?.fallbackUrl);
      if (!objectKey && !fallbackUrl) {
        return;
      }
      const id =
        this.normalizeOptionalString(imageData?.id) ??
        `image-${index + 1}-${randomUUID()}`;
      results.push({
        id,
        bucket: this.normalizeOptionalString(imageData?.bucket) ?? undefined,
        objectKey: objectKey ?? undefined,
        altText: this.normalizeOptionalString(imageData?.altText) ?? undefined,
        fallbackUrl: fallbackUrl ?? undefined,
        variant: this.normalizeOptionalString(imageData?.variant) ?? undefined,
        metadata: imageData?.metadata ?? null,
      });
    });
    return results;
  }

  private parsePlan(value: Prisma.JsonValue | null): ProductPlanOption[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const results: ProductPlanOption[] = [];
    value.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        return;
      }
      const raw = item as Record<string, unknown>;
      const id =
        this.normalizeOptionalString(raw.id as string) ?? `plan-${index + 1}`;
      const title = this.normalizeOptionalString(raw.title as string) ?? '';
      if (!title) {
        return;
      }
      const price = Number(raw.price ?? 0);
      const oldPriceValue = raw.oldPrice;
      let oldPrice: number | undefined;
      if (oldPriceValue !== undefined && oldPriceValue !== null) {
        const parsed = Number(oldPriceValue);
        if (!Number.isNaN(parsed)) {
          oldPrice = parsed;
        }
      }
      const href =
        this.normalizeOptionalString(raw.href as string) ?? undefined;
      results.push({ id, title, price, oldPrice, href });
    });
    return results;
  }

  private parseFaqs(value: Prisma.JsonValue | null): ProductFaq[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const raw = item as Record<string, unknown>;
        return {
          title:
            this.normalizeOptionalString(raw.title as string) ??
            `Question ${index + 1}`,
          description:
            this.normalizeOptionalString(raw.description as string) ?? '',
        };
      })
      .filter((faq): faq is ProductFaq => Boolean(faq));
  }

  private parseWhyChoose(value: Prisma.JsonValue | null): ProductWhyChoose[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const results: ProductWhyChoose[] = [];
    value.forEach((item) => {
      if (!item || typeof item !== 'object') {
        return;
      }
      const raw = item as Record<string, unknown>;
      results.push({
        title: this.normalizeOptionalString(raw.title as string) ?? '',
        excerpt: this.normalizeOptionalString(raw.excerpt as string) ?? '',
        imgSrc: this.normalizeOptionalString(raw.imgSrc as string) ?? undefined,
      });
    });
    return results;
  }

  private parseSteps(value: Prisma.JsonValue | null): ProductHowItWorksStep[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const raw = item as Record<string, unknown>;
        return {
          step: Number(raw.step ?? index + 1),
          title:
            this.normalizeOptionalString(raw.title as string) ??
            `Step ${index + 1}`,
          description:
            this.normalizeOptionalString(raw.description as string) ?? '',
        };
      })
      .filter((step): step is ProductHowItWorksStep => Boolean(step));
  }

  private parseImages(value: Prisma.JsonValue | null): ProductImageData[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const raw = item as Record<string, unknown>;
        const id =
          this.normalizeOptionalString(raw.id as string) ??
          `image-${index + 1}`;
        const objectKey = this.normalizeOptionalString(raw.objectKey as string);
        const bucket = this.normalizeOptionalString(raw.bucket as string);
        const altText =
          this.normalizeOptionalString(raw.altText as string) ?? undefined;
        const fallbackUrl =
          this.normalizeOptionalString(raw.fallbackUrl as string) ?? undefined;
        const variant =
          this.normalizeOptionalString(raw.variant as string) ?? undefined;
        const metadata = this.parseMetadata(raw.metadata as Prisma.JsonValue);
        if (!objectKey && !fallbackUrl) {
          return null;
        }
        return {
          id,
          bucket,
          objectKey,
          altText,
          fallbackUrl,
          variant,
          metadata,
        } as ProductImageData;
      })
      .filter((image): image is ProductImageData => Boolean(image));
  }

  private parseMetadata(value: Prisma.JsonValue | null): ProductMetadata {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private getDisplayOrder(product: WeightLossProduct): number {
    const metadata = this.parseMetadata(product.metadata);
    const orderValue = metadata ? metadata['displayOrder'] : undefined;
    if (typeof orderValue === 'number' && Number.isFinite(orderValue)) {
      return orderValue;
    }
    if (typeof orderValue === 'string') {
      const parsed = Number(orderValue);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return Number.MAX_SAFE_INTEGER;
  }

  private sortProducts(products: WeightLossProduct[]): WeightLossProduct[] {
    return [...products].sort((a, b) => {
      const orderDelta = this.getDisplayOrder(a) - this.getDisplayOrder(b);
      if (orderDelta !== 0) {
        return orderDelta;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  private toJsonValue(value?: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }
    return value as Prisma.InputJsonValue;
  }
}
