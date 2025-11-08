import User from "../models/User.js";
import Subject from "../models/Subject.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";


import Preference from "../models/Preference.js";
import Semester from "../models/Semester.js";
import Deadline from "../models/Deadline.js";

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
    if (semester) filter.semester = semester;
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
    await teacher.remove();
    res.json({ message: "Teacher deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// @desc    Get top 2 teacher preferences per subject for a semester
// @route   GET /api/admin/preferences/:semester
// @access  Admin
export const getPreferencesPerSubject = async (req, res) => {
  const semester = parseInt(req.params.semester);
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
