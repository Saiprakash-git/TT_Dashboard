import express from "express";
import { protect, adminOnly, teacherOnly } from "../middleware/authMiddleware.js";
import { getTimetableForAdmin, getTimetableForTeacher, generateTimetable, assignTimetable } from "../controllers/timetableController.js";

const router = express.Router();

// Admin generate
router.post("/admin/generate", protect, adminOnly, generateTimetable);

// Admin insert/assign
router.post("/admin/assign", protect, adminOnly, assignTimetable);

// Admin view latest timetable for semester
router.get("/", protect, adminOnly, getTimetableForAdmin);

// Teacher view their assigned subjects
router.get("/teacher", protect, teacherOnly, getTimetableForTeacher);

export default router;
