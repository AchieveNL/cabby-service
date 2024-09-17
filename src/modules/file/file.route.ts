import { Router } from 'express';
import multer from 'multer';
import FileController from './file.controller';
import { requireAuth, verifyAuthToken } from '@/middlewares/auth';

const upload = multer({ storage: multer.memoryStorage() });
const router: Router = Router();
const controller = new FileController();

router.post('/upload', upload.single('file'), controller.upload);
router.delete('/delete', verifyAuthToken, requireAuth, controller.delete);
router.get('/download', verifyAuthToken, requireAuth, controller.downloadFile);

export default router;
