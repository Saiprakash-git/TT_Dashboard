import Preference from '../models/Preference.js';

// @desc    Get all preferences (Admin only)
// @route   GET /api/preferences
// @access  Private/Admin
export const getAllPreferences = async (req, res, next) => {
  try {
    const preferences = await Preference.find()
      .populate('teacher', 'fullName email department designation')
      .populate('subjects', 'name code credits semester');

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

    // Check if user is accessing their own preference or is admin
    if (req.user.id !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this preference',
      });
    }

    const preference = await Preference.findOne({ teacher: teacherId })
      .populate('teacher', 'fullName email department designation')
      .populate('subjects', 'name code credits semester');

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: 'Preference not found',
      });
    }

    res.status(200).json({
      success: true,
      data: preference,
    });
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
      .populate('teacher', 'fullName email department designation')
      .populate('subjects', 'name code credits semester');

    res.status(200).json({
      success: true,
      data: preference,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update preference
// @route   POST /api/preferences
// @access  Private/Teacher
export const savePreference = async (req, res, next) => {
  try {
    const { subjects } = req.body;
    const teacherId = req.user.id;

    // Check if preference exists
    let preference = await Preference.findOne({ teacher: teacherId });

    if (preference) {
      // Update existing preference
      preference.subjects = subjects;
      preference.submittedAt = Date.now();
      await preference.save();
    } else {
      // Create new preference
      preference = await Preference.create({
        teacher: teacherId,
        subjects,
      });
    }

    // Populate before sending response
    preference = await Preference.findById(preference._id)
      .populate('teacher', 'fullName email department designation')
      .populate('subjects', 'name code credits semester');

    res.status(200).json({
      success: true,
      data: preference,
    });
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
      return res.status(404).json({
        success: false,
        message: 'Preference not found',
      });
    }

    // Check if user is deleting their own preference or is admin
    if (preference.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this preference',
      });
    }

    await preference.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Preference deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
