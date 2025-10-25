import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { AdminStatsResponseDto } from '../dto/stats-response.dto';
import { Roles, RolesGuard, Role } from '../../common';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
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
}
