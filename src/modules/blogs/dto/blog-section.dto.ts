import { ApiProperty } from '@nestjs/swagger';

export class BlogSectionDto {
  @ApiProperty({ example: 'understanding-intimacy' })
  id!: string;

  @ApiProperty({ example: 'Understanding Intimacy and Sexual Health' })
  title!: string;

  @ApiProperty({
    example:
      '<p>Sexual health is a cornerstone of overall wellness. At Joey Med, we know that issues around intimacy can impact confidence, relationships, and emotional health.</p>',
  })
  content!: string;
}
