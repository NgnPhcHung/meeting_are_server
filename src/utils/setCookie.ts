import { GraphQLContext } from '@types';

export const setCookie = (
  context: GraphQLContext,
  key: string,
  content: any,
) => {
  const { res } = context;

  res.cookie(key, content, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days,
    path: '/',
  });
};
