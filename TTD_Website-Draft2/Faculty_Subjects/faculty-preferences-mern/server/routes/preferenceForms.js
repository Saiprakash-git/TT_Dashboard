import express from 'express';
import {
  getPreferenceForms,
  getPreferenceForm,
  createPreferenceForm,
  updatePreferenceForm,
  deletePreferenceForm,
  addSubjectsToForm,
  markTeacherSubmitted,
} from '../controllers/preferenceFormController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin only routes
router.route('/').get(getPreferenceForms).post(authorize('admin'), createPreferenceForm);

router.route('/:id').get(getPreferenceForm).put(authorize('admin'), updatePreferenceForm).delete(authorize('admin'), deletePreferenceForm);

router.route('/:id/add-subjects').post(authorize('admin'), addSubjectsToForm);

router.route('/:id/mark-submitted').post(authorize('admin', 'teacher'), markTeacherSubmitted);

export default router;
