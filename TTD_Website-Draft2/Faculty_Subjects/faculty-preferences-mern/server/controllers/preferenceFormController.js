import PreferenceForm from '../models/PreferenceForm.js';
import Subject from '../models/Subject.js';
import Allocation from '../models/Allocation.js';
import Preference from '../models/Preference.js';

const PROGRAMS = ['B.E/B.Tech', 'M.Tech'];
const SEMESTER_TYPES = ['Even', 'Odd'];
const SEMESTER_NUMBERS_BY_TYPE = {
  Odd: [1, 3, 5, 7],
  Even: [2, 4, 6, 8],
};

const toPlainObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === 'function') return value.toObject();
  return value;
};

const getSettingsEntry = (settings, program) => {
  if (!settings) return null;
  if (Array.isArray(settings)) {
    return settings.find((entry) => entry?.program === program) || null;
  }
  return settings[program] || null;
};

const getAllowedSemesterNumbers = (includedSemesters = []) => {
  const nums = includedSemesters.flatMap((semester) => SEMESTER_NUMBERS_BY_TYPE[semester] || []);
  return [...new Set(nums)].sort((a, b) => a - b);
};

const normalizeProgramSettings = (body = {}) => {
  const includedPrograms = (Array.isArray(body.includedPrograms) && body.includedPrograms.length
    ? body.includedPrograms
    : ['B.E/B.Tech']
  ).filter((program) => PROGRAMS.includes(program));

  if (includedPrograms.length === 0) {
    return {
      error: 'Please select at least one valid program',
    };
  }

  const rawSettings = body.programSettings || {};
  const normalizedByProgram = {};

  for (const program of includedPrograms) {
    const rawEntry = toPlainObject(getSettingsEntry(rawSettings, program)) || {};
    const preferenceMode =
      program === 'M.Tech' && rawEntry.preferenceMode === 'overall'
        ? 'overall'
        : 'semwise';
    const shouldCopyBTech =
      program === 'M.Tech' &&
      preferenceMode === 'semwise' &&
      rawEntry.sameAsBTech === true &&
      includedPrograms.includes('B.E/B.Tech') &&
      normalizedByProgram['B.E/B.Tech'];

    if (shouldCopyBTech) {
      normalizedByProgram[program] = {
        program,
        includedSemesters: [...normalizedByProgram['B.E/B.Tech'].includedSemesters],
        semesterPreferences: { ...normalizedByProgram['B.E/B.Tech'].semesterPreferences },
        preferenceMode: 'semwise',
        sameAsBTech: true,
      };
      continue;
    }

    if (preferenceMode === 'overall') {
      const overallPreferences = Number(rawEntry.overallPreferences) || null;
      normalizedByProgram[program] = {
        program,
        includedSemesters: ['Even', 'Odd'],
        semesterPreferences: {},
        preferenceMode,
        sameAsBTech: false,
        overallPreferences,
      };
      continue;
    }

    const includedSemesters = (Array.isArray(rawEntry.includedSemesters) && rawEntry.includedSemesters.length
      ? rawEntry.includedSemesters
      : body.includedSemesters || ['Even', 'Odd']
    ).filter((semester) => SEMESTER_TYPES.includes(semester));

    if (includedSemesters.length === 0) {
      return {
        error: `Please select at least one semester type for ${program}`,
      };
    }

    const allowedSemesterNumbers = getAllowedSemesterNumbers(includedSemesters);
    const rawPrefs = toPlainObject(rawEntry.semesterPreferences || body.semesterPreferences || {});
    const semesterPreferences = {};

    Object.entries(rawPrefs).forEach(([key, value]) => {
      const semesterNumber = Number(key);
      const preferenceCount = Number(value);
      if (
        Number.isInteger(semesterNumber) &&
        allowedSemesterNumbers.includes(semesterNumber) &&
        Number.isInteger(preferenceCount) &&
        preferenceCount > 0
      ) {
        semesterPreferences[String(semesterNumber)] = preferenceCount;
      }
    });

    if (Object.keys(semesterPreferences).length === 0) {
      return {
        error: `Please select at least one semester number for ${program}`,
      };
    }

    normalizedByProgram[program] = {
      program,
      includedSemesters,
      semesterPreferences,
      preferenceMode,
      sameAsBTech: false,
    };
  }

  const programSettings = includedPrograms.map((program) => normalizedByProgram[program]);
  const includedSemesters = [...new Set(programSettings.flatMap((entry) => entry.includedSemesters))];
  const semesterPreferences = programSettings[0]?.semesterPreferences || {};

  return {
    includedPrograms,
    includedSemesters,
    semesterPreferences,
    programSettings,
  };
};

const validateProgramSubjectAvailability = async (programSettings) => {
  for (const entry of programSettings) {
    if (entry.preferenceMode === 'overall') {
      const subjectCount = await Subject.countDocuments({
        program: entry.program,
      });

      if (subjectCount === 0) {
        return `No ${entry.program} subjects found`;
      }

      continue;
    }

    const semesterPreferences = toPlainObject(entry.semesterPreferences);
    for (const [semesterNumber, preferenceCount] of Object.entries(semesterPreferences || {})) {
      const subjectCount = await Subject.countDocuments({
        program: entry.program,
        semesterNumber: Number(semesterNumber),
        professionalElective: { $ne: true },
        projectWork: { $ne: true },
      });

      if (subjectCount === 0) {
        return `No ${entry.program} core subjects found for Sem ${semesterNumber}`;
      }

      if (subjectCount < Number(preferenceCount)) {
        return `Not enough ${entry.program} core subjects in Sem ${semesterNumber} to cover ${preferenceCount} preferences. Available: ${subjectCount}`;
      }
    }
  }

  return null;
};

const validateSelectedSubjectsForProgramSettings = async (subjectIds, programSettings) => {
  const selectedSubjects = await Subject.find({ _id: { $in: subjectIds } }).lean();

  for (const entry of programSettings) {
    if (entry.preferenceMode === 'overall') {
      const selectedCount = selectedSubjects.filter((subject) => subject.program === entry.program).length;
      if (selectedCount === 0) {
        return `Please select at least one ${entry.program} subject.`;
      }
      continue;
    }

    const semesterPreferences = toPlainObject(entry.semesterPreferences);
    for (const [semesterNumber, preferenceCount] of Object.entries(semesterPreferences || {})) {
      const selectedCount = selectedSubjects.filter(
        (subject) =>
          subject.program === entry.program &&
          subject.semesterNumber === Number(semesterNumber) &&
          subject.professionalElective !== true &&
          subject.projectWork !== true
      ).length;

      if (selectedCount < Number(preferenceCount)) {
        return `Please select at least ${preferenceCount} ${entry.program} core subjects for Sem ${semesterNumber}. Selected: ${selectedCount}`;
      }
    }
  }

  return null;
};

// @desc    Get all preference forms
// @route   GET /api/preference-forms
// @access  Private/Admin
export const getPreferenceForms = async (req, res, next) => {
  try {
    const forms = await PreferenceForm.find()
      .populate('createdBy', 'fullName email facultyId')
      .populate('subjects.subjectIds', 'code name semester semesterNumber program credits professionalElective peGroupName projectWork')
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
      .populate('subjects.subjectIds', 'code name semester semesterNumber program credits professionalElective peGroupName projectWork')
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
    const { name, description, minimumPreferences, preferencesPerSemester, allocationMethod, maxSubjectsPerTeacher, startsAt, endsAt, subjects } = req.body;

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

    const normalizedSettings = normalizeProgramSettings(req.body);
    if (normalizedSettings.error) {
      return res.status(400).json({
        success: false,
        message: normalizedSettings.error,
      });
    }

    const availabilityError = await validateProgramSubjectAvailability(normalizedSettings.programSettings);
    if (availabilityError) {
      return res.status(400).json({
        success: false,
        message: availabilityError,
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
      semesterPreferences: normalizedSettings.semesterPreferences,
      includedSemesters: normalizedSettings.includedSemesters,
      includedPrograms: normalizedSettings.includedPrograms,
      programSettings: normalizedSettings.programSettings,
      allocationMethod: allocationMethod || 'manual',
      maxSubjectsPerTeacher: maxSubjectsPerTeacher || 1,
      teachersPerSubject: req.body.teachersPerSubject || 1,
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

    let normalizedSettings = null;
    if (req.body.includedPrograms || req.body.programSettings || req.body.includedSemesters || req.body.semesterPreferences) {
      normalizedSettings = normalizeProgramSettings({
        includedPrograms: req.body.includedPrograms || form.includedPrograms,
        programSettings: req.body.programSettings || form.programSettings,
        includedSemesters: req.body.includedSemesters || form.includedSemesters,
        semesterPreferences: req.body.semesterPreferences || form.semesterPreferences,
      });

      if (normalizedSettings.error) {
        return res.status(400).json({
          success: false,
          message: normalizedSettings.error,
        });
      }

      const availabilityError = await validateProgramSubjectAvailability(normalizedSettings.programSettings);
      if (availabilityError) {
        return res.status(400).json({
          success: false,
          message: availabilityError,
        });
      }
    }

    // Update fields
    if (name) form.name = name;
    if (description) form.description = description;
    if (minimumPreferences) form.minimumPreferences = minimumPreferences;
    if (preferencesPerSemester) form.preferencesPerSemester = preferencesPerSemester;
    if (normalizedSettings) {
      form.semesterPreferences = normalizedSettings.semesterPreferences;
      form.includedSemesters = normalizedSettings.includedSemesters;
      form.includedPrograms = normalizedSettings.includedPrograms;
      form.programSettings = normalizedSettings.programSettings;
    }
    if (allocationMethod) form.allocationMethod = allocationMethod;
    if (maxSubjectsPerTeacher) form.maxSubjectsPerTeacher = maxSubjectsPerTeacher;
    if (req.body.teachersPerSubject) form.teachersPerSubject = req.body.teachersPerSubject;
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

    const nextSubjectIds = form.subjects.flatMap((group) => {
      if (group.semester === semester) {
        return subjectIds;
      }
      return group.subjectIds;
    });
    if (!form.subjects.some((group) => group.semester === semester)) {
      nextSubjectIds.push(...subjectIds);
    }

    if (form.programSettings?.length) {
      const selectedSubjectsError = await validateSelectedSubjectsForProgramSettings(
        nextSubjectIds,
        form.programSettings
      );

      if (selectedSubjectsError) {
        return res.status(400).json({
          success: false,
          message: selectedSubjectsError,
        });
      }
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
    await form.populate('subjects.subjectIds', 'code name semester semesterNumber program credits professionalElective peGroupName projectWork');

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

    // Validate teacher's preferences against form requirements
    const teacherPreference = await Preference.findOne({ teacher: teacherId })
      .populate('preferences.subject', 'semester semesterNumber program');

    if (!teacherPreference || !teacherPreference.preferences) {
      return res.status(400).json({
        success: false,
        message: 'No preferences found for this teacher',
      });
    }

    // Feature 1: Validate MTech Overall preference count
    for (const programSetting of form.programSettings || []) {
      if (programSetting.preferenceMode === 'overall' && programSetting.overallPreferences) {
        const programPrefs = teacherPreference.preferences.filter(
          p => p.program === programSetting.program
        );
        
        if (programPrefs.length !== programSetting.overallPreferences) {
          return res.status(400).json({
            success: false,
            message: `${programSetting.program} Overall mode requires exactly ${programSetting.overallPreferences} preferences. Submitted: ${programPrefs.length}`,
          });
        }
      }
    }

    // Feature 2: Validate semester restrictions
    const includedSemesters = form.includedSemesters || [];
    if (includedSemesters.length > 0) {
      const formSubjectIds = form.subjects?.flatMap(s => s.subjectIds) || [];
      
      for (const pref of teacherPreference.preferences) {
        const subjectId = typeof pref.subject === 'object' ? pref.subject._id : pref.subject;
        
        // Only validate subjects that are in this form
        if (formSubjectIds.includes(subjectId)) {
          const subject = await Subject.findById(subjectId);
          if (subject && subject.semester && !includedSemesters.includes(subject.semester)) {
            return res.status(400).json({
              success: false,
              message: `Subject ${subject.name} belongs to ${subject.semester} semester, which is not included in this form`,
            });
          }
        }
      }
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
