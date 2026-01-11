import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FedexTrackingPayload {
  carrier: string;
  currentStatus: string;
  deliveryLocation?: string | null;
  deliveredAt?: string | null;
  estimatedDelivery?: string | null;
  packageWeight?: string | null;
  eventTimeline: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
  }>;
}

@Injectable()
export class FedexTrackingService {
  private readonly logger = new Logger(FedexTrackingService.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchTracking(trackingNumber: string): Promise<FedexTrackingPayload> {
    if (!trackingNumber) {
      throw new BadRequestException('Tracking number is required');
    }

    const useMock =
      this.configService.get<boolean>('shipping.fedex.useMock') ?? true;
    const baseUrl =
      this.configService.get<string>('shipping.fedex.baseUrl') ?? '';
    const apiKey = this.configService.get<string>('shipping.fedex.apiKey');
    const apiSecret = this.configService.get<string>(
      'shipping.fedex.apiSecret',
    );

    if (useMock || !baseUrl || !apiKey || !apiSecret) {
      this.logger.debug(
        `Using mock FedEx tracking response for ${trackingNumber}`,
      );
      return this.buildMockResponse(trackingNumber);
    }

    try {
      // TODO: Integrate real FedEx API once credentials are available.
      // Placeholder to keep flow functional.
      return this.buildMockResponse(trackingNumber);
    } catch (error) {
      this.logger.error(
        `FedEx tracking request failed for ${trackingNumber}`,
        error as Error,
      );
      throw new InternalServerErrorException(
        'Unable to fetch tracking information from FedEx',
      );
    }
  }

  private buildMockResponse(trackingNumber: string): FedexTrackingPayload {
    this.logger.debug(`Returning mock tracking payload for ${trackingNumber}`);
    const deliveredAt = new Date();
    deliveredAt.setUTCHours(15, 30, 0, 0);

    return {
      carrier: 'FedEx Express',
      currentStatus: 'Delivered',
      deliveryLocation: 'ATLANTA, GA, US',
      deliveredAt: deliveredAt.toISOString(),
      estimatedDelivery: null,
      packageWeight: '5.0 KG',
      eventTimeline: [
        {
          date: this.offsetDate(-3),
          time: '14:20',
          status: 'Picked up',
          location: 'MEMPHIS, TN, US',
        },
        {
          date: this.offsetDate(-1),
          time: '23:00',
          status: 'Arrived at destination facility',
          location: 'ATLANTA, GA, US',
        },
        {
          date: this.offsetDate(0),
          time: '10:30',
          status: 'Delivered',
          location: 'ATLANTA, GA, US',
        },
      ],
    };
  }

  private offsetDate(daysFromToday: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + daysFromToday);
    return date.toISOString().split('T')[0];
  }
}
