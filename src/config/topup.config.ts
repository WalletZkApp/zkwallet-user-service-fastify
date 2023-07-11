import { registerAs } from '@nestjs/config';
import { IsString, IsOptional } from 'class-validator';
import validateConfig from 'src/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  STRIPE_API_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  MINA_PRIVATE_KEY: string;
}

export default registerAs('topup', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    stripeApiSecretKey: process.env.STRIPE_API_SECRET_KEY,
    minaPrivateKey: process.env.MINA_PRIVATE_KEY,
  };
});
