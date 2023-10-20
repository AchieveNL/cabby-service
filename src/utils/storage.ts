import { Storage } from '@google-cloud/storage';

export const bucketName = 'cabby-bucket';

export const gStorage = new Storage({
  credentials: JSON.parse(process.env.GCP_CREDENTIALS as string),
  projectId: 'cabby-392012',
});
