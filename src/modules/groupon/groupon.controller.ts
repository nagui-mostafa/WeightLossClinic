import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { GrouponService } from './groupon.service';
import { GrouponLookupDto, GrouponLookupResponseDto } from './dto/lookup.dto';
import { GrouponRedeemDto, GrouponRedeemResponseDto } from './dto/redeem.dto';
import { Public } from '../common';

@ApiTags('groupon')
@Controller('groupon')
export class GrouponController {
  constructor(private readonly grouponService: GrouponService) {}

  @Post('lookup')
  @ApiOperation({ summary: 'Validate a Groupon voucher and reserve it' })
  @ApiOkResponse({ type: GrouponLookupResponseDto })
  @Public()
  async lookup(
    @Body() dto: GrouponLookupDto,
    @Req() req: Request & { requestId?: string },
  ): Promise<GrouponLookupResponseDto> {
    return this.grouponService.lookup(dto, {
      requestId: (req as any).requestId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a reserved Groupon voucher' })
  @ApiOkResponse({ type: GrouponRedeemResponseDto })
  @Public()
  async redeem(
    @Body() dto: GrouponRedeemDto,
    @Req() req: Request & { requestId?: string },
  ): Promise<GrouponRedeemResponseDto> {
    return this.grouponService.redeem(dto, {
      requestId: (req as any).requestId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}
