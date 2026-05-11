import User from '../models/User.js';
import Allocation from '../models/Allocation.js';
import bcrypt from 'bcryptjs';

// @desc    Create teacher (Admin only)
// @route   POST /api/users/create-teacher
// @access  Private/Admin
export const createTeacher = async (req, res, next) => {
  try {
    const { email, fullName, facultyId, department, designation, phone, password } = req.body;

    // Check if facultyId already exists (only if provided)
    if (facultyId) {
      const existingUser = await User.findOne({ facultyId });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Faculty ID already exists',
        });
      }
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
      department,
      designation,
      phone,
      role: 'teacher',
      password: password || 'temp123', // Default temp password
      isFirstLogin: !password, // If admin didn't set password, mark as first login
    };

    // Only set facultyId if provided
    if (facultyId) {
      teacherData.facultyId = facultyId;
    }

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
    const { id } = req.params;
    const { replacementTeacherId } = req.body; // Optional: If provided, reassign subjects

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users',
      });
    }

    // Check if teacher has any subject allocations
    const allocations = await Allocation.find({ teacher: id }).populate('subject');

    // If teacher has allocations and no replacement provided, return allocation info
    if (allocations.length > 0 && !replacementTeacherId) {
      return res.status(200).json({
        success: false,
        requiresReplacement: true,
        message: `This teacher is assigned ${allocations.length} subject(s). Please select a replacement teacher.`,
        allocations: allocations.map(alloc => ({
          id: alloc._id,
          subjectName: alloc.subject.name,
          subjectCode: alloc.subject.code,
          academicYear: alloc.academicYear,
        })),
      });
    }

    // If replacement teacher is provided, validate and reassign
    if (replacementTeacherId) {
      const replacementTeacher = await User.findById(replacementTeacherId);
      if (!replacementTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Replacement teacher not found',
        });
      }

      if (replacementTeacher.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'Replacement must be a teacher',
        });
      }

      // Reassign all allocations to replacement teacher
      await Allocation.updateMany(
        { teacher: id },
        { teacher: replacementTeacherId }
      );
    }

    // Delete the user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      reassignedCount: allocations.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk create teachers from Excel
// @route   POST /api/users/bulk-upload
// @access  Private/Admin
export const bulkUploadTeachers = async (req, res, next) => {
  try {
    if (!req.body || !Array.isArray(req.body.teachers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format. Expected array of teachers.',
      });
    }

    const teachers = req.body.teachers;
    const results = {
      success: [],
      errors: [],
    };

    for (let index = 0; index < teachers.length; index++) {
      const row = index + 2; // Excel row (accounting for header)
      const { email, fullName, facultyId, department, designation, phone, password } = teachers[index];

      // Validation — require email + fullName, facultyId is optional
      if (!email || !fullName) {
        results.errors.push({
          row,
          message: 'Missing required fields: email, fullName',
        });
        continue;
      }

      // Email format validation
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        results.errors.push({
          row,
          message: `Invalid email format: ${email}`,
        });
        continue;
      }

      // Check if facultyId already exists (only if provided)
      if (facultyId) {
        const existingFacultyId = await User.findOne({ facultyId });
        if (existingFacultyId) {
          results.errors.push({
            row,
            message: `Faculty ID already exists: ${facultyId}`,
          });
          continue;
        }
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        results.errors.push({
          row,
          message: `Email already exists: ${email}`,
        });
        continue;
      }

      // Create teacher
      try {
        const teacherData = {
          email,
          fullName,
          department: department || '',
          designation: designation || '',
          phone: phone || '',
          role: 'teacher',
          password: password || 'temp123',
          isFirstLogin: !password,
        };

        // Only set facultyId if provided
        if (facultyId) {
          teacherData.facultyId = facultyId;
        }

        const newTeacher = await User.create(teacherData);
        results.success.push({
          row,
          facultyId: newTeacher.facultyId,
          email: newTeacher.email,
          fullName: newTeacher.fullName,
        });
      } catch (err) {
        results.errors.push({
          row,
          message: `Database error: ${err.message}`,
        });
      }
    }

    res.status(200).json({
      success: true,
      totalProcessed: teachers.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
