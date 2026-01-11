import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { File as MulterFile } from 'multer';
import { Public, Roles, RolesGuard, Role } from '../common';
import { JsonBodyParserPipe } from '../common/pipes/json-body-parser.pipe';
import { ProductsService } from './products.service';
import {
  CreateWeightLossProductDto,
  UpdateWeightLossProductDto,
} from './dto/create-product.dto';
import {
  CategoryResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List categories with products (public)' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  categories(): Promise<CategoryResponseDto[]> {
    return this.productsService.categories();
  }

  @Get(':categorySlug')
  @Public()
  @ApiOperation({ summary: 'List products by category slug (public)' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  listByCategory(
    @Param('categorySlug') categorySlug: string,
  ): Promise<ProductResponseDto[]> {
    return this.productsService.listByCategorySlug(categorySlug);
  }

  @Get(':categorySlug/:token')
  @Public()
  @ApiOperation({ summary: 'Get a product by token (public)' })
  @ApiOkResponse({ type: ProductResponseDto })
  getByToken(
    @Param('categorySlug') categorySlug: string,
    @Param('token') token: string,
  ): Promise<ProductResponseDto> {
    // categorySlug is currently used for routing clarity; token lookup is global
    return this.productsService.findByToken(token);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product (admin only)' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('AdminApiKey')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateWeightLossProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(dto);
  }

  @Put(':token')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Update a product by token (admin only)' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('AdminApiKey')
  @UseGuards(RolesGuard)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024, files: 10 },
    }),
  )
  @Roles(Role.ADMIN)
  @ApiBody({
    description:
      'When uploading binaries, send multipart/form-data with a `payload` JSON string and one file input per `uploadField` or `imgSrcUploadField` value.',
    schema: {
      type: 'object',
      properties: {
        payload: {
          type: 'string',
          description:
            'JSON string matching UpdateWeightLossProductDto. Required when uploading files.',
          example:
            '{"images":[{"id":"hero","variant":"hero","uploadField":"imageUpload-hero"}]}',
        },
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Binary data referenced by images[].uploadField or whyChoose[].imgSrcUploadField (e.g., field name `imageUpload-hero`).',
        },
      },
      additionalProperties: {
        type: 'string',
        format: 'binary',
        description:
          'Any additional file inputs referenced from the payload (names must match the uploadField values).',
      },
    },
    required: false,
  })
  update(
    @Param('token') token: string,
    @Body(new JsonBodyParserPipe()) dto: UpdateWeightLossProductDto,
    @UploadedFiles() files: MulterFile[] = [],
  ): Promise<ProductResponseDto> {
    return this.productsService.update(token, dto, files ?? []);
  }

  @Delete(':token')
  @ApiOperation({ summary: 'Delete a product by token (admin only)' })
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('AdminApiKey')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('token') token: string): Promise<void> {
    return this.productsService.remove(token);
  }
}
