import { ERROR_CODE } from '@consts/error-code';
import { UserJWT } from '@types';
import { AppUnauthorizedRequest } from '@utils/network/exception';
import * as jwt from 'jsonwebtoken';

export const decodeHeader = (req: Request): UserJWT => {
  const authHeader =
    req.headers['authorization'] || req['cookies']['authorization'];

  if (!authHeader) {
    return undefined;
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : authHeader;
  try {
    jwt.decode(token, { complete: true });

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });

    if (!decoded.sub) {
      throw new AppUnauthorizedRequest(ERROR_CODE.FAILED_TO_DECODE_AUTH);
    }
    return decoded.sub as unknown as UserJWT;
  } catch (error) {
    throw new AppUnauthorizedRequest(ERROR_CODE.FAILED_TO_DECODE_AUTH, error);
  }
};
