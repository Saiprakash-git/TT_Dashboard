import Subject from "../models/Subject.js";
import Preference from "../models/Preference.js";
import Deadline from "../models/Deadline.js";

// @desc    Get subjects for teacher's semester
// @route   GET /api/teacher/subjects
// @access  Teacher
export const getSubjectsForTeacher = async (req, res) => {
  try {
    // Allow optional semester query param so teacher can fetch subjects for a chosen semester
    const semester = req.query.semester || req.body.semester || req.user.semester;

    // Check deadline for this semester (if configured)
    try {
      const dl = await Deadline.findOne({ semester, isActive: true });
      if (dl) {
        const now = new Date();
        if (dl.opensAt && now < dl.opensAt) return res.status(423).json({ message: "Preference submission not open yet" });
        if (dl.closesAt && now > dl.closesAt) return res.status(423).json({ message: "Preference submission is closed (deadline passed)" });
      }
    } catch (err) {
      console.error("Deadline check failed", err);
      // non-blocking: continue if deadline lookup fails
    }
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

    // Check if preference document already exists -> do not allow updates once submitted
    const preferenceDoc = await Preference.findOne({ teacherId: req.user._id, semester });
    if (preferenceDoc) {
      return res.status(403).json({ message: "Preferences already submitted for this semester; updates are not allowed" });
    }

    // Create new
    await Preference.create({
      teacherId: req.user._id,
      semester,
      preferences,
    });

    res.status(200).json({ message: "Preferences submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET teacher's own preferences for a semester
export const getMyPreferences = async (req, res) => {
  try {
    const semester = req.query.semester || req.body.semester || req.user.semester;
    const pref = await Preference.findOne({ teacherId: req.user._id, semester }).lean();
    if (!pref) return res.json({ exists: false });
    return res.json({ exists: true, preferences: pref.preferences, submittedAt: pref.submittedAt });
  } catch (err) {
    console.error("getMyPreferences", err);
    return res.status(500).json({ message: "server_error" });
  }
};
