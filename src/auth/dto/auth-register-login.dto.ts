import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
} from 'class-validator';
import { IsNotExist } from 'src/utils/validators/is-not-exists.validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from 'src/utils/transformers/lower-case.transformer';
import { Role } from 'src/roles/entities/role.entity';
import { Status } from 'src/statuses/entities/status.entity';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @Validate(IsNotExist, ['User'], {
    message: 'emailAlreadyExists',
  })
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsOptional()
  firstName: string | null;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsOptional()
  lastName: string | null;

  role: Role | null;
  status: Status | null;
}
