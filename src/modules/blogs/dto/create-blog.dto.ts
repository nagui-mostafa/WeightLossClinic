import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlogSectionDto } from './blog-section.dto';

export class CreateBlogDto {
  @ApiProperty({ example: 'sexual-health-naturally' })
  @IsString()
  @MaxLength(160)
  token!: string;

  @ApiProperty({ example: 'Enhancing Sexual Health Naturally' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example:
      'Expert tips to improve intimacy, performance, and relationship wellness.',
  })
  @IsString()
  @MaxLength(400)
  excerpt!: string;

  @ApiProperty({ example: 'Sexual Health' })
  @IsString()
  @MaxLength(120)
  category!: string;

  @ApiProperty({ example: '/images/landing/blog1.png' })
  @IsString()
  @MaxLength(255)
  imgSrc!: string;

  @ApiProperty({ type: [BlogSectionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BlogSectionDto)
  body!: BlogSectionDto[];
}

export class UpdateBlogDto extends CreateBlogDto {}

