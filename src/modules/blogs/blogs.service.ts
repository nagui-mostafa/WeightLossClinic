import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Blog } from '@prisma/client';
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
    const sections = Array.isArray(dto.body)
      ? dto.body.map((section, index) => ({
          id: String(section?.id ?? `section-${index + 1}`),
          title: String(section?.title ?? ''),
          content: String(section?.content ?? ''),
        }))
      : [];

    return {
      token: String(dto.token ?? ''),
      title: String(dto.title ?? ''),
      excerpt: String(dto.excerpt ?? ''),
      category: String(dto.category ?? ''),
      imgSrc: String(dto.imgSrc ?? ''),
      body: sections,
    };
  }

  private toResponse(blog: Blog): BlogResponseDto {
    const rawBody = Array.isArray(blog.body) ? blog.body : [];
    const body = rawBody.map((section: unknown, index: number) => {
      const cast = section as Partial<BlogSectionDto>;
      return {
        id: String(cast?.id ?? `section-${index + 1}`),
        title: String(cast?.title ?? ''),
        content: String(cast?.content ?? ''),
      };
    });

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
