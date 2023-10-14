import { type CookieOptions, type Response } from 'express';

export const setAuthCookies = (
  res: Response,
  newToken: string,
  newRefreshToken: string
) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };

  res.cookie('token', newToken, {
    ...cookieOptions,
    maxAge: 3600000,
  });

  res.cookie('refreshToken', newRefreshToken, {
    ...cookieOptions,
    maxAge: 1209600000,
  });
};
