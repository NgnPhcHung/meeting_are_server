import { ERROR_CODE } from '@consts/error-code';
import { RedisService } from '@modules/redis/redis.service';
import { UserService } from '@modules/user/services/user.service';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AppConflictException,
  AppForbiddenException,
  AppUnauthorizedRequest,
} from '@utils/network/exception';
import * as bcrypt from 'bcryptjs';
import { SignInDto } from '../dtos/signin.dto';
import { SignUpDto } from '../dtos/signup.dto';
import { hashPassword } from '../utils/hash-password';
import { TrieService } from './trie/trie.service';
import { UserJWT } from '@types';
import { Users } from 'generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly trieService: TrieService,
  ) {}

  async signUp(payload: SignUpDto) {
    await this.checkAndSuggestUsernames(payload.username);

    const password = await hashPassword(payload.password);
    const newUser = await this.userService.createUser({ ...payload, password });

    const accessToken = this.getAccessToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser);

    const salt = bcrypt.genSaltSync(+process.env.SALT_ROUND);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    await this.redisService.setData(
      `refresh:${newUser.id}`,
      hashedRefreshToken,
      +process.env.REFRESH_EXPIRED_IN,
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  async login(payload: SignInDto) {
    const { username, password } = payload;
    const user = await this.validateUser(username, password);

    if (!user) throw new AppForbiddenException(ERROR_CODE.INVALID_CREDENTIALS);

    const accessToken = this.getAccessToken(user);

    const refreshToken = this.generateRefreshToken(user);

    const hash = await bcrypt.hash(refreshToken, 10);

    await this.redisService.setData(
      `refresh:${user.id}`,
      hash,
      +process.env.REFRESH_EXPIRED_IN,
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    const decoded = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    if (!decoded.sub) {
      throw new AppUnauthorizedRequest(ERROR_CODE.FAILED_TO_DECODE_AUTH);
    }

    const hashedRefreshToken = await this.redisService.getData(
      `refresh:${decoded.sub.id}`,
    );
    if (!hashedRefreshToken) {
      throw new AppForbiddenException(ERROR_CODE.INVALID_TOKEN);
    }

    const isMatch = await bcrypt.compare(refreshToken, hashedRefreshToken);

    if (!isMatch) throw new AppForbiddenException(ERROR_CODE.INVALID_TOKEN);

    return this.getAccessToken(decoded.sub);
  }

  async logout(userId: number, token: string) {
    const expiresIn = await this.getTokenRemainingTime(token);
    await this.blacklistToken(token, expiresIn);
    await this.redisService.deleteKey(`refresh:${userId}`);
  }

  async validateUser(username: string, password: string) {
    const user = await this.userService.findOneBy({ username });

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) return user;
    return null;
  }

  private getAccessToken(user: Users) {
    const payload: UserJWT = { id: user.id, role: user.role };
    return this.jwtService.sign(
      { sub: payload },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.ACCESS_EXPIRED_IN,
        algorithm: 'HS256',
      },
    );
  }

  private generateRefreshToken(user: Users) {
    const payload: UserJWT = { id: user.id, role: user.role };
    return this.jwtService.sign(
      { sub: payload },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.REFRESH_EXPIRED_IN,
        algorithm: 'HS256',
      },
    );
  }

  async blacklistToken(token: string, expiresIn: number) {
    await this.redisService.setData(
      `blacklist:access:${token}`,
      true,
      expiresIn,
    );
  }

  private async getTokenRemainingTime(token: string) {
    const payload = this.jwtService.decode(token) as { exp: number };
    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now;
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const isBlacklisted = await this.redisService.getData(
      `blacklist:access:${token}`,
    );
    return !!isBlacklisted;
  }

  private async checkAndSuggestUsernames(username: string) {
    const exist = await this.redisService.isUsersExist(username);
    if (exist) {
      const suggestions =
        await this.trieService.generateUsernameWithSuffix(username);
      throw new AppConflictException(
        ERROR_CODE.USER_ALREADY_EXIST,
        JSON.stringify({
          suggestions,
        }),
      );
    }
    return false;
  }
}
