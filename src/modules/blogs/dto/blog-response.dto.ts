import { ApiProperty } from '@nestjs/swagger';
import { BlogSectionDto } from './blog-section.dto';

export class BlogResponseDto {
  @ApiProperty({ example: '8c1f2d8b-86f7-4e08-9d76-0a3df7f03ab2' })
  id!: string;

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

  @ApiProperty({ example: '2025-10-30T18:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-10-30T18:30:00.000Z' })
  updatedAt!: string;
}

