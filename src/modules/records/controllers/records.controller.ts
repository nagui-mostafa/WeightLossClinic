import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { RecordsService } from '../services/records.service';
import { CreateRecordDto } from '../dto/create-record.dto';
import { UpdateRecordDto } from '../dto/update-record.dto';
import { ListRecordsQueryDto } from '../dto/list-records-query.dto';
import { RecordResponseDto } from '../dto/record-response.dto';
import { CurrentUser } from '../../common';
import type { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';

@ApiTags('records')
@ApiBearerAuth('JWT-auth')
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  @ApiOperation({ summary: 'List records (patient own, admin all)' })
  @ApiOkResponse({ type: RecordResponseDto, isArray: true })
  async listRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRecordsQueryDto,
    @Req() request: Request,
  ): Promise<PaginatedResult<RecordResponseDto>> {
    const result = await this.recordsService.listRecords(
      this.toActor(user),
      query,
    );
    if (request.res) {
      request.res.setHeader('X-Total-Count', String(result.meta.totalItems));
    }
    return result;
  }

  @Post()
  @ApiOperation({ summary: 'Create a record' })
  @ApiCreatedResponse({ type: RecordResponseDto })
  async createRecord(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecordDto,
    @Req() request: Request,
  ): Promise<RecordResponseDto> {
    return this.recordsService.createRecord(
      this.toActor(user),
      dto,
      this.toRequestContext(request, user.id),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get record by id' })
  @ApiOkResponse({ type: RecordResponseDto })
  async getRecord(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<RecordResponseDto> {
    return this.recordsService.getRecord(this.toActor(user), id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a record' })
  @ApiOkResponse({ type: RecordResponseDto })
  async updateRecord(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRecordDto,
    @Req() request: Request,
  ): Promise<RecordResponseDto> {
    return this.recordsService.updateRecord(
      this.toActor(user),
      id,
      dto,
      this.toRequestContext(request, user.id),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a record' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRecord(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.recordsService.deleteRecord(
      this.toActor(user),
      id,
      this.toRequestContext(request, user.id),
    );
  }

  private toActor(user: AuthenticatedUser) {
    return {
      id: user.id,
      role: user.role,
    };
  }

  private toRequestContext(request: Request, userId?: string): RequestContext {
    return {
      requestId: (request as any).requestId,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      userId,
    };
  }
}
