import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountUpdate,
  Mina,
  PublicKey,
  PrivateKey,
  fetchAccount,
} from 'snarkyjs';
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
    const berkeley = Mina.Network(
      'https://proxy.berkeley.minaexplorer.com/graphql',
    );
    Mina.setActiveInstance(berkeley);

    this.privateKey = PrivateKey.fromBase58(privateKeyFromConf);
    this.publicKey = this.privateKey.toPublicKey();
  }

  async sendMina(receiver: string, amount: number): Promise<boolean> {
    console.log(`Sending ${amount} Mina to ${receiver}`);
    const receiverPublicKey: PublicKey = PublicKey.fromBase58(receiver);

    const transactionFee = 100_000_000;

    const response = await fetchAccount({ publicKey: this.publicKey });
    if (response.error) throw Error(response.error.statusText);
    const { nonce, balance } = response.account;
    console.log(
      `Using fee payer account with nonce ${nonce}, balance ${balance}`,
    );

    const tx = await Mina.transaction(
      { sender: this.publicKey, fee: transactionFee },
      () => {
        const accountUpdate = AccountUpdate.fundNewAccount(this.publicKey);
        accountUpdate.send({ to: receiverPublicKey, amount: 1e9 * amount });
      },
    );
    // fill in the proof - this can take a while...
    console.log('Creating an execution proof...');
    await tx.prove();

    // send the transaction to the graphql endpoint
    console.log('Sending the transaction...');
    await tx.sign([this.privateKey]).send();

    return true;
  }
}
