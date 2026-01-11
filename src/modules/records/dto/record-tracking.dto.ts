import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class RecordTrackingEventDto {
  @ApiProperty({ example: '2024-10-29' })
  @IsString()
  date!: string;

  @ApiProperty({ example: '14:20' })
  @IsString()
  time!: string;

  @ApiProperty({ example: 'Picked up' })
  @IsString()
  status!: string;

  @ApiProperty({ example: 'MEMPHIS, TN, US' })
  @IsString()
  location!: string;
}

export class RecordTrackingDetailsDto {
  @ApiProperty({ example: 'rec_sarah_1' })
  recordId!: string;

  @ApiPropertyOptional({ example: '123456789012' })
  trackingNumber?: string | null;

  @ApiProperty({ example: 'FedEx Express' })
  carrier!: string;

  @ApiProperty({ example: 'Delivered' })
  currentStatus!: string;

  @ApiPropertyOptional({ example: 'ATLANTA, GA, US' })
  deliveryLocation?: string | null;

  @ApiPropertyOptional({ example: '2024-11-01T10:30:00-05:00' })
  deliveredAt?: string | null;

  @ApiPropertyOptional({ example: '2024-11-02T18:00:00-05:00' })
  estimatedDelivery?: string | null;

  @ApiPropertyOptional({ example: '5.0 KG' })
  packageWeight?: string | null;

  @ApiProperty({ type: [RecordTrackingEventDto] })
  eventTimeline!: RecordTrackingEventDto[];

  @ApiPropertyOptional({ example: 'Tracking number not found' })
  error?: string | null;
}

export class RecordTrackingBatchRequestDto {
  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: 20,
    example: ['rec_sarah_1', 'rec_david_1'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  ids!: string[];
}

export class RecordTrackingBatchResponseDto {
  @ApiProperty({ type: [RecordTrackingDetailsDto] })
  items!: RecordTrackingDetailsDto[];
}
