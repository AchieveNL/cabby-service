import { Router } from 'express';
import multer from 'multer';
import FileController from './file.controller';

const upload = multer({ storage: multer.memoryStorage() });
const router: Router = Router();
const controller = new FileController();

router.post('/upload', upload.single('file'), controller.upload);
router.delete('/delete', controller.delete);
router.get('/download', controller.downloadFile);

export default router;
