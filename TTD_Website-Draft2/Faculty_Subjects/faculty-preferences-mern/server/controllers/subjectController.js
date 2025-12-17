import Subject from '../models/Subject.js';

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 }).lean();

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
export const getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).lean();

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private/Admin
export const createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
export const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
