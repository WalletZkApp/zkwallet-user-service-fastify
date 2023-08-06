import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import bs58check from 'bs58check';
import Client from 'mina-signer';
import { Buffer } from 'safe-buffer';
import {
  AccountUpdate,
  Mina,
  PublicKey,
  PrivateKey,
  fetchAccount,
  Field,
  MerkleTree,
  UInt64,
} from 'snarkyjs';
import { AllConfigType } from 'src/config/config.type';
import { Guardian, GuardianZkApp } from 'src/contracts/src/guardians';
import { WalletStateZkApp, WalletZkApp } from 'src/contracts/src/wallet';
import { RecoveryZkApp } from 'src/contracts/src/recovery';
import { DEFAULT_PERIOD } from 'src/contracts/src/constant';
import { TokenGenerator } from 'totp-generator-ts';
import { Otp } from 'src/contracts/src/otps/otp';

const GUARDIAN_ZKAPP_ADDRESS: PublicKey = PublicKey.empty();

@Injectable()
export class OnchainService {
  private privateKey: PrivateKey;
  private publicKey: PublicKey;
  private guardianZkApp: GuardianZkApp;
  private counter: number;
  private guardianTree: MerkleTree;

  constructor(
    private configService: ConfigService<AllConfigType>,
    private usersService: UsersService,
  ) {
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

    this.guardianZkApp = new GuardianZkApp(GUARDIAN_ZKAPP_ADDRESS);
    this.privateKey = PrivateKey.fromBase58(privateKeyFromConf);
    this.publicKey = this.privateKey.toPublicKey();
    this.counter = 0;
    this.guardianTree = new MerkleTree(64);
  }

  getCounter(): number {
    return this.counter;
  }

  async getBalance(account: string): Promise<string> {
    const accountPublicKey: PublicKey = PublicKey.fromBase58(account);
    const response = await fetchAccount({ publicKey: accountPublicKey });
    if (response.error) {
      console.log('Error fetching account: ', response.error.statusText);
    }
    if (response.account) {
      return response.account.balance.toString();
    } else {
      return '0';
    }
  }

  async accountIsNew(account: string): Promise<boolean> {
    const accountPublicKey: PublicKey = PublicKey.fromBase58(account);
    const response = await fetchAccount({ publicKey: accountPublicKey });
    if (response.error) {
      return true;
    } else {
      return false;
    }
  }

  async registerGuardian(guardian: Guardian): Promise<boolean> {
    this.guardianTree.setLeaf(BigInt(this.counter), guardian.hash());

    const tx = await Mina.transaction({ sender: this.publicKey }, () => {
      this.guardianZkApp.addGuardian(
        this.publicKey,
        guardian,
        this.guardianTree.getRoot(),
      );
    });
    await tx.prove();
    await tx.sign([this.privateKey]).send();

    this.counter += 1;
    return true;
  }

  async sendMina(receiver: string, amount: number): Promise<boolean> {
    // check if amount is > 0
    if (amount <= 0) {
      return false;
    }

    //check if receiver is a valid account
    const accountExists = await this.usersService.isExistByWalletAddress(
      receiver,
    );
    if (!accountExists) {
      console.log('Account does not exist: ', receiver);
      return false;
    }

    console.log(`Sending ${amount} Mina to ${receiver}`);
    const receiverPublicKey: PublicKey = PublicKey.fromBase58(receiver);

    const transactionFee = 100_000_000;

    const accountIsNew: boolean = await this.accountIsNew(receiver);

    const tx = await Mina.transaction(
      { sender: this.publicKey, fee: transactionFee },
      () => {
        let accountUpdate: AccountUpdate;
        if (accountIsNew) {
          accountUpdate = AccountUpdate.fundNewAccount(this.publicKey, 3);
        } else {
          accountUpdate = AccountUpdate.createSigned(this.publicKey);
        }
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

  // ref: https://github.com/aurowallet/auro-wallet-browser-extension/blob/3a5fe2b5370bbf18293cb7de48b33bb96b7b4730/src/background/accountService.js#L42
  async createNewWallet(): Promise<{
    priKey: string;
    pubKey: string;
    seed: string;
    hdIndex: number;
  }> {
    const seed = bip39.generateMnemonic();
    const bufferSeed = bip39.mnemonicToSeedSync(seed);
    const masterNode = bip32.fromSeed(bufferSeed);
    let hdPath = this.getHDpath(0);
    const child0 = masterNode.derivePath(hdPath) as any;
    child0.privateKey[0] &= 0x3f;
    const childPrivateKey = this.reverse(child0.privateKey);
    const privateKeyHex = `5a01${childPrivateKey.toString('hex')}`;
    const privateKey = bs58check.encode(Buffer.from(privateKeyHex, 'hex'));
    const client = new Client({ network: 'mainnet' });
    const publicKey = client.derivePublicKey(privateKey);
    return {
      priKey: privateKey,
      pubKey: publicKey,
      seed: seed,
      hdIndex: 0,
    };
  }

  async createSmartWallet(totpSecret: string): Promise<{
    zkAppPrivateKey: string;
    walletStatesZkAppPrivateKey: string;
    recoveryZkAppPrivateKey: string;
  }> {
    let walletStatesZkApp: WalletStateZkApp,
    walletStatesZkAppAddress: PublicKey,
    walletStatesZkAppPrivateKey: PrivateKey,
    recoveryZkAppAddress: PublicKey,
    recoveryZkAppPrivateKey: PrivateKey,
    recoveryZkApp: RecoveryZkApp,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: WalletZkApp;

    let otpTree = new MerkleTree(32);
    let time;
    const startTime = Math.floor(Date.now() / 30000 - 1) * 30000;

    for (let i = 0; i < 32; i++) {
      time = startTime + i * 30000;
      const tokenGen = new TokenGenerator({
        algorithm: 'SHA-512',
        period: 60,
        digits: 8,
        timestamp: time,
      });
      const token = tokenGen.getToken(totpSecret);
      const otp = Otp.from(UInt64.from(time), Field(token));
      otpTree.setLeaf(BigInt(i), otp.hash());
    }

    let defaultCurrentPeriodEnd = UInt64.from(Date.now() - DEFAULT_PERIOD);

    await RecoveryZkApp.compile();
    await WalletStateZkApp.compile();
    await WalletZkApp.compile();

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new WalletZkApp(zkAppAddress);

    walletStatesZkAppPrivateKey = PrivateKey.random();
    walletStatesZkAppAddress = walletStatesZkAppPrivateKey.toPublicKey();
    walletStatesZkApp = new WalletStateZkApp(walletStatesZkAppAddress);

    recoveryZkAppPrivateKey = PrivateKey.random();
    recoveryZkAppAddress = recoveryZkAppPrivateKey.toPublicKey();
    recoveryZkApp = new RecoveryZkApp(recoveryZkAppAddress);

    const txn = await Mina.transaction(this.publicKey, () => {
      walletStatesZkApp.deploy({ zkappKey: walletStatesZkAppPrivateKey });
      walletStatesZkApp.owner.set(zkAppAddress);
      walletStatesZkApp.currentPeriodEnd.set(defaultCurrentPeriodEnd);

      recoveryZkApp.deploy({ zkappKey: recoveryZkAppPrivateKey });
      recoveryZkApp.owner.set(zkAppAddress);

      zkApp.deploy({ zkappKey: zkAppPrivateKey });
      zkApp.committedOtps.set(otpTree.getRoot());
      zkApp.owner.set(recoveryZkAppAddress);
    });
    await txn.prove();
    await txn.sign([this.privateKey, zkAppPrivateKey]).send();

    return {
      zkAppPrivateKey: zkAppPrivateKey.toBase58(),
      walletStatesZkAppPrivateKey: walletStatesZkAppPrivateKey.toBase58(),
      recoveryZkAppPrivateKey: recoveryZkAppPrivateKey.toBase58(),
    }
  }

  // ref: https://github.com/aurowallet/auro-wallet-browser-extension/blob/3a5fe2b5370bbf18293cb7de48b33bb96b7b4730/src/background/accountService.js#L13
  private getHDpath(account = 0) {
    let purpse = 44;
    let index = 0;
    let charge = 0;
    let hdpath =
      'm/' +
      purpse +
      "'/" +
      12586 +
      "'/" +
      account +
      "'/" +
      charge +
      '/' +
      index;
    return hdpath;
  }
  // ref: https://github.com/aurowallet/auro-wallet-browser-extension/blob/3a5fe2b5370bbf18293cb7de48b33bb96b7b4730/src/background/accountService.js#L35
  private reverse(bytes) {
    const reversed = new Buffer(bytes.length);
    for (let i = bytes.length; i > 0; i--) {
      reversed[bytes.length - i] = bytes[i - 1];
    }
    return reversed;
  }
}
