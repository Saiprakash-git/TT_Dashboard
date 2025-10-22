import express from "express";
import { getSubjectsForTeacher, submitPreferences } from "../controllers/teacherController.js";
import { protect, teacherOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes, allow only teachers
router.use(protect, teacherOnly);

// GET /api/teacher/subjects
router.get("/subjects", getSubjectsForTeacher);

// POST /api/teacher/preferences
router.post("/preferences", submitPreferences);

export default router;
