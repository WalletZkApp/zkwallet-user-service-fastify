import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { AccountUpdate, Mina, PublicKey, PrivateKey } from 'snarkyjs';

@Injectable()
export class OnchainService {
  private private_key: PrivateKey;
  private public_key: PublicKey;

  constructor(private configService: ConfigService<AllConfigType>) {
    this.private_key = configService.get('topup.minaPrivateKey', {
      infer: true,
    }) as PrivateKey;
    this.public_key = this.private_key.toPublicKey();
  }

  async sendMina(to: PublicKey, amount: number): Promise<boolean> {
    const tx = await Mina.transaction(this.public_key, () => {
      const accountUpdate = AccountUpdate.createSigned(this.public_key);
      accountUpdate.send({ to: to, amount: amount });
    });
    await tx.sign([this.private_key]).send();

    return true;
  }
}
