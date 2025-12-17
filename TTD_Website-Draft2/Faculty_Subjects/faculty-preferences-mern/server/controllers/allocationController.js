import Allocation from '../models/Allocation.js';
import Subject from '../models/Subject.js';
import Preference from '../models/Preference.js';

// @desc    Get all allocations
// @route   GET /api/allocations
// @access  Private/Admin
export const getAllocations = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const filter = academicYear ? { academicYear } : {};

    const allocations = await Allocation.find(filter)
      .populate('subject', 'name code credits semester program')
      .populate('teacher', 'fullName email department designation facultyId')
      .populate('allocatedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher's allocated subjects
// @route   GET /api/allocations/my-subjects
// @access  Private/Teacher
export const getMyAllocations = async (req, res, next) => {
  try {
    const allocations = await Allocation.find({ teacher: req.user.id })
      .populate('subject', 'name code credits semester program description')
      .populate('allocatedBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subjects with preference rankings (for allocation)
// @route   GET /api/allocations/subjects-preferences
// @access  Private/Admin
export const getSubjectsWithPreferences = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ program: 1, name: 1 }).lean();
    const preferences = await Preference.find()
      .populate('teacher', 'fullName email department designation facultyId')
      .populate('preferences.subject')
      .lean();

    const subjectsWithPreferences = subjects.map((subject) => {
      const teacherPreferences = [];

      preferences.forEach((pref) => {
        pref.preferences.forEach((p) => {
          if (p.subject._id.toString() === subject._id.toString()) {
            teacherPreferences.push({
              teacher: pref.teacher,
              rank: p.rank,
              program: p.program,
            });
          }
        });
      });

      // Sort by rank (1, 2, 3)
      teacherPreferences.sort((a, b) => a.rank - b.rank);

      return {
        ...subject,
        teacherPreferences,
      };
    });

    res.status(200).json({
      success: true,
      data: subjectsWithPreferences,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Allocate subjects to teachers
// @route   POST /api/allocations/allocate
// @access  Private/Admin
export const allocateSubjects = async (req, res, next) => {
  try {
    const { allocations, academicYear } = req.body;
    const year =
      academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    if (!allocations || allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No allocations provided',
      });
    }

    const existing = await Allocation.find({ academicYear: year });

    // Get all subjects to ensure all are allocated
    const allSubjects = await Subject.find();
    const allSubjectIds = allSubjects.map((s) => String(s._id));
    const alreadyAllocatedIds = new Set(existing.map((e) => String(e.subject)));
    const unallocatedSubjectIds = allSubjectIds.filter((id) => !alreadyAllocatedIds.has(id));

    // When everything is already allocated for the year, block further changes
    if (existing.length && unallocatedSubjectIds.length === 0) {
      return res.status(409).json({
        success: false,
        message: `Allocations for ${year} are already finalized and cannot be changed`,
      });
    }

    // For the first run, require all subjects. For subsequent runs, require all remaining subjects.
    const requiredCount = existing.length ? unallocatedSubjectIds.length : allSubjects.length;
    if (allocations.length !== requiredCount) {
      return res.status(400).json({
        success: false,
        message: existing.length
          ? 'Please allocate all newly added subjects to finalize the year'
          : 'All subjects must be allocated before submission',
      });
    }

    const seenSubjects = new Set();
    for (const alloc of allocations) {
      if (!alloc.subjectId || !alloc.teacherId) {
        return res.status(400).json({
          success: false,
          message: 'Each allocation must include subjectId and teacherId',
        });
      }
      const subjectId = String(alloc.subjectId);
      if (seenSubjects.has(subjectId)) {
        return res.status(400).json({
          success: false,
          message: 'Each subject can only be allocated once per academic year',
        });
      }
      if (alreadyAllocatedIds.has(subjectId)) {
        return res.status(409).json({
          success: false,
          message: 'Cannot change subjects that are already allocated for this academic year',
        });
      }
      if (existing.length && !unallocatedSubjectIds.includes(subjectId)) {
        return res.status(400).json({
          success: false,
          message: 'Only newly added subjects can be allocated now',
        });
      }
      seenSubjects.add(subjectId);
    }

    // Create new allocations
    const allocationPromises = allocations.map((alloc) =>
      Allocation.create({
        subject: alloc.subjectId,
        teacher: alloc.teacherId,
        allocatedBy: req.user.id,
        academicYear: year,
      })
    );

    await Promise.all(allocationPromises);

    // Fetch and return all allocations
    const savedAllocations = await Allocation.find({ academicYear: year })
      .populate('subject', 'name code credits semester program')
      .populate('teacher', 'fullName email department designation facultyId')
      .populate('allocatedBy', 'fullName')
      .lean();

    res.status(201).json({
      success: true,
      data: savedAllocations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete allocation
// @route   DELETE /api/allocations/:id
// @access  Private/Admin
export const deleteAllocation = async (req, res, next) => {
  try {
    return res.status(403).json({
      success: false,
      message: 'Allocations are permanent and cannot be deleted',
    });
  } catch (error) {
    next(error);
  }
};
