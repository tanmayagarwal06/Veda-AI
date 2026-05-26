import { Router } from 'express';
import multer from 'multer';
import {
  createAssignment,
  getAssignment,
  listAssignments,
  deleteAssignment,
  regenerateAssignment,
} from '../controllers/assignmentController';

const router = Router();

// Multer for optional file upload (store in memory, parse text)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/plain', 'application/pdf', 'image/png', 'image/jpeg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported. Use PDF, TXT, PNG, or JPEG.'));
    }
  },
});

// ─── Routes ────────────────────────────────────────────────────────────────────

// List all assignments
router.get('/', listAssignments);

// Get single assignment (+ paper if done)
router.get('/:id', getAssignment);

// Create new assignment
router.post('/', upload.single('file'), async (req, res, next) => {
  // If a file was uploaded, extract text content and merge into body
  if (req.file) {
    const fileText = req.file.buffer.toString('utf8').slice(0, 50000);
    req.body.fileContent = fileText;
  }
  return createAssignment(req, res, next);
});

// Delete assignment
router.delete('/:id', deleteAssignment);

// Regenerate paper for existing assignment
router.post('/:id/regenerate', regenerateAssignment);

export default router;
