import express from "express";
import { getSubjectsForTeacher, submitPreferences } from "../controllers/teacherController.js";
import { protect, teacherOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes, allow only teachers
router.use(protect, teacherOnly);

// GET /api/teacher/subjects
router.get("/subjects", getSubjectsForTeacher);

// GET /api/teacher/semesters
router.get("/semesters", (req, res, next) => {
	// light wrapper to call admin semesters via model import to avoid circular imports
	next();
}, async (req, res) => {
	const Semester = (await import("../models/Semester.js")).default;
	try {
		const semesters = await Semester.find({}).sort({ number: 1 }).lean();
		res.json(semesters.map(s => s.number));
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
});

// POST /api/teacher/preferences
router.post("/preferences", submitPreferences);

export default router;
