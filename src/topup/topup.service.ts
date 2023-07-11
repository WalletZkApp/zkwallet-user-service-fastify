import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { AllConfigType } from 'src/config/config.type';
import { PaymentRequestBody } from './types/PaymentRequestBody';

@Injectable()
export class TopupService {
  private stripe;

  constructor(private configService: ConfigService<AllConfigType>) {
    const apiSecretKey = configService.get('topup.stripeApiSecretKey', {
      infer: true,
    }) as string;
    this.stripe = new Stripe(apiSecretKey, {
      apiVersion: '2022-11-15',
    });
  }

  createPayment(paymentRequestBody: PaymentRequestBody): Promise<any> {
    let sumAmount = 0;
    paymentRequestBody.products.forEach((product) => {
      sumAmount = sumAmount + product.price * product.quantity;
    });
    return this.stripe.paymentIntents.create({
      amount: sumAmount * 100,
      currency: paymentRequestBody.currency,
    });
  }
}
