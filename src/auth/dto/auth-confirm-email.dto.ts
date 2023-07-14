import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class AuthConfirmEmailDto {
  @ApiProperty()
  @IsOptional()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  hash: string;
}
