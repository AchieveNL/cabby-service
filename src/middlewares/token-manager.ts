import jwt from 'jsonwebtoken';

export const generateToken = (user: any) => {
  return jwt.sign({ user }, process.env.JWT_SECRET_KEY as string, {
    expiresIn: '24h',
  });
};

export const generateRefreshToken = (user: any) => {
  return jwt.sign({ user }, process.env.JWT_REFRESH_SECRET_KEY as string, {
    expiresIn: '7d',
  });
};
