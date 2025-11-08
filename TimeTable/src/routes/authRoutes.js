import express from "express";
import { login, registerAdmin, checkEmail, setPassword, getProfile, updateProfile, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/register
router.post("/register", registerAdmin);

// POST /api/auth/check-email
router.post("/check-email", checkEmail);

// POST /api/auth/set-password
router.post("/set-password", setPassword);

// Protected profile endpoints
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

export default router;
