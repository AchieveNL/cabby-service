import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { generateRefreshToken, generateToken } from './token-manager';

export const verifyAuthToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    const refreshToken = req.cookies.refreshToken;

    // No token and no refresh token
    if (!token && !refreshToken) {
      next();
      return;
    }

    // Token exists
    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET_KEY as string,
        (err, decoded) => {
          // Valid token
          if (!err) {
            req.user = decoded.user;
            next();
          }
          // Token expired and refresh token exists
          else if (err.name === 'TokenExpiredError' && refreshToken) {
            handleRefreshToken(refreshToken, req, res, next);
          }
          // Token expired and no refresh token
          else {
            next();
          }
        }
      );
    }
    // No token and refresh token exists
    else if (!token && refreshToken) {
      handleRefreshToken(refreshToken, req, res, next);
    }
  } catch (error) {
    next();
  }
};

const handleRefreshToken = (
  refreshToken: string,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET_KEY as string,
    (err, decoded: jwt.JwtPayload) => {
      // Invalid refresh token
      if (err) {
        next();
        return;
      }
      // Generate new token and refresh token
      const user = decoded.user;
      const newToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Set the new tokens in cookies
      res.cookie('token', newToken, { maxAge: 3600000, httpOnly: true });
      res.cookie('refreshToken', newRefreshToken, {
        maxAge: 1209600000,
        httpOnly: true,
      });

      // Continue
      req.user = user;
      next();
    }
  );
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
