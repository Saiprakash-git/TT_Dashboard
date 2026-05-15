import Allocation from '../models/Allocation.js';
import Subject from '../models/Subject.js';
import Preference from '../models/Preference.js';
import PreferenceForm from '../models/PreferenceForm.js';

// @desc    Get all allocations
// @route   GET /api/allocations
// @access  Private/Admin
export const getAllocations = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const filter = academicYear ? { academicYear } : {};

    const allocations = await Allocation.find(filter)
      .populate('subject', 'name code credits semester semesterNumber program professionalElective peGroupName projectWork')
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
      .populate('subject', 'name code credits semester semesterNumber program description professionalElective peGroupName projectWork')
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

    // Removed logic that required all subjects to be allocated simultaneously

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
      if (existing.some((e) => String(e.subject) === subjectId)) {
        return res.status(409).json({
          success: false,
          message: 'Cannot change subjects that are already allocated for this academic year',
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
      .populate('subject', 'name code credits semester semesterNumber program professionalElective peGroupName projectWork')
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

// @desc    Automatic allocation based on preferences
// @route   POST /api/allocations/auto-allocate/:formId
// @access  Private/Admin
export const autoAllocate = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { academicYear } = req.body;

    // Get the preference form
    const form = await PreferenceForm.findById(formId).populate('subjects.subjectIds');
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Preference form not found',
      });
    }

    // Get all subjects in this form
    const subjectIds = form.subjects.flatMap(s => s.subjectIds.map(sub => sub._id || sub));

    // Get all preferences for these subjects
    const preferences = await Preference.find({
      'preferences.subject': { $in: subjectIds },
    }).populate('teacher', 'fullName facultyId email');

    if (preferences.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No preferences found for this form',
      });
    }
      
    // Get existing allocations for these subjects to update or skip them intelligently
    const existingAllocations = await Allocation.find({
      subject: { $in: subjectIds }
    });

    const theoreticalAllocations = [];
    const allocatedSubjects = new Set();
    const allocatedTeachers = new Map(); // Track what teachers have been allocated to prevent duplicates in same semester

    // Process each subject
    for (const subjectId of subjectIds) {
      // Find the subject to get its semester
      const subject = await Subject.findById(subjectId);
      if (!subject) continue;

      // Get all preferences for this subject, sorted by preference order (1st, 2nd, 3rd)
      const subjectPreferences = [];

      preferences.forEach(pref => {
        pref.preferences.forEach(p => {
          if (p.subject.toString() === subjectId.toString()) {
            subjectPreferences.push({
              teacher: pref.teacher,
              subject: p.subject,
              preferenceOrder: p.preferenceOrder,
            });
          }
        });
      });

      // Sort by preference order (1st preference = highest priority)
      subjectPreferences.sort((a, b) => a.preferenceOrder - b.preferenceOrder);

      // Find the best teacher for this subject
      let allocatedTeacher = null;
      for (const pref of subjectPreferences) {
        const teacherId = pref.teacher._id.toString();
        const semesterKey = `${subject.semester}-${teacherId}`;

        const teacherAllocCount = theoreticalAllocations.filter(alloc => {
          const allocSubject = form.subjects
            .flatMap(s => s.subjectIds)
            .find(sub => sub._id.toString() === alloc.subject.toString());
          
          return alloc.teacher.toString() === teacherId && 
                 allocSubject && allocSubject.semester === subject.semester;
        }).length;

        // Also check existing allocations in the DB (that won't be modified right now)
        // For accurate counting, we mainly rely on theoreticalAllocations computed on this pass
        
        const maxSubjects = form.maxSubjectsPerTeacher || 1;

        if (teacherAllocCount < maxSubjects) {
          allocatedTeacher = pref.teacher;
          break;
        }
      }

      // If a teacher was found, allocate
      if (allocatedTeacher) {
        theoreticalAllocations.push({
          subject: subjectId,
          teacher: allocatedTeacher._id,
          allocatedBy: req.user._id,
          academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        });
        allocatedSubjects.add(subjectId.toString());
      }
    }

    const allocationsToCreate = [];
    const allocationsToUpdate = [];

    // Compare theoretical allocations against what currently exists
    for (const theoreticalAlloc of theoreticalAllocations) {
      const existingAlloc = existingAllocations.find(a => a.subject.toString() === theoreticalAlloc.subject.toString());
      
      if (existingAlloc) {
        // If it exists, check if the calculated best teacher has explicitly changed
        if (existingAlloc.teacher.toString() !== theoreticalAlloc.teacher.toString()) {
          allocationsToUpdate.push({
            _id: existingAlloc._id,
            teacher: theoreticalAlloc.teacher,
            allocatedBy: theoreticalAlloc.allocatedBy
          });
        }
      } else {
        // Does not exist, create fresh
        allocationsToCreate.push(theoreticalAlloc);
      }
    }

    // Save creations
    let savedAllocations = [];
    if (allocationsToCreate.length > 0) {
      savedAllocations = await Allocation.insertMany(allocationsToCreate);
    }

    // Save updates
    for (const update of allocationsToUpdate) {
      await Allocation.findByIdAndUpdate(update._id, {
        teacher: update.teacher,
        allocatedBy: update.allocatedBy
      });
    }

    // Update preference form with all allocations regarding these subjects
    const allFormAllocations = await Allocation.find({ subject: { $in: subjectIds } });
    form.allocations = allFormAllocations.map(a => a._id);
    await form.save();

    // Populate and return results
    const result = await Allocation.find({ _id: { $in: allFormAllocations.map(a => a._id) } })
      .populate('subject', 'name code semester')
      .populate('teacher', 'fullName facultyId email')
      .populate('allocatedBy', 'fullName');

    res.status(201).json({
      success: true,
      message: `Allocation processing completed. ${allocationsToCreate.length} new assigned, ${allocationsToUpdate.length} updated.`,
      allocatedCount: allFormAllocations.length,
      data: result,
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
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found',
      });
    }

    await allocation.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Allocation removed'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove multiple allocations by subject ID
// @route   POST /api/allocations/remove-multiple
// @access  Private/Admin
export const removeMultipleAllocations = async (req, res, next) => {
  try {
    const { subjectIds } = req.body;
    
    if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No subject IDs provided',
      });
    }

    const result = await Allocation.deleteMany({ subject: { $in: subjectIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} allocations removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};
