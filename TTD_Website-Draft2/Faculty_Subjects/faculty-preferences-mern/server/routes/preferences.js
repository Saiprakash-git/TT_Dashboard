import express from 'express';
import {
  getAllPreferences,
  getPreference,
  getMyPreference,
  savePreference,
  deletePreference,
} from '../controllers/preferenceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/my/preference', protect, getMyPreference);
router.post('/', protect, savePreference);
router.get('/', protect, authorize('admin'), getAllPreferences);
router.get('/:teacherId', protect, getPreference);
router.delete('/:id', protect, deletePreference);

export default router;
