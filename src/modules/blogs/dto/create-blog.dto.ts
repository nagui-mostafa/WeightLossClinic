import { ApiProperty } from '@nestjs/swagger';
import { BlogSectionDto } from './blog-section.dto';

export class CreateBlogDto {
  @ApiProperty({ example: 'sexual-health-naturally' })
  token!: string;

  @ApiProperty({ example: 'Enhancing Sexual Health Naturally' })
  title!: string;

  @ApiProperty({
    example:
      'Expert tips to improve intimacy, performance, and relationship wellness.',
  })
  excerpt!: string;

  @ApiProperty({ example: 'Sexual Health' })
  category!: string;

  @ApiProperty({ example: '/images/landing/blog1.png' })
  imgSrc!: string;

  @ApiProperty({ type: [BlogSectionDto] })
  body!: BlogSectionDto[];
}

export class UpdateBlogDto extends CreateBlogDto {}
