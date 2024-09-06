import { UserRole, UserStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { z } from 'zod';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  Otp?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6) // Ensure some basic password strength
  password: string;
}

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

export class ChangeUserStatusDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}

export class FetchUsersByStatusDto {
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}

export class sendEmailOtp {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class changeEmail {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export const createUserSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email({ message: 'Invalid email address' }),
  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(8, { message: 'Password must be at least 8 characters long' }),
});
