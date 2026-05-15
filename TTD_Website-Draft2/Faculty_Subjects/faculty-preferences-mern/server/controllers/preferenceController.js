import Preference from '../models/Preference.js';
import User from '../models/User.js';

// @desc    Get all preferences (Admin only)
// @route   GET /api/preferences
// @access  Private/Admin
export const getAllPreferences = async (req, res, next) => {
  try {
    const preferences = await Preference.find()
      .populate('teacher', 'fullName email department designation facultyId')
      .populate('preferences.subject', 'name code credits semester semesterNumber program professionalElective peGroupName projectWork')
      .lean();

    res.status(200).json({
      success: true,
      count: preferences.length,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get preference by teacher ID
// @route   GET /api/preferences/:teacherId
// @access  Private (Own preference or Admin)
export const getPreference = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    if (req.user.id !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this preference',
      });
    }

    const preference = await Preference.findOne({ teacher: teacherId })
      .populate('teacher', 'fullName email department designation facultyId')
      .populate('preferences.subject', 'name code credits semester semesterNumber program professionalElective peGroupName projectWork')
      .lean();

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: 'Preference not found',
      });
    }

    res.status(200).json({ success: true, data: preference });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's preference
// @route   GET /api/preferences/my/preference
// @access  Private
export const getMyPreference = async (req, res, next) => {
  try {
    const preference = await Preference.findOne({ teacher: req.user.id })
      .populate('teacher', 'fullName email department designation facultyId canEditPreferences')
      .populate('preferences.subject', 'name code credits semester semesterNumber program professionalElective peGroupName projectWork')
      .lean();

    res.status(200).json({ success: true, data: preference });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update preference (program-based with ranks)
// @route   POST /api/preferences
// @access  Private/Teacher
export const savePreference = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    const teacherId = req.user.id;

    // Permission gate: allow first submission even if editing is disabled; block edits unless allowed
    const user = await User.findById(teacherId);
    let preference = await Preference.findOne({ teacher: teacherId });

    if (preference && !user?.canEditPreferences) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit preferences. Please contact admin.',
      });
    }

    // Basic validation
    if (!Array.isArray(preferences) || preferences.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'You must submit at least 1 preference',
      });
    }

    // Validate ranks per program and duplicates
    const seen = new Set();
    const rankMap = new Map(); // program -> set of ranks
    for (const p of preferences) {
      if (!p.subject || !p.program || typeof p.rank !== 'number') {
        return res.status(400).json({ success: false, message: 'Invalid preference payload' });
      }
      const key = `${p.program}:${p.subject}`;
      if (seen.has(key)) {
        return res.status(400).json({ success: false, message: 'Duplicate subject in preferences' });
      }
      seen.add(key);

      // For PEs, use peGroupName as part of the rank key so each PE group has independent ranks
      // For Project Work, use a single key since all projects are in one flat list
      let rankKey;
      if (p.program === 'Project Work') {
        rankKey = 'ProjectWork';
      } else if (p.peGroupName) {
        rankKey = `PE:${p.semester || 'none'}:${p.peGroupName}`;
      } else {
        rankKey = `${p.program}:${p.semester || 'none'}`;
      }
      const ranks = rankMap.get(rankKey) || new Set();
      if (p.rank < 1 || p.rank > 10 || ranks.has(p.rank)) {
        return res.status(400).json({ success: false, message: `Invalid or duplicate rank for ${rankKey}` });
      }
      ranks.add(p.rank);
      rankMap.set(rankKey, ranks);
    }

    if (preference) {
      preference.preferences = preferences;
      preference.submittedAt = Date.now();
      await preference.save();
    } else {
      preference = await Preference.create({ teacher: teacherId, preferences });
    }

    const populated = await Preference.findById(preference._id)
      .populate('teacher', 'fullName email department designation facultyId')
      .populate('preferences.subject', 'name code credits semester semesterNumber program professionalElective peGroupName projectWork');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete preference
// @route   DELETE /api/preferences/:id
// @access  Private (Own preference or Admin)
export const deletePreference = async (req, res, next) => {
  try {
    const preference = await Preference.findById(req.params.id);
    if (!preference) {
      return res.status(404).json({ success: false, message: 'Preference not found' });
    }

    if (preference.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this preference' });
    }

    await preference.deleteOne();
    res.status(200).json({ success: true, message: 'Preference deleted successfully' });
  } catch (error) {
    next(error);
  }
};
