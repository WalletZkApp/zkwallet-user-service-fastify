import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { AccountUpdate, Mina, PublicKey, PrivateKey } from 'snarkyjs';

@Injectable()
export class OnchainService {
  private privateKey: PrivateKey;
  private publicKey: PublicKey;

  constructor(private configService: ConfigService<AllConfigType>) {
    this.privateKey = configService.get('topup.minaPrivateKey', {
      infer: true,
    }) as PrivateKey;
    this.publicKey = configService.get('topup.minaPublicKey', {
      infer: true,
    }) as PublicKey;
  }

  async sendMina(to: string, amount: number): Promise<boolean> {
    const receiverPublicKey: PublicKey = PublicKey.fromBase58(to);
    const tx = await Mina.transaction(this.publicKey, () => {
      const accountUpdate = AccountUpdate.createSigned(this.publicKey);
      accountUpdate.send({ to: receiverPublicKey, amount: amount });
    });
    await tx.sign([this.privateKey]).send();

    return true;
  }
}
