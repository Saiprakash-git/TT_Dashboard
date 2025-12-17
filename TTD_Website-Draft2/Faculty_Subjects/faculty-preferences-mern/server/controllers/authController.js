import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Auto-assign admin role to admin@gmail.com
    const role = email === 'admin@gmail.com' ? 'admin' : 'teacher';

    // Create user
    const user = await User.create({
      email,
      password,
      fullName,
      role,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { facultyId, password, newPassword } = req.body;

    // Validate facultyId & password
    if (!facultyId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide faculty ID and password',
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ facultyId }).select('+password +isFirstLogin');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // If first login and newPassword provided, update password
    if (user.isFirstLogin && newPassword) {
      user.password = newPassword;
      user.isFirstLogin = false;
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      isFirstLogin: user.isFirstLogin,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        designation: user.designation,
        phone: user.phone,
        facultyId: user.facultyId,
        canEditPreferences: user.canEditPreferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, department, designation, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, department, designation, phone },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password (teacher/admin)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};
