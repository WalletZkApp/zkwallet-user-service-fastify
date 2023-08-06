import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUrl,
  MinLength,
  Validate,
} from 'class-validator';
import { IsNotExist } from 'src/utils/validators/is-not-exists.validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from 'src/utils/transformers/lower-case.transformer';
import { Status } from 'src/statuses/entities/status.entity';

export class AuthRegisterGuardianLoginDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @Validate(IsNotExist, ['User'], {
    message: 'emailAlreadyExists',
  })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  @MinLength(6)
  password: string | null;

  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsNotExist, ['Guardian'], {
    message: 'registrationNumberAlreadyExists',
  })
  registrationNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsNotExist, ['Guardian'], {
    message: 'companyNameAlreadyExists',
  })
  companyName: string;

  @ApiProperty()
  @IsOptional()
  displayName?: string;

  @ApiProperty()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsOptional()
  address?: string;

  @ApiProperty()
  @IsOptional()
  city?: string;

  @ApiProperty()
  @IsOptional()
  state?: string;

  @ApiProperty()
  @IsOptional()
  zip?: string;

  @ApiProperty()
  @IsOptional()
  country?: string;

  @ApiProperty()
  @IsNumberString()
  phonenumber: string;

  @ApiProperty({ example: 'https://www.example.com' })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @Validate(IsNotExist, ['Guardian'], {
    message: 'websiteAlreadyExists',
  })
  @IsUrl()
  website: string;

  @ApiProperty({ type: Status })
  @IsOptional()
  status?: Status | null;

  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsNotExist, ['Guardian'], {
    message: 'walletAddressAlreadyExists',
  })
  walletAddress: string;
}
