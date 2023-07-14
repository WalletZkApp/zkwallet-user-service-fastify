import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumberString,
  IsUrl,
  IsNotEmpty,
  Validate,
  IsOptional,
  MinLength,
} from 'class-validator';
import { IsExist } from 'src/utils/validators/is-exists.validator';
import { lowerCaseTransformer } from 'src/utils/transformers/lower-case.transformer';
import { IsNotExist } from 'src/utils/validators/is-not-exists.validator';
import { Status } from 'src/statuses/entities/status.entity';

export { CreateGuardianDto, UpdateGuardianDto };

class CreateGuardianDto {
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

  displayName?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
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

  identityCommitment?: string;
  hash?: string | null;

  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsNotExist, ['Guardian'], {
    message: 'walletAddressAlreadyExists',
  })
  walletAddress?: string | null;
}

class UpdateGuardianDto {
  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsExist, ['Guardian'], {
    message: 'registrationNumberNotExists',
  })
  registrationNumber?: string;

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

  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @Validate(IsExist, ['Guardian'], {
    message: 'emailNotExists',
  })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNumberString()
  @IsOptional()
  phonenumber: string;

  @ApiProperty({ example: 'https://www.example.com' })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @Validate(IsExist, ['Guardian'], {
    message: 'websiteNotExists',
  })
  @IsUrl()
  website: string;

  @ApiProperty()
  @IsOptional()
  identityCommitment?: string;

  @ApiProperty()
  @IsOptional()
  hash?: string;

  @ApiProperty()
  @IsOptional()
  walletAddress?: string;
}
