import Subject from "../models/Subject.js";
import Preference from "../models/Preference.js";

// @desc    Get subjects for teacher's semester
// @route   GET /api/teacher/subjects
// @access  Teacher
export const getSubjectsForTeacher = async (req, res) => {
  try {
    // Allow optional semester query param so teacher can fetch subjects for a chosen semester
    const semester = req.query.semester || req.body.semester || req.user.semester;
    const subjects = await Subject.find({ semester });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Submit preferences
// @route   POST /api/teacher/preferences
// @access  Teacher
export const submitPreferences = async (req, res) => {
  const { preferences, semester: suppliedSemester } = req.body;
  const semester = suppliedSemester || req.user.semester;

  if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
    return res.status(400).json({ message: "Preferences are required" });
  }

  try {
    // Validate unique ranks
    const ranks = preferences.map(p => p.preferenceRank);
    const uniqueRanks = new Set(ranks);
    if (uniqueRanks.size !== ranks.length) {
      return res.status(400).json({ message: "Duplicate ranks found" });
    }

    // Validate unique subjects
    const subjectIds = preferences.map(p => p.subjectId);
    const uniqueSubjects = new Set(subjectIds.map(id => id.toString()));
    if (uniqueSubjects.size !== subjectIds.length) {
      return res.status(400).json({ message: "Duplicate subjects found" });
    }

    // Check if preference document already exists
  let preferenceDoc = await Preference.findOne({ teacherId: req.user._id, semester });

    if (preferenceDoc) {
      // Update existing
      preferenceDoc.preferences = preferences;
      preferenceDoc.submittedAt = new Date();
      await preferenceDoc.save();
    } else {
      // Create new
      preferenceDoc = await Preference.create({
        teacherId: req.user._id,
        semester,
        preferences,
      });
    }

    res.status(200).json({ message: "Preferences submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
