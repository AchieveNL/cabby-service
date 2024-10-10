import { config as configDotenv } from 'dotenv';
import server from './server';
import { printAppInfo } from './utils/print-app-info';
import appConfig from './config/app.config';
import cronJobs from './utils/cron-jobs';
import prismaClient from '@/lib/prisma';
import environment from '@/lib/environment';

configDotenv();
cronJobs().then(() => {
  console.log(`Current Process ID: ${process.pid}`);

  server.listen(process.env.PORT || 8080, () => {
    const { port, env, appUrl: _appUrl } = environment;
    const {
      api: { basePath, version },
    } = appConfig;
    const appUrl = `${_appUrl}:${port}`;
    const apiUrl = `${appUrl}/${basePath}/${version}/${env}`;
    printAppInfo(port, env, appUrl, apiUrl);
  });
});

process.on('SIGINT', () => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  prismaClient.$disconnect();
  console.log('Prisma Disconnected.');
  process.exit(0);
});
