import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';

export class OnChainDto {
  @ApiProperty()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty()
  @IsNotEmpty()
  amount: number;
}

export class OnChainGuardianDto {
  @ApiProperty()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty()
  @IsNotEmpty()
  nullifierMessage: string;
}

export class OnChainSmartWalletDto {
  @ApiProperty()
  @IsNotEmpty()
  otp: string;
}

export class OnChainSmartWalletTransferDto {
  @ApiProperty()
  @IsNotEmpty()
  otp: string;
}