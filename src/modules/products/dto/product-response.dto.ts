import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProductFaqDto,
  ProductHowItWorksStepDto,
  ProductImageInputDto,
  ProductPlanOptionDto,
  ProductWhyChooseDto,
} from './create-product.dto';

export class ProductImageResponseDto extends ProductImageInputDto {
  @ApiPropertyOptional({ example: 'https://cdn.joeymed.com/weight-loss/hero.png' })
  url?: string | null;
}

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  token!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  href!: string;

  @ApiPropertyOptional()
  hrefForm?: string | null;

  @ApiPropertyOptional()
  oldPrice?: number | null;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  popular!: boolean;

  @ApiProperty()
  inStock!: boolean;

  @ApiPropertyOptional()
  badge?: string | null;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ type: [String] })
  features!: string[];

  @ApiPropertyOptional()
  shipping?: string | null;

  @ApiPropertyOptional()
  instructions?: string | null;

  @ApiPropertyOptional()
  sideEffects?: string | null;

  @ApiProperty({ type: [ProductWhyChooseDto] })
  whyChoose!: ProductWhyChooseDto[];

  @ApiProperty({ type: [ProductPlanOptionDto], name: 'plan' })
  plan!: ProductPlanOptionDto[];

  @ApiProperty({ type: [ProductFaqDto], name: 'question' })
  question!: ProductFaqDto[];

  @ApiProperty({ type: [ProductHowItWorksStepDto] })
  howItWorks!: ProductHowItWorksStepDto[];

  @ApiProperty({ type: [ProductImageResponseDto] })
  images!: ProductImageResponseDto[];

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
