import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GrouponLookupDto {
  @ApiProperty({
    description: 'Groupon redemption code (or grouponCode) to validate',
    example: 'TFZ3D9F9',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  redemptionCode!: string;
}

export class GrouponMoneyDto {
  @ApiProperty({ example: 1500 })
  amount!: number;

  @ApiProperty({ example: 'USD' })
  currencyCode!: string;
}

export class GrouponAttributesDto {
  @ApiProperty({
    required: false,
    example: '65052698-4089-476e-a736-168d78d45768',
  })
  optionId?: string;

  @ApiProperty({ required: false, example: 'A sample option title' })
  optionTitle?: string;

  @ApiProperty({
    required: false,
    example: '48e9a666-7257-4615-b9c6-86bd4e73da4e',
  })
  dealId?: string;

  @ApiProperty({ required: false, example: 'A sample deal title' })
  dealTitle?: string;
}

export class GrouponVoucherDto {
  @ApiProperty({ example: 'GRPN-192837465' })
  grouponCode?: string;

  @ApiProperty({ example: 'TFZ3D9F9' })
  redemptionCode!: string;

  @ApiProperty({
    example: 'available',
    enum: ['available', 'redeemed', 'cancelled', 'refunded', 'expired'],
  })
  status!: string;

  @ApiProperty({ required: false, example: '2016-01-01T08:00:00-05:00' })
  redeemedAt?: string | null;

  @ApiProperty({ required: false, type: GrouponMoneyDto })
  value?: GrouponMoneyDto | null;

  @ApiProperty({ required: false, type: GrouponMoneyDto })
  price?: GrouponMoneyDto | null;

  @ApiProperty({ required: false, type: GrouponAttributesDto })
  attributes?: GrouponAttributesDto | null;
}

export class GrouponLookupResponseDto {
  @ApiProperty()
  reservationId!: string;

  @ApiProperty({ example: '2025-12-11T18:45:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ example: true })
  canProceed!: boolean;

  @ApiProperty({ type: GrouponVoucherDto })
  voucher!: GrouponVoucherDto;

  @ApiProperty({
    example: ':4-week-semaglutide',
    description:
      'Plan identifier for the frontend. Derived from the catalog (planSlug with the leading "groupon" removed).',
  })
  groupon!: string;
}
