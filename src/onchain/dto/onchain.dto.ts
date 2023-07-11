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
