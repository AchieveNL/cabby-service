import { PrismaClient } from '@prisma/client';
import logger from '../src/lib/logger';

const prisma = new PrismaClient();
const seedUsers = async (): Promise<void> => {};

async function seed(): Promise<void> {
  await Promise.all([seedUsers()]);
}

async function main(): Promise<void> {
  let isError: boolean = false;
  try {
    await seed();
  } catch (e) {
    isError = true;
    logger.error(e);
  } finally {
    await prisma.$disconnect();
    process.exit(isError ? 1 : 0);
  }
}

void main();
