import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @desc    Create teacher (Admin only)
// @route   POST /api/users/create-teacher
// @access  Private/Admin
export const createTeacher = async (req, res, next) => {
  try {
    const { email, fullName, facultyId, department, designation, phone, password } = req.body;

    // Check if facultyId already exists
    const existingUser = await User.findOne({ facultyId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Faculty ID already exists',
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Create teacher with default password if not provided
    const teacherData = {
      email,
      fullName,
      facultyId,
      department,
      designation,
      phone,
      role: 'teacher',
      password: password || 'temp123', // Default temp password
      isFirstLogin: !password, // If admin didn't set password, mark as first login
    };

    const teacher = await User.create(teacherData);

    res.status(201).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle teacher preference edit permission
// @route   PUT /api/users/:id/toggle-preference-edit
// @access  Private/Admin
export const togglePreferenceEdit = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'This action is only for teachers',
      });
    }

    user.canEditPreferences = !user.canEditPreferences;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users/teachers
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const { fullName, email, role, department, designation, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, role, department, designation, phone },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
