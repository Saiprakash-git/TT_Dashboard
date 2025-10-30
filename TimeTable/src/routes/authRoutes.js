import express from "express";
import { login, registerAdmin, checkEmail, setPassword } from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/register
router.post("/register", registerAdmin);

// POST /api/auth/check-email
router.post("/check-email", checkEmail);

// POST /api/auth/set-password
router.post("/set-password", setPassword);

export default router;
