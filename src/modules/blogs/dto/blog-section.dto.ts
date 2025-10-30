import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class BlogSectionDto {
  @ApiProperty({ example: 'understanding-intimacy' })
  @IsString()
  @MaxLength(120)
  id!: string;

  @ApiProperty({ example: 'Understanding Intimacy and Sexual Health' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example:
      '<p>Sexual health is a cornerstone of overall wellness. At Joey Med, we know that issues around intimacy can impact confidence, relationships, and emotional health.</p>',
    description:
      'Rich text content serialized as HTML or Markdown. Stored verbatim in the database.',
  })
  @IsString()
  content!: string;
}

