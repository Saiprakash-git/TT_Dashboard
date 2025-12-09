import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, authorize('admin'));

router.route('/').get(getUsers);

router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

export default router;
