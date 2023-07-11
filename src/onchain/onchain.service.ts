import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountUpdate, Mina, PublicKey, PrivateKey } from 'snarkyjs';
import { AllConfigType } from 'src/config/config.type';

@Injectable()
export class OnchainService {
  private privateKey: PrivateKey;
  private publicKey: PublicKey;

  constructor(private configService: ConfigService<AllConfigType>) {
    const privateKeyFromConf: string = configService.get(
      'topup.minaPrivateKey',
      {
        infer: true,
      },
    ) as string;
    this.privateKey = PrivateKey.fromBase58(privateKeyFromConf);
    this.publicKey = this.privateKey.toPublicKey();
  }

  async sendMina(receiver: string, amount: number): Promise<boolean> {
    const receiverPublicKey: PublicKey = PublicKey.fromBase58(receiver);

    const tx = await Mina.transaction(this.publicKey, () => {
      const accountUpdate = AccountUpdate.fundNewAccount(this.publicKey);
      accountUpdate.send({ to: receiverPublicKey, amount: amount });
    });
    await tx.sign([this.privateKey]).send();

    return true;
  }
}
