import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Public, Roles, RolesGuard } from '../common';
import { Role } from '../common/enums/role.enum';
import { BlogsService } from './blogs.service';
import { BlogResponseDto } from './dto/blog-response.dto';
import { CreateBlogDto, UpdateBlogDto } from './dto/create-blog.dto';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all blogs (public)' })
  @ApiOkResponse({ type: [BlogResponseDto] })
  list(): Promise<BlogResponseDto[]> {
    return this.blogsService.findAll();
  }

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Retrieve a blog by token (public)' })
  @ApiOkResponse({ type: BlogResponseDto })
  getByToken(@Param('token') token: string): Promise<BlogResponseDto> {
    return this.blogsService.findByToken(token);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new blog (admin only)' })
  @ApiCreatedResponse({ type: BlogResponseDto })
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('AdminApiKey')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateBlogDto): Promise<BlogResponseDto> {
    return this.blogsService.create(dto);
  }

  @Put(':token')
  @ApiOperation({ summary: 'Replace a blog by token (admin only)' })
  @ApiOkResponse({ type: BlogResponseDto })
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('AdminApiKey')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('token') token: string,
    @Body() dto: UpdateBlogDto,
  ): Promise<BlogResponseDto> {
    return this.blogsService.update(token, dto);
  }

  @Delete(':token')
  @ApiOperation({ summary: 'Delete a blog by token (admin only)' })
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('AdminApiKey')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('token') token: string): Promise<void> {
    await this.blogsService.remove(token);
  }
}
