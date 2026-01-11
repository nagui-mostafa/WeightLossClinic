import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../common';
import { GrouponSignatureService } from './groupon-signature.service';
import {
  GrouponLookupDto,
  GrouponLookupResponseDto,
  GrouponVoucherDto,
} from './dto/lookup.dto';
import { GrouponRedeemDto, GrouponRedeemResponseDto } from './dto/redeem.dto';
import { RequestContext } from '../common/interfaces/request-context.interface';

// Fetch is available in modern Node runtimes; declare for TypeScript without DOM lib
declare const fetch: any;

interface GrouponApiVoucher {
  id?: string;
  grouponCode?: string;
  redemptionCode: string;
  status: string;
  redeemedAt?: string | null;
  value?: { amount: number; currencyCode: string } | null;
  price?: { amount: number; currencyCode: string } | null;
  attributes?: {
    optionId?: string;
    optionTitle?: string;
    dealId?: string;
    dealTitle?: string;
  } | null;
}

@Injectable()
export class GrouponService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly signature: GrouponSignatureService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(GrouponService.name);
  }

  private get baseUrl(): string {
    return this.configService.get<string>('groupon.baseUrl', {
      infer: true,
    })!;
  }

  private get configName(): string {
    return this.configService.get<string>('groupon.configName', {
      infer: true,
    })!;
  }

  private get clientId(): string {
    return (
      this.configService.get<string>('groupon.clientId', {
        infer: true,
      }) || ''
    ).trim();
  }

  private get apiKey(): string {
    return this.configService.get<string>('groupon.apiKey', { infer: true })!;
  }

  private get nonce(): string {
    return this.configService.get<string>('groupon.nonce', { infer: true })!;
  }

  private get reservationTtlMs(): number {
    return this.configService.get<number>('groupon.reservationTtlMs', {
      infer: true,
    })!;
  }

  private get retryMax(): number {
    const value = this.configService.get<number>('groupon.retryMax', {
      infer: true,
    });
    if (typeof value !== 'number' || Number.isNaN(value) || value < 1) {
      return 1;
    }
    return Math.floor(value);
  }

  private get retryBackoffMs(): number {
    const value = this.configService.get<number>('groupon.retryBackoffMs', {
      infer: true,
    });
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
      return 0;
    }
    return Math.floor(value);
  }

  private get useMock(): boolean {
    return (
      this.configService.get<boolean>('groupon.useMock', {
        infer: true,
      }) ?? false
    );
  }

  async lookup(
    dto: GrouponLookupDto,
    context: RequestContext,
  ): Promise<GrouponLookupResponseDto> {
    if (this.useMock) {
      return this.mockLookup(dto, context);
    }
    const code = dto.redemptionCode.trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('redemptionCode is required');
    }

    this.logEvent('log', 'groupon.lookup.request', {
      redemptionCode: code,
      requestId: context.requestId,
      ip: context.ip,
      userAgent: context.userAgent,
      configName: this.configName,
    });

    const catalog = await this.prisma.grouponCodeCatalog.findUnique({
      where: { code },
    });
    this.logEvent('log', 'groupon.lookup.catalog', {
      redemptionCode: code,
      requestId: context.requestId,
      found: Boolean(catalog),
      catalog: catalog
        ? {
            planSlug: catalog.planSlug,
            productToken: catalog.productToken,
            planWeeks: catalog.planWeeks,
            dealName: catalog.dealName,
          }
        : null,
    });
    if (!catalog) {
      this.logEvent('warn', 'groupon.lookup.response', {
        redemptionCode: code,
        requestId: context.requestId,
        ok: false,
        reason: 'Unknown Groupon code',
      });
      throw new BadRequestException('Unknown Groupon code');
    }

    // call Groupon GET
    const url = `${this.baseUrl}/${this.configName}/v1/units?redemptionCodes=${encodeURIComponent(
      code,
    )}&show=deal_info,option_info`;
    this.logEvent('log', 'groupon.lookup.groupon_request', {
      redemptionCode: code,
      requestId: context.requestId,
      url,
      method: 'GET',
    });
    const responseJson = await this.callGroupon('GET', url, '', context, {
      flow: 'lookup',
      redemptionCode: code,
    });
    const voucher = this.pickFirstVoucher(responseJson);

    if (!voucher) {
      this.logEvent('warn', 'groupon.lookup.groupon_response', {
        redemptionCode: code,
        requestId: context.requestId,
        response: responseJson,
        hasVoucher: false,
      });
      this.logEvent('warn', 'groupon.lookup.response', {
        redemptionCode: code,
        requestId: context.requestId,
        ok: false,
        reason: 'Voucher not found',
      });
      throw new NotFoundException('Voucher not found');
    }

    this.logEvent('log', 'groupon.lookup.groupon_response', {
      redemptionCode: code,
      requestId: context.requestId,
      response: responseJson,
      voucher: {
        redemptionCode: voucher.redemptionCode,
        status: voucher.status,
        redeemedAt: voucher.redeemedAt ?? null,
        grouponCode: voucher.grouponCode ?? null,
      },
      hasVoucher: true,
    });

    if (!this.isAvailable(voucher.status)) {
      this.logEvent('warn', 'groupon.lookup.unavailable', {
        redemptionCode: voucher.redemptionCode,
        requestId: context.requestId,
        status: voucher.status,
        redeemedAt: voucher.redeemedAt ?? null,
      });
      const reason =
        voucher.status?.toLowerCase?.() === 'redeemed' && voucher.redeemedAt
          ? `Voucher already redeemed at ${voucher.redeemedAt}`
          : `Voucher is ${voucher.status}`;
      this.logEvent('warn', 'groupon.lookup.response', {
        redemptionCode: voucher.redemptionCode,
        requestId: context.requestId,
        ok: false,
        reason,
      });
      throw new BadRequestException(reason);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.reservationTtlMs);

    // expire old holds if needed
    const existing = await this.prisma.grouponVoucher.findUnique({
      where: { redemptionCode: voucher.redemptionCode },
    });
    this.logEvent('log', 'groupon.lookup.db.existing', {
      redemptionCode: voucher.redemptionCode,
      requestId: context.requestId,
      existing: existing
        ? {
            id: existing.id,
            status: existing.status,
            reservationExpiresAt:
              existing.reservationExpiresAt?.toISOString?.(),
            redeemedAt: existing.redeemedAt?.toISOString?.(),
            recordId: existing.recordId,
          }
        : null,
    });
    if (
      existing &&
      existing.status === 'RESERVED' &&
      existing.reservationExpiresAt &&
      existing.reservationExpiresAt.getTime() < now.getTime()
    ) {
      await this.prisma.grouponVoucher.update({
        where: { id: existing.id },
        data: { status: 'RELEASED', reservationExpiresAt: null },
      });
      this.logEvent('log', 'groupon.lookup.db.expired_release', {
        redemptionCode: voucher.redemptionCode,
        requestId: context.requestId,
        releasedId: existing.id,
      });
    }

    if (
      existing &&
      existing.status === 'RESERVED' &&
      existing.reservationExpiresAt &&
      existing.reservationExpiresAt.getTime() >= now.getTime()
    ) {
      this.logEvent('warn', 'groupon.lookup.reserved_conflict', {
        redemptionCode: voucher.redemptionCode,
        requestId: context.requestId,
        reservationExpiresAt: existing.reservationExpiresAt.toISOString(),
      });
      throw new ConflictException('Voucher is reserved by another session');
    }

    const payload = this.buildPayloadForPersistence(voucher, responseJson);

    const upserted = await this.prisma.grouponVoucher.upsert({
      where: { redemptionCode: voucher.redemptionCode },
      update: {
        ...payload,
        status: 'RESERVED',
        reservationExpiresAt: expiresAt,
      },
      create: {
        ...payload,
        status: 'RESERVED',
        reservationExpiresAt: expiresAt,
      },
    });

    this.logEvent('log', 'groupon.lookup.db.upsert', {
      redemptionCode: voucher.redemptionCode,
      requestId: context.requestId,
      id: upserted.id,
      status: upserted.status,
      reservationExpiresAt: upserted.reservationExpiresAt?.toISOString?.(),
    });

    const response: GrouponLookupResponseDto = {
      reservationId: upserted.id,
      expiresAt: upserted.reservationExpiresAt!.toISOString(),
      canProceed: true,
      voucher: this.toVoucherDto(voucher),
      groupon: catalog.planSlug.replace(/^groupon:/i, ''),
    };
    this.logEvent('log', 'groupon.lookup.response', {
      redemptionCode: voucher.redemptionCode,
      requestId: context.requestId,
      ok: true,
      response,
    });
    return response;
  }

  async redeem(
    dto: GrouponRedeemDto,
    context: RequestContext,
  ): Promise<GrouponRedeemResponseDto> {
    this.ensureValidUuid(dto.reservationId, 'reservationId');
    if (this.useMock) {
      return this.mockRedeem(dto);
    }
    this.logEvent('log', 'groupon.redeem.request', {
      reservationId: dto.reservationId,
      requestId: context.requestId,
      ip: context.ip,
      userAgent: context.userAgent,
      configName: this.configName,
    });
    const reservation = await this.prisma.grouponVoucher.findUnique({
      where: { id: dto.reservationId },
    });
    this.logEvent('log', 'groupon.redeem.db.reservation', {
      reservationId: dto.reservationId,
      requestId: context.requestId,
      reservation: reservation
        ? {
            id: reservation.id,
            redemptionCode: reservation.redemptionCode,
            status: reservation.status,
            reservationExpiresAt:
              reservation.reservationExpiresAt?.toISOString?.(),
            redeemedAt: reservation.redeemedAt?.toISOString?.(),
            recordId: reservation.recordId,
          }
        : null,
    });
    if (!reservation) {
      this.logEvent('warn', 'groupon.redeem.response', {
        reservationId: dto.reservationId,
        requestId: context.requestId,
        ok: false,
        reason: 'Reservation not found',
      });
      throw new NotFoundException('Reservation not found');
    }

    const now = new Date();
    if (
      reservation.reservationExpiresAt &&
      reservation.reservationExpiresAt.getTime() < now.getTime()
    ) {
      await this.prisma.grouponVoucher.update({
        where: { id: reservation.id },
        data: { status: 'RELEASED', reservationExpiresAt: null },
      });
      this.logEvent('warn', 'groupon.redeem.expired', {
        reservationId: reservation.id,
        requestId: context.requestId,
        redemptionCode: reservation.redemptionCode,
      });
      throw new BadRequestException(
        'Reservation expired. Please re-validate the voucher.',
      );
    }

    if (reservation.status !== 'RESERVED') {
      this.logEvent('warn', 'groupon.redeem.response', {
        reservationId: reservation.id,
        requestId: context.requestId,
        ok: false,
        reason: 'Voucher is not in reserved state',
        status: reservation.status,
      });
      throw new BadRequestException('Voucher is not in reserved state');
    }

    const body = JSON.stringify({
      data: [
        {
          redemptionCode: reservation.redemptionCode,
          status: 'redeemed',
          updatedAt: now.toISOString(),
        },
      ],
    });

    const url = `${this.baseUrl}/${this.configName}/v1/units`;
    const maxAttempts = 3;
    const baseDelayMs = 250;
    let lastResponse: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      this.logEvent('log', 'groupon.redeem.groupon_request', {
        reservationId: reservation.id,
        redemptionCode: reservation.redemptionCode,
        requestId: context.requestId,
        attempt,
        url,
        method: 'PATCH',
      });
      const res = await this.callGrouponRaw('PATCH', url, body);
      const errors = Array.isArray(res.json?.errors) ? res.json.errors : [];
      const errorCodes = this.extractErrorCodes(res.json);
      this.logEvent('log', 'groupon.redeem.groupon_response', {
        reservationId: reservation.id,
        redemptionCode: reservation.redemptionCode,
        requestId: context.requestId,
        attempt,
        status: res.status,
        response: res.json,
        errorCodes,
      });

      if (res.ok && errors.length === 0) {
        lastResponse = res.json;
        break;
      }

      // Handle non-unknown errors immediately.
      if (!errorCodes.includes('UNKNOWN_ERROR')) {
        if (errors.length > 0) {
          const first = errors[0];
          const msg =
            first?.code === 'INVALID_STATE_TRANSITION'
              ? 'Voucher already redeemed'
              : (first?.code ?? 'Redemption failed');
          this.logEvent('warn', 'groupon.redeem.response', {
            reservationId: reservation.id,
            redemptionCode: reservation.redemptionCode,
            requestId: context.requestId,
            ok: false,
            reason: msg,
            errorCodes,
          });
          throw new BadRequestException(msg);
        }
        const fallbackMsg =
          res.json?.message || res.json?.error?.message || 'Redemption failed';
        this.logEvent('warn', 'groupon.redeem.response', {
          reservationId: reservation.id,
          redemptionCode: reservation.redemptionCode,
          requestId: context.requestId,
          ok: false,
          reason: fallbackMsg,
          errorCodes,
        });
        throw new BadRequestException(fallbackMsg);
      }

      // UNKNOWN_ERROR: check status before retrying
      const status = await this.fetchVoucherStatus(
        reservation.redemptionCode,
        context,
      ).catch(() => null);
      if (status?.status?.toLowerCase?.() === 'redeemed') {
        const redeemedAtFromGroupon = status.redeemedAt
          ? new Date(status.redeemedAt)
          : null;
        const reservedAt = reservation.reservationExpiresAt
          ? new Date(
              reservation.reservationExpiresAt.getTime() -
                this.reservationTtlMs,
            )
          : (reservation.updatedAt ?? reservation.createdAt);

        const likelyAlreadyRedeemed =
          !redeemedAtFromGroupon ||
          (reservedAt &&
            redeemedAtFromGroupon.getTime() < reservedAt.getTime());

        const redeemedAt = redeemedAtFromGroupon ?? now;
        await this.prisma.grouponVoucher.update({
          where: { id: reservation.id },
          data: {
            status: 'REDEEMED',
            redeemedAt,
            rawPayload: {
              source: 'groupon',
              statusCheck: status ? JSON.parse(JSON.stringify(status)) : null,
            },
          },
        });
        this.logEvent('log', 'groupon.redeem.db.update', {
          reservationId: reservation.id,
          redemptionCode: reservation.redemptionCode,
          requestId: context.requestId,
          status: 'REDEEMED',
          redeemedAt: redeemedAt.toISOString(),
        });

        if (likelyAlreadyRedeemed) {
          this.logEvent('warn', 'groupon.redeem.response', {
            reservationId: reservation.id,
            redemptionCode: reservation.redemptionCode,
            requestId: context.requestId,
            ok: false,
            reason: 'Voucher already redeemed',
          });
          throw new BadRequestException('Voucher already redeemed');
        }

        const response: GrouponRedeemResponseDto = {
          status: 'redeemed',
          redeemedAt: redeemedAt.toISOString(),
        };
        this.logEvent('log', 'groupon.redeem.response', {
          reservationId: reservation.id,
          redemptionCode: reservation.redemptionCode,
          requestId: context.requestId,
          ok: true,
          response,
        });
        return response;
      }

      if (attempt < maxAttempts) {
        await this.sleep(baseDelayMs * attempt);
        continue;
      }

      this.logEvent('warn', 'groupon.redeem.response', {
        reservationId: reservation.id,
        redemptionCode: reservation.redemptionCode,
        requestId: context.requestId,
        ok: false,
        reason: 'Redemption failed (UNKNOWN_ERROR)',
      });
      throw new BadRequestException('Redemption failed (UNKNOWN_ERROR)');
    }

    await this.prisma.grouponVoucher.update({
      where: { id: reservation.id },
      data: {
        status: 'REDEEMED',
        redeemedAt: now,
        rawPayload: lastResponse,
      },
    });
    this.logEvent('log', 'groupon.redeem.db.update', {
      reservationId: reservation.id,
      redemptionCode: reservation.redemptionCode,
      requestId: context.requestId,
      status: 'REDEEMED',
      redeemedAt: now.toISOString(),
    });

    const response: GrouponRedeemResponseDto = {
      status: 'redeemed',
      redeemedAt: now.toISOString(),
    };
    this.logEvent('log', 'groupon.redeem.response', {
      reservationId: reservation.id,
      redemptionCode: reservation.redemptionCode,
      requestId: context.requestId,
      ok: true,
      response,
    });
    return response;
  }

  async fetchVoucherStatus(
    redemptionCode: string,
    context: RequestContext,
  ): Promise<GrouponVoucherDto | null> {
    if (this.useMock) {
      return {
        grouponCode: redemptionCode,
        redemptionCode,
        status: 'redeemed',
        redeemedAt: new Date().toISOString(),
        value: null,
        price: null,
        attributes: null,
      };
    }
    const url = `${this.baseUrl}/${this.configName}/v1/units?redemptionCodes=${encodeURIComponent(
      redemptionCode,
    )}&show=deal_info,option_info`;
    const responseJson = await this.callGroupon('GET', url, '', context, {
      flow: 'status',
      redemptionCode,
    });
    const voucher = this.pickFirstVoucher(responseJson);
    return voucher ? this.toVoucherDto(voucher) : null;
  }

  private async mockLookup(
    dto: GrouponLookupDto,
    context: RequestContext,
  ): Promise<GrouponLookupResponseDto> {
    const code = dto.redemptionCode.trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('redemptionCode is required');
    }

    const catalog = await this.prisma.grouponCodeCatalog.findUnique({
      where: { code },
    });
    if (!catalog) {
      throw new BadRequestException('Unknown Groupon code');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.reservationTtlMs);
    const existing = await this.prisma.grouponVoucher.findUnique({
      where: { redemptionCode: code },
    });

    if (existing && existing.status === 'REDEEMED') {
      const when =
        existing.redeemedAt?.toISOString?.() ??
        existing.reservationExpiresAt?.toISOString?.() ??
        'previously';
      throw new BadRequestException(
        `Voucher already redeemed (mock) at ${when}`,
      );
    }

    if (
      existing &&
      existing.status === 'RESERVED' &&
      existing.reservationExpiresAt &&
      existing.reservationExpiresAt.getTime() >= now.getTime()
    ) {
      throw new ConflictException('Voucher is reserved by another session');
    }

    if (
      existing &&
      existing.status === 'RESERVED' &&
      existing.reservationExpiresAt &&
      existing.reservationExpiresAt.getTime() < now.getTime()
    ) {
      await this.prisma.grouponVoucher.update({
        where: { id: existing.id },
        data: { status: 'RELEASED', reservationExpiresAt: null },
      });
    }

    const voucher: GrouponApiVoucher = {
      grouponCode: code,
      redemptionCode: code,
      status: 'available',
      redeemedAt: null,
      value: { amount: 2000, currencyCode: 'USD' },
      price: { amount: 1500, currencyCode: 'USD' },
      attributes: {
        optionId: 'mock-option',
        optionTitle: 'Mock Option',
        dealId: 'mock-deal',
        dealTitle: 'Mock Deal',
      },
    };
    const payload = this.buildPayloadForPersistence(voucher, {
      source: 'mock',
      timestamp: now.toISOString(),
    });

    const upserted = await this.prisma.grouponVoucher.upsert({
      where: { redemptionCode: voucher.redemptionCode },
      update: {
        ...payload,
        status: 'RESERVED',
        reservationExpiresAt: expiresAt,
      },
      create: {
        ...payload,
        status: 'RESERVED',
        reservationExpiresAt: expiresAt,
      },
    });

    return {
      reservationId: upserted.id,
      expiresAt: upserted.reservationExpiresAt!.toISOString(),
      canProceed: true,
      voucher: this.toVoucherDto(voucher),
      groupon: catalog.planSlug.replace(/^groupon:/i, ''),
    };
  }

  private async mockRedeem(
    dto: GrouponRedeemDto,
  ): Promise<GrouponRedeemResponseDto> {
    const reservation = await this.prisma.grouponVoucher.findUnique({
      where: { id: dto.reservationId },
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (reservation.status !== 'RESERVED') {
      throw new BadRequestException('Voucher is not in reserved state');
    }
    const now = new Date();
    await this.prisma.grouponVoucher.update({
      where: { id: reservation.id },
      data: {
        status: 'REDEEMED',
        redeemedAt: now,
        rawPayload: { source: 'mock', redeemedAt: now.toISOString() },
      },
    });
    return { status: 'redeemed', redeemedAt: now.toISOString() };
  }

  private async callGroupon(
    method: 'GET' | 'PATCH',
    url: string,
    body: string,
    context: RequestContext,
    meta?: { flow?: 'lookup' | 'status' | 'redeem'; redemptionCode?: string },
  ): Promise<any> {
    if (this.useMock) {
      return { data: [] };
    }

    const maxAttempts = this.retryMax;
    const baseDelayMs = this.retryBackoffMs;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const res = await this.callGrouponRaw(method, url, body);
      if (res.ok) {
        return res.json;
      }

      const errorCodes = this.extractErrorCodes(res.json);
      const isUnknownError = errorCodes.includes('UNKNOWN_ERROR');
      if (isUnknownError && attempt < maxAttempts) {
        this.logger.warn(
          {
            attempt,
            status: res.status,
            url,
            errorCodes,
          },
          `Groupon ${method} returned UNKNOWN_ERROR, retrying`,
        );
        await this.sleep(baseDelayMs * attempt);
        continue;
      }

      lastError = { res, errorCodes };
      break;
    }

    const errorCodes = lastError?.errorCodes || [];
    const errorSummary = errorCodes.length ? ` (${errorCodes.join(', ')})` : '';
    if (meta?.flow) {
      this.logEvent('warn', `groupon.${meta.flow}.groupon_error`, {
        redemptionCode: meta.redemptionCode,
        requestId: context.requestId,
        url,
        status: lastError?.res?.status,
        errorCodes,
        response: lastError?.res?.json,
      });
    }
    this.logger.warn(
      {
        status: lastError?.res?.status,
        url,
        clientIdPrefix: this.clientId?.slice?.(0, 6),
        bodySent: method === 'PATCH' ? body : undefined,
        response: lastError?.res?.json,
      },
      `Groupon ${method} failed`,
    );
    throw new BadRequestException(
      lastError?.res?.json?.message ||
        lastError?.res?.json?.error?.message ||
        (errorCodes.length
          ? `Groupon request failed${errorSummary}`
          : 'Groupon request failed'),
    );
  }

  private async callGrouponRaw(
    method: 'GET' | 'PATCH',
    url: string,
    body: string,
  ): Promise<{ ok: boolean; status: number; json: any }> {
    // Groupon examples use the same value for nonce and X-Request-ID (33 chars).
    const nonce = `${randomBytes(16).toString('hex')}1`;
    const signature = this.signature.generateSignature(
      method,
      url,
      body,
      nonce,
      this.apiKey,
    );
    const headers: Record<string, string> = {
      Authorization: `groupon-third-party version="1.1",digest="HMAC-SHA1",nonce="${nonce}",signature="${signature}"`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'X-Client-ID': this.clientId,
      'X-Request-ID': nonce,
    };

    this.logger.debug(
      {
        url,
        clientIdPrefix: this.clientId?.slice?.(0, 6),
        nonce,
        hasBody: !!body,
        reqId: nonce,
      },
      `Groupon ${method} request`,
    );

    const res = await fetch(url, {
      method,
      headers,
      body: method === 'PATCH' ? body : undefined,
    });

    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  }

  private extractErrorCodes(json: any): string[] {
    if (!Array.isArray(json?.errors)) {
      return [];
    }
    return json.errors
      .map((e: any) => (typeof e?.code === 'string' ? e.code : null))
      .filter((code: string | null): code is string => Boolean(code));
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private pickFirstVoucher(apiResponse: any): GrouponApiVoucher | null {
    const data = apiResponse?.data;
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as GrouponApiVoucher;
    }
    return null;
  }

  private isAvailable(status: string): boolean {
    return status?.toLowerCase?.() === 'available';
  }

  private buildPayloadForPersistence(
    voucher: GrouponApiVoucher,
    raw: any,
  ): Prisma.GrouponVoucherUncheckedCreateInput {
    return {
      grouponCode: voucher.grouponCode ?? null,
      redemptionCode: voucher.redemptionCode,
      optionId: voucher.attributes?.optionId ?? null,
      optionTitle: voucher.attributes?.optionTitle ?? null,
      dealId: voucher.attributes?.dealId ?? null,
      dealTitle: voucher.attributes?.dealTitle ?? null,
      priceAmount: voucher.price?.amount ?? null,
      priceCurrency: voucher.price?.currencyCode ?? null,
      valueAmount: voucher.value?.amount ?? null,
      valueCurrency: voucher.value?.currencyCode ?? null,
      rawPayload: raw ?? null,
    };
  }

  private toVoucherDto(voucher: GrouponApiVoucher): GrouponVoucherDto {
    return {
      grouponCode: voucher.grouponCode,
      redemptionCode: voucher.redemptionCode,
      status: voucher.status,
      redeemedAt: voucher.redeemedAt ?? null,
      value: voucher.value
        ? {
            amount: voucher.value.amount,
            currencyCode: voucher.value.currencyCode,
          }
        : null,
      price: voucher.price
        ? {
            amount: voucher.price.amount,
            currencyCode: voucher.price.currencyCode,
          }
        : null,
      attributes: voucher.attributes
        ? {
            optionId: voucher.attributes.optionId,
            optionTitle: voucher.attributes.optionTitle,
            dealId: voucher.attributes.dealId,
            dealTitle: voucher.attributes.dealTitle,
          }
        : null,
    };
  }

  private logEvent(
    level: 'log' | 'warn' | 'error' | 'debug',
    event: string,
    payload: Record<string, unknown>,
  ) {
    const entry = {
      ts: new Date().toISOString(),
      event,
      ...payload,
    };
    switch (level) {
      case 'warn':
        this.logger.warn(entry, event);
        break;
      case 'error':
        this.logger.error(entry, event);
        break;
      case 'debug':
        this.logger.debug(entry, event);
        break;
      default:
        this.logger.info(entry, event);
        break;
    }
  }

  private ensureValidUuid(value: string, field: string) {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!value || !uuidRegex.test(value)) {
      throw new BadRequestException(`Invalid ${field} format`);
    }
  }
}
