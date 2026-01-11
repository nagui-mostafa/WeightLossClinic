import {
  Controller,
  Get,
  Query,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiProduces,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { AdminStatsResponseDto } from '../dto/stats-response.dto';
import { AdminAnalyticsResponseDto } from '../dto/analytics-response.dto';
import { Roles, RolesGuard, Role } from '../../common';
import type { Response } from 'express';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import { AdminNotificationDto } from '../dto/admin-notification.dto';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('AdminApiKey')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs' })
  @ApiOkResponse({ type: AuditLogResponseDto, isArray: true })
  async getAuditLogs(
    @Query() query: ListAuditLogsQueryDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>> {
    return this.adminService.getAuditLogs(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiOkResponse({ type: AdminStatsResponseDto })
  async getStats(): Promise<AdminStatsResponseDto> {
    return this.adminService.getStats();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get patient/order analytics' })
  @ApiOkResponse({ type: AdminAnalyticsResponseDto })
  async getAnalytics(): Promise<AdminAnalyticsResponseDto> {
    return this.adminService.getAnalytics();
  }

  @Get('notifications')
  @ApiOperation({
    summary: 'List all notifications (admin)',
    description: 'Paginated notifications with user contact info, sortable and filterable.',
  })
  @ApiOkResponse({ type: AdminNotificationDto, isArray: true })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'number', minimum: 1, default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'number', minimum: 1, maximum: 100, default: 20 },
  })
  async listNotifications(
    @Query() query: ListNotificationsQueryDto,
  ): Promise<PaginatedResult<AdminNotificationDto>> {
    return this.adminService.listNotifications(query);
  }

  @Get('notifications/export')
  @ApiOperation({ summary: 'Download notifications as Excel file' })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOkResponse({
    description: 'Excel file containing every notification in the system',
  })
  async exportNotifications(): Promise<StreamableFile> {
    const { buffer, filename } =
      await this.adminService.exportNotificationsReport();
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${filename}"`,
      length: buffer.length,
    });
  }
}
