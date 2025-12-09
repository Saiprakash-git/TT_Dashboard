import express from "express";
import { registerTeacher, addSubject, getSubjects, getPreferencesPerSubject, getFilteredPreferences, deleteSubject, getTeachers, addTeacher, deleteTeacher, getSemesters, addSemester, createAdmin } from "../controllers/adminController.js";
import { getDeadlines, upsertDeadline, deleteDeadline } from "../controllers/adminController.js";
import { runAllocation, listAllocations, updateAllocation, exportAllocations } from "../controllers/allocationController.js";
import { createBatch, getBatches, updateBatch, deleteBatch, addSubjectToBatch, getSubjectPreferences, assignTeacherToSubjectForBatch } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { exportPreferencesCsv } from "../controllers/adminController.js";

const router = express.Router();

// Protect all routes, allow only admin
router.use(protect, adminOnly);

// POST /api/admin/register-teacher
router.post("/register-teacher", registerTeacher);

// POST /api/admin/subjects
router.post("/subjects", addSubject);

// POST /api/admin/admins  - create another admin (password unset)
router.post('/admins', createAdmin);

// GET /api/admin/subjects  (list all or filter by query ?semester=)
router.get("/subjects", getSubjects);

// DELETE /api/admin/subjects/:id
router.delete("/subjects/:id", deleteSubject);

// GET /api/admin/subjects/:semester
router.get("/subjects/:semester", getSubjects);

// GET /api/admin/preferences/:semester
router.get("/preferences/:semester", getPreferencesPerSubject);

// Semesters list and add
router.get("/semesters", getSemesters);
router.post("/semesters", addSemester);

// Teacher management endpoints for admin UI
// GET /api/admin/teachers
router.get("/teachers", getTeachers);

// POST /api/admin/teachers
router.post("/teachers", addTeacher);

// DELETE /api/admin/teachers/:id
router.delete("/teachers/:id", deleteTeacher);

// Deadlines
router.get("/deadlines", getDeadlines);
router.post("/deadlines", upsertDeadline);
router.delete("/deadlines/:semester", deleteDeadline);

// Batches
router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.patch('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);
router.post('/batches/:id/subjects', addSubjectToBatch);

// Subject preferences & assignments
router.get('/subject/:subjectId/preferences', getSubjectPreferences);
// Filtered preferences: GET /api/admin/preferences/filter?semester=&teacherId=&rank=&subjectId=
router.get('/preferences/filter', getFilteredPreferences);
router.post('/assignments', assignTeacherToSubjectForBatch);
// Export preferences CSV
router.get('/preferences/:semester/export', exportPreferencesCsv);

// Allocations
// POST /api/admin/allocations/run  { semester }
router.post("/allocations/run", runAllocation);
// GET /api/admin/allocations?semester= - list
router.get("/allocations", listAllocations);
// PATCH /api/admin/allocations/:id - manual update
router.patch("/allocations/:id", updateAllocation);
// CSV export
router.get("/allocations/export", exportAllocations);


export default router;
