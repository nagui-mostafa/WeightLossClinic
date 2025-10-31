import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { Role } from '../../common';
import { UsersService } from '../services/users.service';
import { RolesGuard } from '../../common';
import { Roles, CurrentUser } from '../../common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import {
  UserResponseDto,
  UserNotificationDto,
} from '../dto/user-response.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin only)' })
  @ApiOkResponse({ description: 'Paginated users response' })
  @Roles(Role.ADMIN)
  async listUsers(
    @Query() query: ListUsersQueryDto,
    @Req() request: Request,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const result = await this.usersService.listUsers(query);

    // Expose total count header for pagination
    if (request.res) {
      request.res.setHeader('X-Total-Count', String(result.meta.totalItems));
    }

    return result;
  }

  @Post()
  @ApiOperation({ summary: 'Create user (admin only)' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @Roles(Role.ADMIN)
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.createUserAsAdmin(
      dto,
      this.toRequestContext(request, actor?.id),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id (admin or owner)' })
  @ApiOkResponse({ type: UserResponseDto })
  async getUser(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    if (actor.role === Role.ADMIN || actor.id === id) {
      return this.usersService.getUserWithRecords(id);
    }

    throw new ForbiddenException('Access denied');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (admin or owner)' })
  @ApiOkResponse({ type: UserResponseDto })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(
      id,
      dto,
      this.toRequestContext(request, actor?.id),
      actor,
    );
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiOkResponse({ type: UserResponseDto })
  @Roles(Role.ADMIN)
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.updateRole(
      id,
      dto,
      actor,
      this.toRequestContext(request, actor?.id),
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (admin only)' })
  @ApiOkResponse({ type: UserResponseDto })
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.updateStatus(
      id,
      dto,
      actor,
      this.toRequestContext(request, actor?.id),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user (admin only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() actor,
    @Req() request: Request,
  ): Promise<void> {
    await this.usersService.softDelete(
      id,
      actor,
      this.toRequestContext(request, actor?.id),
    );
  }

  @Get(':id/notifications')
  @ApiOperation({ summary: 'List notifications for a user (admin or owner)' })
  @ApiOkResponse({ type: [UserNotificationDto] })
  async listNotifications(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserNotificationDto[]> {
    return this.usersService.listNotifications(id, actor);
  }

  @Patch(':id/notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read (admin or owner)' })
  @ApiOkResponse({ type: UserNotificationDto })
  async markNotificationRead(
    @Param('id') id: string,
    @Param('notificationId') notificationId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserNotificationDto> {
    return this.usersService.markNotificationRead(id, notificationId, actor);
  }

  @Delete(':id/notifications/:notificationId')
  @ApiOperation({ summary: 'Delete a notification (admin or owner)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(
    @Param('id') id: string,
    @Param('notificationId') notificationId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    await this.usersService.deleteNotification(id, notificationId, actor);
  }

  private toRequestContext(request: Request, userId?: string): RequestContext {
    return {
      requestId: (request as any).requestId,
      userId,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };
  }
}
