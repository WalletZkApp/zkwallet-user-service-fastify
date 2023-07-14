import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Guardian } from 'src/guardian/entities/guardian.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GuardianSeedService {
  constructor(
    @InjectRepository(Guardian)
    private repository: Repository<Guardian>,
  ) {}

  async run() {
    await this.repository.save(
      this.repository.create({
        registrationNumber: '123456789',
        companyName: 'ZK Keyless Wallet B.V.',
        displayName: 'ZK Keyless Wallet',
        description: 'ZK Keyless Wallet Guardian 1',
        address: 'test address',
        city: 'Amsterdam',
        state: 'NH',
        zip: '1234AB',
        country: 'Netherlands',
        email: 'guardian1@walletzk.app',
        phonenumber: '123456789',
        website: 'https://www.walletzk.app',
        identityCommitment: '0x123456789',
        isApproved: true,
      }),
    );
  }
}
