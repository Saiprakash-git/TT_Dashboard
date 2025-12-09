import User from "../models/User.js";
import Subject from "../models/Subject.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";


import Preference from "../models/Preference.js";
import Semester from "../models/Semester.js";
import Deadline from "../models/Deadline.js";
import Allocation from "../models/Allocation.js";
import Timetable from "../models/Timetable.js";
import Batch from "../models/Batch.js";

import mongoose from "mongoose";

// @desc    Register a teacher
// @route   POST /api/admin/register-teacher
// @access  Admin
export const registerTeacher = async (req, res) => {
  const { name, email, password, semester } = req.body;

  if (!name || !email || !password || !semester) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Teacher already exists" });
    }

    // Create teacher with plaintext password so User model pre-save hook hashes it once
    const teacher = await User.create({
      name,
      email,
      password,
      role: "teacher",
      semester,
      createdBy: req.user._id,
    });

    res.status(201).json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      semester: teacher.semester
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Add a subject
// @route   POST /api/admin/subjects
// @access  Admin
export const addSubject = async (req, res) => {
  const { name, code, semester } = req.body;

  if (!name || !code || !semester) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  try {
    const existing = await Subject.findOne({ code, semester });
    if (existing) {
      return res.status(400).json({ message: "Subject already exists for this semester" });
    }

    const subject = await Subject.create({
      name,
      code,
      semester,
      addedBy: req.user._id,
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all subjects for a semester
// @route   GET /api/admin/subjects/:semester
// @access  Admin
export const getSubjects = async (req, res) => {
  // Support both /subjects and /subjects/:semester and /subjects?semester=2
  const semester = req.params.semester || req.query.semester;

  try {
    const filter = {};
    if (typeof semester !== 'undefined' && semester !== null && semester !== '') {
      const semNum = Number(semester);
      if (isNaN(semNum)) return res.status(400).json({ message: 'semester must be a number' });
      filter.semester = semNum;
    }
    const subjects = await Subject.find(filter);
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/admin/subjects/:id
// @access  Admin
export const deleteSubject = async (req, res) => {
  const { id } = req.params;
  try {
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json({ message: "Subject deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get list of teachers
// @route   GET /api/admin/teachers
// @access  Admin
export const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("name email semester");
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get list of semesters
// @route   GET /api/admin/semesters
// @access  Admin
export const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find({}).sort({ number: 1 }).lean();
    res.json(semesters.map(s => s.number));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Add a semester
// @route   POST /api/admin/semesters
// @access  Admin
export const addSemester = async (req, res) => {
  const { number } = req.body;
  if (!number && number !== 0) return res.status(400).json({ message: "semester number required" });
  try {
    const exists = await Semester.findOne({ number });
    if (exists) return res.status(400).json({ message: "Semester already exists" });
    const sem = await Semester.create({ number, createdBy: req.user._id });
    res.status(201).json({ number: sem.number });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get list of deadlines
// @route   GET /api/admin/deadlines
// @access  Admin
export const getDeadlines = async (req, res) => {
  try {
    const ds = await Deadline.find({}).sort({ semester: 1 }).lean();
    res.json(ds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create or update a deadline for semester
// @route   POST /api/admin/deadlines
// @access  Admin
export const upsertDeadline = async (req, res) => {
  const { semester, opensAt, closesAt, isActive } = req.body;
  if (semester === undefined || semester === null) return res.status(400).json({ message: "semester required" });
  try {
    let d = await Deadline.findOne({ semester });
    if (d) {
      if (opensAt !== undefined) d.opensAt = opensAt ? new Date(opensAt) : null;
      if (closesAt !== undefined) d.closesAt = closesAt ? new Date(closesAt) : null;
      if (isActive !== undefined) d.isActive = !!isActive;
      await d.save();
    } else {
      d = await Deadline.create({ semester, opensAt: opensAt ? new Date(opensAt) : null, closesAt: closesAt ? new Date(closesAt) : null, isActive: isActive !== undefined ? !!isActive : true, createdBy: req.user._id });
    }
    res.json(d);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a deadline by semester
// @route   DELETE /api/admin/deadlines/:semester
// @access  Admin
export const deleteDeadline = async (req, res) => {
  const { semester } = req.params;
  try {
    const d = await Deadline.findOneAndDelete({ semester });
    if (!d) return res.status(404).json({ message: "Deadline not found" });
    res.json({ message: "Deadline deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Add a teacher (simple endpoint for ManageTeachers page)
// @route   POST /api/admin/teachers
// @access  Admin
export const addTeacher = async (req, res) => {
  const { name, email, semester, password } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Please provide name and email" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Teacher already exists" });

    let teacherData = {
      name,
      email,
      role: "teacher",
      semester: semester || null,
      createdBy: req.user._id,
    };

    if (password) {
      // leave password plaintext; User model will hash on save
      teacherData.password = password;
      teacherData.passwordSet = true;
    } else {
      // leave password unset; teacher will set on first login
      teacherData.password = null;
      teacherData.passwordSet = false;
    }

    const teacher = await User.create(teacherData);

    res.status(201).json({ _id: teacher._id, name: teacher.name, email: teacher.email, semester: teacher.semester });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a teacher
// @route   DELETE /api/admin/teachers/:id
// @access  Admin
export const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Admin ${req.user?._id} requested delete teacher ${id}`);
    const teacher = await User.findById(id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    if (teacher.role !== "teacher") return res.status(400).json({ message: "User is not a teacher" });
    // Delete related preferences
    await Preference.deleteMany({ teacherId: teacher._id });
    // Delete allocations assigned to this teacher
    await Allocation.deleteMany({ teacher: teacher._id });
    // Clear timetable assignments referencing this teacher (set teacher and teacherName to null)
    await Timetable.updateMany(
      { 'assignments.teacher': teacher._id },
      { $set: { 'assignments.$[elem].teacher': null, 'assignments.$[elem].teacherName': null } },
      { arrayFilters: [{ 'elem.teacher': teacher._id }], multi: true }
    );

    // Finally remove the user
    await User.findByIdAndDelete(teacher._id);

    res.json({ message: "Teacher and related data deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new admin account (password not set)
// @route   POST /api/admin/admins
// @access  Admin
export const createAdmin = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email required' });
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const adminData = { name, email, role: 'admin', createdBy: req.user._id, password: null, passwordSet: false };
    const admin = await User.create(adminData);

    res.status(201).json({ _id: admin._id, name: admin.name, email: admin.email, role: admin.role });
  } catch (err) {
    console.error('createAdmin', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Batches CRUD
export const createBatch = async (req, res) => {
  const { name, branch, section, joiningYear, currentSemester } = req.body;
  if (!name) return res.status(400).json({ message: 'Batch name required' });
  try {
    const batch = await Batch.create({ name, branch, section, joiningYear, currentSemester, createdBy: req.user._id });
    res.status(201).json(batch);
  } catch (err) {
    console.error('createBatch', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({}).populate('subjects').lean();
    res.json(batches);
  } catch (err) {
    console.error('getBatches', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBatch = async (req, res) => {
  const { id } = req.params;
  const { name, branch, section, joiningYear, currentSemester } = req.body;
  try {
    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    if (name) batch.name = name;
    if (branch) batch.branch = branch;
    if (section) batch.section = section;
    if (typeof joiningYear !== 'undefined') batch.joiningYear = joiningYear;
    if (typeof currentSemester !== 'undefined') batch.currentSemester = currentSemester;
    await batch.save();
    res.json(batch);
  } catch (err) {
    console.error('updateBatch', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBatch = async (req, res) => {
  const { id } = req.params;
  try {
    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    // Optionally, remove allocations tied to this batch
    await Allocation.deleteMany({ batch: batch._id });
    await batch.remove();
    res.json({ message: 'Batch deleted' });
  } catch (err) {
    console.error('deleteBatch', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add subject to batch (subject must exist)
export const addSubjectToBatch = async (req, res) => {
  const { id } = req.params; // batch id
  const { subjectId } = req.body;
  try {
    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    // ensure subject.semester matches batch.currentSemester
    if (typeof batch.currentSemester !== 'undefined' && subject.semester !== batch.currentSemester) {
      return res.status(400).json({ message: 'Subject semester does not match batch current semester' });
    }
    if (!batch.subjects) batch.subjects = [];
    if (!batch.subjects.find(s => String(s) === String(subject._id))) {
      batch.subjects.push(subject._id);
      await batch.save();
    }
    res.json(batch);
  } catch (err) {
    console.error('addSubjectToBatch', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get teacher preference list for a subject (all teachers who ranked it) sorted by rank and submission time
export const getSubjectPreferences = async (req, res) => {
  const subjectId = req.params.subjectId;
  let semester = parseInt(req.query.semester);
  if (isNaN(semester)) {
    // fallback: use latest configured semester if available
    try {
      const latest = await Semester.findOne().sort({ number: -1 }).lean();
      if (latest) semester = latest.number;
    } catch (e) {
      return res.status(400).json({ message: 'semester query param must be a number' });
    }
    if (isNaN(semester)) return res.status(400).json({ message: 'semester query param must be a number' });
  }
  try {
    const prefs = await Preference.find({ semester }).populate('teacherId', 'name email').lean();
    const list = prefs.map(p => {
      const pref = (p.preferences || []).find(x => String(x.subjectId) === String(subjectId));
      if (pref) {
        return { teacherId: p.teacherId._id, teacherName: p.teacherId.name, rank: pref.preferenceRank, submittedAt: p.submittedAt || p.createdAt };
      }
      return null;
    }).filter(Boolean).sort((a,b) => (a.rank - b.rank) || (new Date(a.submittedAt) - new Date(b.submittedAt)));
    res.json(list);
  } catch (err) {
    console.error('getSubjectPreferences', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign a teacher to a subject for a batch (create or update Allocation)
export const assignTeacherToSubjectForBatch = async (req, res) => {
  const { batchId, subjectId, teacherId, semester } = req.body;
  if (!batchId || !subjectId || !teacherId || !semester) return res.status(400).json({ message: 'batchId, subjectId, teacherId and semester required' });
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    const teacher = await User.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    // Check for existing allocation. By default, assignments are permanent and cannot be changed.
    // To override, caller may pass { force: true } in the body (admin-only override).
    const alloc = await Allocation.findOne({ batch: batchId, subject: subjectId, semester });
    const force = !!req.body.force;
    if (alloc && !force) {
      return res.status(403).json({ message: 'Subject already assigned for this batch; assignment is permanent' });
    }

    if (alloc && force) {
      alloc.teacher = teacher._id;
      alloc.teacherName = teacher.name;
      alloc.assignedAt = new Date();
      alloc.createdBy = req.user._id;
      await alloc.save();
      return res.json(alloc);
    }

    // create new allocation
    const created = await Allocation.create({ batch: batchId, semester, subject: subjectId, subjectName: subject.name, teacher: teacher._id, teacherName: teacher.name, createdBy: req.user._id });
    return res.json(created);
  } catch (err) {
    console.error('assignTeacherToSubjectForBatch', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// @desc    Get top 2 teacher preferences per subject for a semester
// @route   GET /api/admin/preferences/:semester
// @access  Admin
export const getPreferencesPerSubject = async (req, res) => {
  let semester = parseInt(req.params.semester);
  if (isNaN(semester)) {
    const latest = await Semester.findOne().sort({ number: -1 }).lean();
    if (latest) semester = latest.number;
  }
  if (isNaN(semester)) return res.status(400).json({ message: 'semester param must be a number' });
  const topN = parseInt(req.query.top) || 2;

  try {
    // Fetch all subjects for the semester
    const subjects = await Subject.find({ semester });

    // Aggregate preferences per subject
    const results = await Promise.all(subjects.map(async (subject) => {
      const prefs = await Preference.find({ semester })
        .populate("teacherId", "name email")
        .lean();

      // Filter preferences for this subject
      const subjectPrefs = prefs
        .map(p => {
          const pref = p.preferences.find(pr => pr.subjectId.toString() === subject._id.toString());
          if (pref) {
            return {
              teacherId: p.teacherId._id,
              teacherName: p.teacherId.name,
              teacherEmail: p.teacherId.email,
              rank: pref.preferenceRank
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.rank - b.rank); // sort by rank ascending

  // Take top N preferences
  const topTeachers = subjectPrefs.slice(0, topN);

      return {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        topTeachers
      };
    }));

    res.json(results);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export preferences CSV for a semester
export const exportPreferencesCsv = async (req, res) => {
  let semester = parseInt(req.params.semester);
  if (isNaN(semester)) {
    const latest = await Semester.findOne().sort({ number: -1 }).lean();
    if (latest) semester = latest.number;
  }
  if (isNaN(semester)) return res.status(400).json({ message: 'semester param must be a number' });
  try {
    const subjects = await Subject.find({ semester }).lean();
    const prefs = await Preference.find({ semester }).populate('teacherId', 'name email').lean();
    const allocations = await Allocation.find({ semester }).lean();

    // Build CSV: SubjectId, SubjectName, AssignedTeacherId, AssignedTeacherName, Preferences (teacherName:rank;...)
    const rows = [];
    rows.push(['subjectId','subjectName','assignedTeacherId','assignedTeacherName','preferences'].join(','));
    for (const subject of subjects) {
      const assigned = allocations.find(a => String(a.subject) === String(subject._id));
      const subjectPrefs = prefs.map(p => {
        const pr = (p.preferences || []).find(x => String(x.subjectId) === String(subject._id));
        if (pr) return `${p.teacherId.name || p.teacherId.email}:${pr.preferenceRank}`;
        return null;
      }).filter(Boolean);
      rows.push([String(subject._id), `"${(subject.name||'').replace(/"/g,'""')}"`, assigned ? String(assigned.teacher) : '', assigned ? `"${(assigned.teacherName||'').replace(/"/g,'""')}"` : '', `"${subjectPrefs.join(';')}"`].join(','));
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="preferences_semester_${semester}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('exportPreferencesCsv', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET filtered preferences
// Query params: semester (required), teacherId (optional), rank (optional), subjectId (optional)
export const getFilteredPreferences = async (req, res) => {
  try {
    let semester = parseInt(req.query.semester);
    if (isNaN(semester)) {
      // try fallback to latest semester
      const latest = await Semester.findOne().sort({ number: -1 }).lean();
      if (latest) semester = latest.number;
    }
    if (isNaN(semester)) return res.status(400).json({ message: 'semester required' });

    const { teacherId, rank, subjectId } = req.query;

    // Fetch all preferences for semester
    const prefs = await Preference.find({ semester }).populate('teacherId', 'name email').lean();

    // Build subject lookup if needed
    let subjMap = {};
    if (subjectId) {
      const s = await Subject.findById(subjectId).lean();
      if (s) subjMap[String(s._id)] = s;
    } else {
      // collect all subjectIds referenced
      const allSubIds = new Set();
      prefs.forEach(p => {
        (p.preferences || []).forEach(pr => { if (pr.subjectId) allSubIds.add(String(pr.subjectId)); });
      });
      if (allSubIds.size) {
        const subjects = await Subject.find({ _id: { $in: Array.from(allSubIds) } }).lean();
        subjects.forEach(s => { subjMap[String(s._id)] = s; });
      }
    }

    const results = [];
    for (const p of prefs) {
      // if teacherId filter provided, skip other teachers
      if (teacherId && String(p.teacherId._id) !== String(teacherId)) continue;
      for (const pr of (p.preferences || [])) {
        if (rank && Number(pr.preferenceRank) !== Number(rank)) continue;
        if (subjectId && String(pr.subjectId) !== String(subjectId)) continue;

        results.push({
          teacherId: p.teacherId._id,
          teacherName: p.teacherId.name,
          teacherEmail: p.teacherId.email,
          subjectId: pr.subjectId,
          subjectName: subjMap[String(pr.subjectId)] ? subjMap[String(pr.subjectId)].name : null,
          subjectCode: subjMap[String(pr.subjectId)] ? subjMap[String(pr.subjectId)].code : null,
          rank: pr.preferenceRank,
          submittedAt: p.submittedAt
        });
      }
    }

    // Optionally sort results: by teacherName then rank
    results.sort((a,b) => {
      if (a.teacherName && b.teacherName) {
        const cmp = a.teacherName.localeCompare(b.teacherName);
        if (cmp !== 0) return cmp;
      }
      return (Number(a.rank) - Number(b.rank));
    });

    return res.json(results);
  } catch (err) {
    console.error('getFilteredPreferences', err);
    return res.status(500).json({ message: 'server_error' });
  }
};
