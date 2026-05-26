import { Router } from 'express';
import {
  getPaper,
  getPaperByAssignment,
  downloadPdf,
} from '../controllers/paperController';

const router = Router();

// Get generated paper by paper ID
router.get('/:id', getPaper);

// Get generated paper by assignment ID
router.get('/by-assignment/:id', getPaperByAssignment);

// Download paper as PDF
router.get('/:id/pdf', downloadPdf);

export default router;
