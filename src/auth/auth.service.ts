import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import ms from 'ms';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { RoleEnum } from 'src/roles/roles.enum';
import { StatusEnum } from 'src/statuses/statuses.enum';
import crypto from 'crypto';
import { plainToClass } from 'class-transformer';
import { Status } from 'src/statuses/entities/status.entity';
import { Role } from 'src/roles/entities/role.entity';
import { AuthProvidersEnum } from './auth-providers.enum';
import { SocialInterface } from 'src/social/interfaces/social.interface';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { UsersService } from 'src/users/users.service';
import { ForgotService } from 'src/forgot/forgot.service';
import { MailService } from 'src/mail/mail.service';
import { NullableType } from '../utils/types/nullable.type';
import { LoginResponseType } from './types/login-response.type';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { SessionService } from 'src/session/session.service';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { Session } from 'src/session/entities/session.entity';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { GuardiansService } from 'src/guardian/guardians.service';
import { CreateGuardianDto } from 'src/guardian/dto/guardian.dto';
import { Guardian } from 'src/contracts/src/guardians';
import { AuthRegisterGuardianLoginDto } from './dto/auth-register-guardian-login.dto';
import { Field, PublicKey } from 'snarkyjs';
import { OnchainService } from 'src/onchain/onchain.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private forgotService: ForgotService,
    private sessionService: SessionService,
    private mailService: MailService,
    private configService: ConfigService<AllConfigType>,
    private guardianService: GuardiansService,
    private onchainService: OnchainService,
  ) {}

  async validateLogin(
    loginDto: AuthEmailLoginDto,
    onlyAdmin: boolean,
  ): Promise<LoginResponseType> {
    const user = await this.usersService.findOne({
      email: loginDto.email,
    });

    if (
      !user ||
      (user?.role &&
        !(
          onlyAdmin
            ? [RoleEnum.admin]
            : [RoleEnum.user, RoleEnum.guardian, RoleEnum.developer]
        ).includes(user.role.id))
    ) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'notFound',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (user.provider !== AuthProvidersEnum.email) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: `needLoginViaProvider:${user.provider}`,
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            password: 'incorrectPassword',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const session = await this.sessionService.create({
      user,
    });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
    };
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
  ): Promise<LoginResponseType> {
    let user: NullableType<User>;
    const socialEmail = socialData.email?.toLowerCase();

    const userByEmail = await this.usersService.findOne({
      email: socialEmail,
    });

    user = await this.usersService.findOne({
      socialId: socialData.id,
      provider: authProvider,
    });

    if (user) {
      if (socialEmail && !userByEmail) {
        user.email = socialEmail;
      }
      await this.usersService.update(user.id, user);
    } else if (userByEmail) {
      user = userByEmail;
    } else {
      const role = plainToClass(Role, {
        id: RoleEnum.user,
      });
      const status = plainToClass(Status, {
        id: StatusEnum.active,
      });

      user = await this.usersService.create({
        email: socialEmail ?? null,
        firstName: socialData.firstName ?? null,
        lastName: socialData.lastName ?? null,
        socialId: socialData.id,
        provider: authProvider,
        role,
        status,
      });

      user = await this.usersService.findOne({
        id: user.id,
      });
    }

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'userNotFound',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const session = await this.sessionService.create({
      user,
    });

    const {
      token: jwtToken,
      refreshToken,
      tokenExpires,
    } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return {
      refreshToken,
      token: jwtToken,
      tokenExpires,
      user,
    };
  }

  async registerGuardian(dto: AuthRegisterGuardianLoginDto): Promise<void> {
    let nullifierMessage: Field;
    if (dto.password) {
      const userDto: AuthRegisterLoginDto = {
        email: dto.email,
        password: dto.password,
        firstName: null,
        lastName: null,
        walletAddress: null,
        profileUrl: null,
        role: {
          id: RoleEnum.guardian,
        } as Role,
        status: {
          id: StatusEnum.active,
        } as Status,
      };
      // also register as user with guardian role
      await this.register(userDto);
      nullifierMessage = Field(dto.password);
    } else {
      nullifierMessage = Field('guardian');
    }
    

    const guardian = Guardian.from(
      PublicKey.fromBase58(dto.walletAddress),
      nullifierMessage,
    );

    const createGuardianDto: CreateGuardianDto = {
      registrationNumber: dto.registrationNumber,
      companyName: dto.companyName,
      displayName: dto.displayName,
      description: dto.description,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      zip: dto.zip,
      country: dto.country,
      phonenumber: dto.phonenumber,
      website: dto.website,
      identityCommitment: guardian.hash().toString(),
      walletAddress: dto.walletAddress,
    };
    await this.guardianService.create(createGuardianDto);
    await this.onchainService.registerGuardian(guardian);
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const pin: string = this.getRandomNumber('0123456789', 6).toString();

    await this.usersService.create({
      ...dto,
      email: dto.email,
      walletAddress: dto.walletAddress ?? null,
      profileUrl: dto.profileUrl ?? null,
      role: {
        id: RoleEnum.user,
      } as Role,
      status: {
        id: StatusEnum.inactive,
      } as Status,
      pin: pin,
      hash,
    });

    await this.mailService.userSignUp({
      to: dto.email,
      data: {
        hash: pin,
      },
    });
  }

  async confirmEmail(email: string, pin: string): Promise<void> {
    const user = await this.usersService.findOne({
      email,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: `notFound`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.status?.id === StatusEnum.active) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: `alreadyConfirmed`,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (user.pin === '') {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: `pin already used`,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isValidPin = await bcrypt.compare(pin, user.pin);

    if (!isValidPin) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            password: 'incorrectPin',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    user.hash = null;
    user.pin = '';
    user.status = plainToClass(Status, {
      id: StatusEnum.active,
    });
    await user.save();
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOne({
      email,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailNotExists',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');
    await this.forgotService.create({
      hash,
      user,
    });

    await this.mailService.forgotPassword({
      to: email,
      data: {
        hash,
      },
    });
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    const forgot = await this.forgotService.findOne({
      where: {
        hash,
      },
    });

    if (!forgot) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: `notFound`,
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const user = forgot.user;
    user.password = password;

    await this.sessionService.softDelete({
      user: {
        id: user.id,
      },
    });
    await user.save();
    await this.forgotService.softDelete(forgot.id);
  }

  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    return this.usersService.findOne({
      id: userJwtPayload.id,
    });
  }

  async update(
    userJwtPayload: JwtPayloadType,
    userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    if (userDto.password) {
      if (userDto.oldPassword) {
        const currentUser = await this.usersService.findOne({
          id: userJwtPayload.id,
        });

        if (!currentUser) {
          throw new HttpException(
            {
              status: HttpStatus.UNPROCESSABLE_ENTITY,
              errors: {
                user: 'userNotFound',
              },
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        const isValidOldPassword = await bcrypt.compare(
          userDto.oldPassword,
          currentUser.password,
        );

        if (!isValidOldPassword) {
          throw new HttpException(
            {
              status: HttpStatus.UNPROCESSABLE_ENTITY,
              errors: {
                oldPassword: 'incorrectOldPassword',
              },
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        } else {
          await this.sessionService.softDelete({
            user: {
              id: currentUser.id,
            },
            excludeId: userJwtPayload.sessionId,
          });
        }
      } else {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              oldPassword: 'missingOldPassword',
            },
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    await this.usersService.update(userJwtPayload.id, userDto);

    return this.usersService.findOne({
      id: userJwtPayload.id,
    });
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId'>,
  ): Promise<Omit<LoginResponseType, 'user'>> {
    const session = await this.sessionService.findOne({
      where: {
        id: data.sessionId,
      },
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.user.id,
      role: session.user.role,
      sessionId: session.id,
    });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async softDelete(user: User): Promise<void> {
    await this.usersService.softDelete(user.id);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.softDelete({
      id: data.sessionId,
    });
  }

  private async getTokensData(data: {
    id: User['id'];
    role: User['role'];
    sessionId: Session['id'];
  }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  getRandomNumber = (chars, len) =>
    [...Array(len)]
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
}
