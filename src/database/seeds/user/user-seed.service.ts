import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEnum } from 'src/roles/roles.enum';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,
  ) {}

  async run() {
    const countAdmin = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.admin,
        },
      },
    });

    if (!countAdmin) {
      await this.repository.save(
        this.repository.create({
          firstName: 'Super',
          lastName: 'Admin',
          email: process.env.SUPER_ADMIN_EMAIL,
          password: process.env.SUPER_ADMIN_PASSWORD,
          role: {
            id: RoleEnum.admin,
            name: 'Admin',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
      await this.repository.save(
        this.repository.create({
          firstName: 'mobile',
          lastName: 'Admin',
          email: process.env.MOBILE_ADMIN_EMAIL,
          password: process.env.MOBILE_ADMIN_PASSWORD,
          role: {
            id: RoleEnum.admin,
            name: 'Admin',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }

    const countUser = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.user,
        },
      },
    });

    if (!countUser) {
      await this.repository.save(
        this.repository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'secret',
          role: {
            id: RoleEnum.user,
            name: 'User',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );

      await this.repository.save(
        this.repository.create({
          firstName: 'Test',
          lastName: 'Tester',
          email: 'tester@gmail.com',
          password: 'test1234',
          role: {
            id: RoleEnum.user,
            name: 'User',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }

    const countGuardian = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.guardian,
        },
      },
    });

    if (!countGuardian) {
      await this.repository.save(
        this.repository.create({
          firstName: null,
          lastName: null,
          email: 'guardian1@walletzk.app',
          password: 'secret',
          role: {
            id: RoleEnum.guardian,
            name: 'Guardian',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }
  }
}
