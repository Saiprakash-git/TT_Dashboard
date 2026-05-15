import express from 'express';
import {
  getAllocations,
  getMyAllocations,
  getSubjectsWithPreferences,
  allocateSubjects,
  allocateManual,
  autoAllocate,
  deleteAllocation,
  removeMultipleAllocations,
} from '../controllers/allocationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(authorize('admin'), getAllocations);

router.route('/my-subjects').get(getMyAllocations);

router
  .route('/subjects-preferences')
  .get(authorize('admin'), getSubjectsWithPreferences);

router.route('/allocate').post(authorize('admin'), allocateSubjects);
router.route('/allocate-manual').post(authorize('admin'), allocateManual);

router.route('/auto-allocate/:formId').post(authorize('admin'), autoAllocate);

router.route('/remove-multiple').post(authorize('admin'), removeMultipleAllocations);

router.route('/:id').delete(authorize('admin'), deleteAllocation);

export default router;
