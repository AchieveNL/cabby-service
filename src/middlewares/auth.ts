import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { generateToken } from './token-manager';

export const verifyAuthToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    const refreshToken = req.cookies.refreshToken;

    if (!token && !refreshToken) {
      next();
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY as string, (err, decoded) => {
      if (err && err.name === 'TokenExpiredError') {
        jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET_KEY as string,
          (err, decoded) => {
            if (err) {
              next();
              return;
            }

            const newToken = generateToken(decoded.user);
            res.cookie('token', newToken, { maxAge: 3600000, httpOnly: true });
            req.user = decoded.user;
            next();
          }
        );
      } else if (!err) {
        req.user = decoded.user;
        next();
      } else {
        next();
      }
    });
  } catch (error) {
    next();
  }
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
};
