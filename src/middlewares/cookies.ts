import { type Response } from 'express';

const secure = process.env.NODE_ENV === 'production';

export const setAuthCookies = (
  res: Response,
  newToken: string,
  newRefreshToken: string
) => {
  res.cookie('token', newToken, { maxAge: 3600000, httpOnly: true });
  res.cookie('refreshToken', newRefreshToken, {
    maxAge: 1209600000,
    httpOnly: true,
    secure,
    sameSite: 'lax',
  });
};
