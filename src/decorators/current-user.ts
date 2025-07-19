import { ERROR_CODE } from '@consts/error-code';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AppUnauthorizedRequest } from '@utils/network/exception';
import { decodeHeader } from 'src/helpers/decode-header';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const context = GqlExecutionContext.create(ctx);
    const request = context.getContext().req;
    const decodedHeader = decodeHeader(request);
    console.log('decodedHeader', decodedHeader);

    if (!decodedHeader) {
      throw new AppUnauthorizedRequest(ERROR_CODE.FAILED_TO_DECODE_AUTH);
    }

    return decodedHeader.id;
  },
);
