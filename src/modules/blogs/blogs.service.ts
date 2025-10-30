import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { CreateBlogDto, UpdateBlogDto } from './dto/create-blog.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { BlogSectionDto } from './dto/blog-section.dto';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBlogDto): Promise<BlogResponseDto> {
    const created = await this.prisma.blog.create({
      data: this.toPersistence(dto),
    });
    return this.toResponse(created);
  }

  async findAll(): Promise<BlogResponseDto[]> {
    const blogs = await this.prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return blogs.map((blog) => this.toResponse(blog));
  }

  async findByToken(token: string): Promise<BlogResponseDto> {
    const blog = await this.prisma.blog.findUnique({ where: { token } });
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return this.toResponse(blog);
  }

  async update(token: string, dto: UpdateBlogDto): Promise<BlogResponseDto> {
    const updated = await this.prisma.blog.update({
      where: { token },
      data: this.toPersistence(dto),
    });
    return this.toResponse(updated);
  }

  async remove(token: string): Promise<void> {
    const blog = await this.prisma.blog.findUnique({ where: { token } });
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    await this.prisma.blog.delete({ where: { token } });
  }

  private toPersistence(dto: CreateBlogDto): Prisma.BlogCreateInput {
    return {
      token: dto.token,
      title: dto.title,
      excerpt: dto.excerpt,
      category: dto.category,
      imgSrc: dto.imgSrc,
      body: dto.body.map((section) => ({ ...section })),
    };
  }

  private toResponse(blog: Prisma.BlogGetPayload<{}>): BlogResponseDto {
    const body = Array.isArray(blog.body)
      ? (blog.body as unknown as BlogSectionDto[])
      : [];

    return {
      id: blog.id,
      token: blog.token,
      title: blog.title,
      excerpt: blog.excerpt,
      category: blog.category,
      imgSrc: blog.imgSrc,
      body,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
    };
  }
}
