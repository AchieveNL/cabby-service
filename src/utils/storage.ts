import path from 'path';
import { Storage } from '@google-cloud/storage';

const credentialsPath = path.join(__dirname, '../../secrets.json');
export const bucketName = 'cabby-bucket';

export const gStorage = new Storage({
  keyFilename: credentialsPath,
  projectId: 'cabby-392012',
});
