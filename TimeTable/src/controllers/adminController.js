import User from "../models/User.js";
import Subject from "../models/Subject.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";


import Preference from "../models/Preference.js";

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await User.create({
      name,
      email,
      password: hashedPassword,
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
  const semester = req.params.semester;

  try {
    const subjects = await Subject.find({ semester });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// @desc    Get top 2 teacher preferences per subject for a semester
// @route   GET /api/admin/preferences/:semester
// @access  Admin
export const getPreferencesPerSubject = async (req, res) => {
  const semester = parseInt(req.params.semester);

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

      // Take top 2 preferences
      const topTeachers = subjectPrefs.slice(0, 2);

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
