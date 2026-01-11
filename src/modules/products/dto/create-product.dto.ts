import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory } from '@prisma/client';

export class ProductPlanOptionDto {
  @ApiProperty({ example: 'plan-basic' })
  @IsString()
  @MaxLength(120)
  id!: string;

  @ApiProperty({ example: '4 Weeks' })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 199 })
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 279 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  oldPrice?: number;

  @ApiPropertyOptional({ example: 'https://pay.joeymed.com/checkout' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  href?: string;
}

export class ProductFaqDto {
  @ApiProperty({ example: 'What is this plan?' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'A weekly GLP-1 program with provider oversight.' })
  @IsString()
  description!: string;
}

export class ProductWhyChooseDto {
  @ApiProperty({ example: 'Clinician-guided' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Structured plan with check-ins' })
  @IsString()
  excerpt!: string;

  @ApiPropertyOptional({ example: '/images/products/hero.jpg' })
  @IsOptional()
  @IsString()
  imgSrc?: string;

  @ApiPropertyOptional({
    description:
      'Form-data field name that contains the binary image upload for this entry',
    example: 'whyUpload-1',
  })
  @IsOptional()
  @IsString()
  imgSrcUploadField?: string;
}

export class ProductHowItWorksStepDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  step?: number;

  @ApiProperty({ example: 'Start weekly dosing' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Begin with a starter dose and follow titration.' })
  @IsString()
  description!: string;
}

export class ProductImageInputDto {
  @ApiPropertyOptional({
    example: 'glp1-core-hero',
    description:
      'Stable identifier for an existing image. Use IDs returned by the API when editing.',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    example: 'weight-loss-media',
    description:
      'Storage bucket for the asset. Creation scripts may override it, but update requests treat it as read-only.',
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiPropertyOptional({
    description:
      'S3/MinIO object key or relative asset path. Returned in responses and may be provided during creation scripts, but update requests ignore changes—upload a file instead.',
    example: 'weight-loss/products/glp1-core/hero.png',
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional({ example: '/images/weight-loss/products/hero.png' })
  @IsOptional()
  @IsString()
  fallbackUrl?: string;

  @ApiPropertyOptional({ example: 'Hero image alt text' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: 'hero' })
  @IsOptional()
  @IsString()
  variant?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ProductImageUpdateDto extends ProductImageInputDto {
  @ApiPropertyOptional({
    description:
      'Form-data field name that contains the binary image upload for this entry. Include a matching field in multipart/form-data and the backend will generate the object key automatically.',
    example: 'imageUpload-hero',
  })
  @IsOptional()
  @IsString()
  uploadField?: string;
}

export class CreateWeightLossProductDto {
  @ApiProperty({ example: 'glp1-core-plan' })
  @IsString()
  @MaxLength(160)
  token!: string;

  @ApiProperty({
    enum: ProductCategory,
    example: ProductCategory.WEIGHT_LOSS,
    description: 'Category this product belongs to',
  })
  @IsEnum(ProductCategory)
  category!: ProductCategory;

  @ApiProperty({ example: 'GLP-1 Core — Injection' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: '/weight-loss/glp1-core-plan' })
  @IsString()
  @MaxLength(255)
  href!: string;

  @ApiPropertyOptional({ example: 'https://forms.joeymed.com/glp1' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  hrefForm?: string;

  @ApiPropertyOptional({ example: 279 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  oldPrice?: number;

  @ApiProperty({ example: 199 })
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ example: 'Metabolism & energy support' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: 'Provider guided GLP-1 program' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    example: 'Ships in 1-2 days — Free delivery over $40',
  })
  @IsOptional()
  @IsString()
  shipping?: string;

  @ApiPropertyOptional({ example: 'Inject weekly as directed' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: 'Mild nausea may occur.' })
  @IsOptional()
  @IsString()
  sideEffects?: string;

  @ApiPropertyOptional({ type: [ProductWhyChooseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductWhyChooseDto)
  whyChoose?: ProductWhyChooseDto[];

  @ApiPropertyOptional({ type: [ProductPlanOptionDto], name: 'plan' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPlanOptionDto)
  plan?: ProductPlanOptionDto[];

  @ApiPropertyOptional({ type: [ProductFaqDto], name: 'question' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductFaqDto)
  question?: ProductFaqDto[];

  @ApiPropertyOptional({ type: [ProductHowItWorksStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductHowItWorksStepDto)
  howItWorks?: ProductHowItWorksStepDto[];

  @ApiPropertyOptional({
    type: [ProductImageInputDto],
    description:
      'Image metadata. To upload binaries, send multipart/form-data and reference each file via images[].uploadField. Direct edits to objectKey are ignored.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateWeightLossProductDto extends PartialType(
  CreateWeightLossProductDto,
) {
  @ApiPropertyOptional({
    type: [ProductImageUpdateDto],
    description:
      'Image metadata updates. Provide alt text, variants, or fallback URLs directly, and use uploadField to stream new binaries. objectKey/bucket values are ignored unless supplied by the backend after an upload.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageUpdateDto)
  override images?: ProductImageUpdateDto[];
}
