import express from 'express';
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getPeGroups,
} from '../controllers/subjectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// PE groups route must be before /:id to avoid conflict
router.get('/pe-groups', protect, getPeGroups);

router
  .route('/')
  .get(protect, getSubjects)
  .post(protect, authorize('admin'), createSubject);

router
  .route('/:id')
  .get(protect, getSubject)
  .put(protect, authorize('admin'), updateSubject)
  .delete(protect, authorize('admin'), deleteSubject);

export default router;
