import { type CookieOptions, type Response } from 'express';

export const setAuthCookies = (
  res: Response,
  newToken: string,
  newRefreshToken: string
) => {
  const isProductionOrStag = ['production', 'staging'].includes(
    process.env.NODE_ENV
  );

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProductionOrStag,
    sameSite: isProductionOrStag ? 'none' : 'lax',
    domain: isProductionOrStag ? '.cabbyrentals.com' : undefined,
  };

  res.cookie('token', newToken, {
    ...cookieOptions,
    maxAge: 3600000 * 24,
  });

  res.cookie('refreshToken', newRefreshToken, {
    ...cookieOptions,
    maxAge: 1209600000,
  });
};
