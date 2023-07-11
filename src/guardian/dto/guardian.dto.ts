import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumberString,
  IsUrl,
  IsNotEmpty,
  Validate,
  IsOptional,
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

  displayName?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;

  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @Validate(IsNotExist, ['Guardian'], {
    message: 'emailAlreadyExists',
  })
  @IsEmail()
  email: string;

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
  @Validate(IsExist, ['Status', 'id'], {
    message: 'statusNotExists',
  })
  status?: Status;

  identityCommitment?: string;
  hash?: string | null;
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

  @ApiProperty({ type: Status })
  @IsOptional()
  status?: Status;

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

// class UpdateGuardianDto {
//   @ApiProperty()
//   @IsOptional()
//   registrationNumber?: string;

//   @ApiProperty()
//   @IsOptional()
//   displayName?: string;

//   @ApiProperty()
//   @IsOptional()
//   description?: string;

//   @ApiProperty()
//   @IsOptional()
//   address?: string;

//   @ApiProperty()
//   @IsOptional()
//   city?: string;

//   @ApiProperty()
//   @IsOptional()
//   state?: string;

//   @ApiProperty()
//   @IsOptional()
//   zip?: string;

//   @ApiProperty()
//   @IsOptional()
//   country?: string;

//   @ApiProperty({ example: 'test1@example.com' })
//   @Transform(lowerCaseTransformer)
//   @IsOptional()
//   @Validate(IsNotExist, ['Guardian'], {
//     message: 'emailAlreadyExists',
//   })
//   @IsEmail()
//   email?: string | null;

//   @ApiProperty()
//   @IsNumberString()
//   @IsOptional()
//   phonenumber?: string;

//   @ApiProperty()
//   @IsUrl()
//   @IsOptional()
//   website?: string;

//   @ApiProperty({ type: Status })
//   @Validate(IsExist, ['Status', 'id'], {
//     message: 'statusNotExists',
//   })
//   @IsOptional()
//   status?: Status;

//   identityCommitment?: string | null;
//   hash?: string | null;
//   walletAddress?: string | null;
// }
