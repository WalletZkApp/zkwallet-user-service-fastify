import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { RoleEnum } from 'src/roles/roles.enum';
import { Repository } from 'typeorm';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(Role)
    private repository: Repository<Role>,
  ) {}

  async run() {
    const countUser = await this.repository.count({
      where: {
        id: RoleEnum.user,
      },
    });

    if (!countUser) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.user,
          name: 'User',
        }),
      );
    }

    const countAdmin = await this.repository.count({
      where: {
        id: RoleEnum.admin,
      },
    });

    if (!countAdmin) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.admin,
          name: 'Admin',
        }),
      );
    }

    const countGuardian = await this.repository.count({
      where: {
        id: RoleEnum.guardian,
      },
    });

    if (!countGuardian) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.guardian,
          name: 'Guardian',
        }),
      );
    }

    const countDeveloper = await this.repository.count({
      where: {
        id: RoleEnum.developer,
      },
    });

    if (!countDeveloper) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.developer,
          name: 'Developer',
        }),
      );
    }
  }
}
