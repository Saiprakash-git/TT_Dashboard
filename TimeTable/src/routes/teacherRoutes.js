import express from "express";
import { getSubjectsForTeacher, submitPreferences, getMyPreferences } from "../controllers/teacherController.js";
import Deadline from "../models/Deadline.js";
import { protect, teacherOnly } from "../middleware/authMiddleware.js";
import { getTeacherAllocations } from "../controllers/allocationController.js";

const router = express.Router();

// Protect all routes, allow only teachers
router.use(protect, teacherOnly);

// GET /api/teacher/subjects
router.get("/subjects", getSubjectsForTeacher);

// GET /api/teacher/deadline?semester=1
router.get("/deadline", async (req, res) => {
	const semester = req.query.semester || req.body.semester || req.user.semester;
	try {
		const d = await Deadline.findOne({ semester }).lean();
		if (!d) return res.json({ exists: false });
		return res.json({ exists: true, opensAt: d.opensAt, closesAt: d.closesAt, isActive: d.isActive });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
});

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

// GET /api/teacher/preferences?semester= - get current teacher's preferences
router.get("/preferences", getMyPreferences);

// GET /api/teacher/allocations?semester=
router.get("/allocations", getTeacherAllocations);

export default router;
