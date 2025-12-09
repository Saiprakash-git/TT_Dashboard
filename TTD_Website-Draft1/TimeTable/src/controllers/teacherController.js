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

    // Check if preference document already exists
    const preferenceDoc = await Preference.findOne({ teacherId: req.user._id, semester });
    if (!preferenceDoc) {
      // no existing doc -> create new
      await Preference.create({
        teacherId: req.user._id,
        semester,
        preferences,
      });
      return res.status(200).json({ message: "Preferences submitted successfully" });
    }

    // If there is an existing document, allow adding preferences for new subjects
    // but do NOT allow modifying previously submitted subject ranks.
    const existingPrefs = preferenceDoc.preferences || [];
    const existingSubjectIds = new Set(existingPrefs.map(p => p.subjectId.toString()));
    const existingRanks = new Set(existingPrefs.map(p => p.preferenceRank));

    // Ensure incoming preferences do not attempt to modify existing subject entries
    for (const p of preferences) {
      if (existingSubjectIds.has(p.subjectId.toString())) {
        return res.status(403).json({ message: `Cannot modify existing preference for subject ${p.subjectId}` });
      }
    }

    // Validate ranks across combined set (no duplicates)
    const incomingRanks = preferences.map(p => p.preferenceRank);
    const combinedRanks = new Set([...existingRanks, ...incomingRanks]);
    if (combinedRanks.size !== existingRanks.size + incomingRanks.length) {
      return res.status(400).json({ message: "Duplicate ranks found when combining with existing preferences" });
    }

    // Append new preferences and save
    preferenceDoc.preferences = existingPrefs.concat(preferences);
    preferenceDoc.submittedAt = new Date();
    await preferenceDoc.save();
    return res.status(200).json({ message: "Additional preferences added successfully" });
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
    // Populate subject names for each preference entry
    const subjectIds = (pref.preferences || []).map(p => p.subjectId).filter(Boolean).map(id => id.toString());
    const subjects = await Subject.find({ _id: { $in: subjectIds } }).lean();
    const subjMap = {};
    subjects.forEach(s => { subjMap[String(s._id)] = { name: s.name, code: s.code }; });

    const mappedPrefs = (pref.preferences || []).map(p => ({
      subjectId: p.subjectId,
      preferenceRank: p.preferenceRank,
      subjectName: subjMap[String(p.subjectId)] ? subjMap[String(p.subjectId)].name : null,
      subjectCode: subjMap[String(p.subjectId)] ? subjMap[String(p.subjectId)].code : null,
    }));

    return res.json({ exists: true, preferences: mappedPrefs, submittedAt: pref.submittedAt });
  } catch (err) {
    console.error("getMyPreferences", err);
    return res.status(500).json({ message: "server_error" });
  }
};
