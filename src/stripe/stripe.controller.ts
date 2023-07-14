import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentRequestBody } from '../stripe/types/PaymentRequestBody';
import { StripeService } from './stripe.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/roles/roles.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/roles/roles.guard';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Stripe')
@Controller({
  path: 'stripe',
  version: '1',
})
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createPayments(
    @Res() response: Response,
    @Body() paymentRequestBody: PaymentRequestBody,
  ) {
    this.stripeService
      .createPayment(paymentRequestBody)
      .then((res) => {
        response.status(HttpStatus.CREATED).json(res);
      })
      .catch((err) => {
        response.status(HttpStatus.BAD_REQUEST).json(err);
      });
  }
}
