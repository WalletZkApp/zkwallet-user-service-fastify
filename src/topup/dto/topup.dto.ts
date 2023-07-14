import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';

export class TopUpDto {
  @ApiProperty()
  @IsNotEmpty()
  account: string;

  @ApiProperty()
  @IsNotEmpty()
  amount: number;
}
