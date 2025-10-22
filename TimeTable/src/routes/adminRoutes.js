import express from "express";
import { registerTeacher, addSubject, getSubjects, getPreferencesPerSubject } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes, allow only admin
router.use(protect, adminOnly);

// POST /api/admin/register-teacher
router.post("/register-teacher", registerTeacher);

// POST /api/admin/subjects
router.post("/subjects", addSubject);

// GET /api/admin/subjects/:semester
router.get("/subjects/:semester", getSubjects);

// GET /api/admin/preferences/:semester
router.get("/preferences/:semester", getPreferencesPerSubject);


export default router;
