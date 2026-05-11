import PreferenceForm from '../models/PreferenceForm.js';
import Subject from '../models/Subject.js';
import Allocation from '../models/Allocation.js';
import Preference from '../models/Preference.js';

// @desc    Get all preference forms
// @route   GET /api/preference-forms
// @access  Private/Admin
export const getPreferenceForms = async (req, res, next) => {
  try {
    const forms = await PreferenceForm.find()
      .populate('createdBy', 'fullName email facultyId')
      .populate('subjects.subjectIds', 'code name semester semesterNumber program credits professionalElective peGroupName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: forms.length,
      data: forms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single preference form
// @route   GET /api/preference-forms/:id
// @access  Private
export const getPreferenceForm = async (req, res, next) => {
  try {
    const form = await PreferenceForm.findById(req.params.id)
      .populate('createdBy', 'fullName email facultyId')
      .populate('subjects.subjectIds', 'code name semester semesterNumber program credits professionalElective peGroupName')
      .populate('submittedTeachers', 'fullName facultyId email');

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Preference form not found',
      });
    }

    res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create preference form
// @route   POST /api/preference-forms
// @access  Private/Admin
export const createPreferenceForm = async (req, res, next) => {
  try {
    const { name, description, minimumPreferences, preferencesPerSemester, includedSemesters, allocationMethod, maxSubjectsPerTeacher, startsAt, endsAt, subjects } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Preference form name is required',
      });
    }

    // Validate dates if provided
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      });
    }

    // Validate allocation method
    if (allocationMethod && !['automatic', 'manual'].includes(allocationMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Allocation method must be either "automatic" or "manual"',
      });
    }

    // Validate subjects format
    let processedSubjects = [];
    if (subjects && Array.isArray(subjects)) {
      for (const semesterGroup of subjects) {
        if (!['Even', 'Odd'].includes(semesterGroup.semester)) {
          return res.status(400).json({
            success: false,
            message: 'Semester must be either "Even" or "Odd"',
          });
        }
        
        // Validate subject IDs exist
        if (semesterGroup.subjectIds && Array.isArray(semesterGroup.subjectIds)) {
          const foundSubjects = await Subject.find({
            _id: { $in: semesterGroup.subjectIds },
            semester: semesterGroup.semester,
          });
          
          if (foundSubjects.length !== semesterGroup.subjectIds.length) {
            return res.status(400).json({
              success: false,
              message: `Some subjects not found for ${semesterGroup.semester} semester`,
            });
          }

          processedSubjects.push({
            semester: semesterGroup.semester,
            subjectIds: semesterGroup.subjectIds,
          });
        }
      }
    }

    const formData = {
      name,
      description,
      minimumPreferences: minimumPreferences || 2,
      preferencesPerSemester: preferencesPerSemester || 3,
      includedSemesters: includedSemesters || ['Even', 'Odd'],
      allocationMethod: allocationMethod || 'manual',
      maxSubjectsPerTeacher: maxSubjectsPerTeacher || 1,
      startsAt,
      endsAt,
      createdBy: req.user._id,
      subjects: processedSubjects,
    };

    const form = await PreferenceForm.create(formData);
    const populatedForm = await form.populate('createdBy', 'fullName email facultyId');

    res.status(201).json({
      success: true,
      data: populatedForm,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update preference form
// @route   PUT /api/preference-forms/:id
// @access  Private/Admin
export const updatePreferenceForm = async (req, res, next) => {
  try {
    const { name, description, minimumPreferences, preferencesPerSemester, allocationMethod, maxSubjectsPerTeacher, startsAt, endsAt, status } = req.body;

    const form = await PreferenceForm.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Preference form not found',
      });
    }

    // Prevent updating if form is closed (unless we are reopening it)
    if (form.status === 'closed' && status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a closed preference form. Please reopen it first.',
      });
    }

    // Validate dates if provided
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      });
    }

    // Update fields
    if (name) form.name = name;
    if (description) form.description = description;
    if (minimumPreferences) form.minimumPreferences = minimumPreferences;
    if (preferencesPerSemester) form.preferencesPerSemester = preferencesPerSemester;
    if (allocationMethod) form.allocationMethod = allocationMethod;
    if (maxSubjectsPerTeacher) form.maxSubjectsPerTeacher = maxSubjectsPerTeacher;
    if (startsAt) form.startsAt = startsAt;
    if (endsAt) form.endsAt = endsAt;
    if (status && ['draft', 'active', 'closed'].includes(status)) form.status = status;

    await form.save();
    await form.populate('createdBy', 'fullName email facultyId');

    res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete preference form
// @route   DELETE /api/preference-forms/:id
// @access  Private/Admin
export const deletePreferenceForm = async (req, res, next) => {
  try {
    const form = await PreferenceForm.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Preference form not found',
      });
    }

    const subjectIds = form.subjects.flatMap(s => s.subjectIds);
    if (subjectIds.length > 0) {
      await Preference.updateMany(
        {},
        { $pull: { preferences: { subject: { $in: subjectIds } } } }
      );
      await Allocation.deleteMany({ subject: { $in: subjectIds } });
    }

    await form.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Preference form deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add subjects to preference form
// @route   POST /api/preference-forms/:id/add-subjects
// @access  Private/Admin
export const addSubjectsToForm = async (req, res, next) => {
  try {
    const { semester, subjectIds } = req.body;

    if (!semester || !['Even', 'Odd'].includes(semester)) {
      return res.status(400).json({
        success: false,
        message: 'Valid semester is required (Even or Odd)',
      });
    }

    if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subject IDs array is required',
      });
    }

    const form = await PreferenceForm.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Preference form not found',
      });
    }

    // Validate all subjects exist and are for the correct semester
    const foundSubjects = await Subject.find({
      _id: { $in: subjectIds },
      semester,
    });

    if (foundSubjects.length !== subjectIds.length) {
      return res.status(400).json({
        success: false,
        message: `Some subjects not found for ${semester} semester`,
      });
    }

    // Check if semester already exists in form
    const existingSemester = form.subjects.findIndex(s => s.semester === semester);

    if (existingSemester > -1) {
      // Update existing semester
      form.subjects[existingSemester].subjectIds = subjectIds;
    } else {
      // Add new semester
      form.subjects.push({ semester, subjectIds });
    }

    await form.save();
    await form.populate('subjects.subjectIds', 'code name semester semesterNumber program credits professionalElective peGroupName');

    res.status(200).json({
      success: true,
      message: `Subjects added to ${semester} semester`,
      data: form,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark teacher as submitted preference
// @route   POST /api/preference-forms/:id/mark-submitted
// @access  Private/Admin
export const markTeacherSubmitted = async (req, res, next) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required',
      });
    }

    if (req.user.role === 'teacher' && req.user.id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark another teacher as submitted',
      });
    }

    const form = await PreferenceForm.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Preference form not found',
      });
    }

    // Add teacher to submitted list if not already there
    if (!form.submittedTeachers.includes(teacherId)) {
      form.submittedTeachers.push(teacherId);
      await form.save();
    }

    res.status(200).json({
      success: true,
      message: 'Teacher marked as submitted',
    });
  } catch (error) {
    next(error);
  }
};
