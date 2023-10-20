import { Storage } from '@google-cloud/storage';

export const bucketName = 'cabby-bucket';

export const gStorage = new Storage({
  credentials: JSON.parse(process.env.GC_CREDENTIALS_JSON as string),
  projectId: 'cabby-392012',
});
