import { config } from 'dotenv';
config();

export const LOG_DIR = './logs';
export const LOG_DATE_FORMAT = 'MM-DD-YYYY HH:MM:SS';
export const DEFAULT_PORT = 5000;
export const CURRENCY = 'EUR';

export const REGISTRATION_FEE = '700.00';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const toEmail = process.env.TEST_EMAIL ?? 'no-reply@cabbyrentals.nl';
export const fromEmail = 'no-reply@cabbyrentals.nl';
