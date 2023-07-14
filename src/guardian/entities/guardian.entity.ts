import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class Guardian {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, unique: true, nullable: false })
  registrationNumber: string;

  @Column({ type: String, unique: true, nullable: false })
  companyName: string;

  @Column({ type: String, nullable: true })
  displayName: string;

  @Column({ type: String, nullable: true })
  description: string;

  @Column({ type: String, nullable: true })
  address: string;

  @Column({ type: String, nullable: true })
  city: string;

  @Column({ type: String, nullable: true })
  state: string;

  @Column({ type: String, nullable: true })
  zip: string;

  @Column({ type: String, nullable: true })
  country: string;

  @Column({ type: String, unique: true, nullable: true })
  email: string;

  @Column({ type: 'int', nullable: true })
  phonenumber: string;

  @Index()
  @Column({ type: String, nullable: true })
  website: string;

  @Index()
  @Column({ type: String, nullable: true })
  identityCommitment: string;

  @Column({ type: 'boolean', default: false })
  public isApproved: boolean;

  @Column({ type: String, nullable: true })
  @Index()
  @Exclude({ toPlainOnly: true })
  hash: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  walletAddress: string | null;

  /*
   * Create and Update Date Columns
   */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
