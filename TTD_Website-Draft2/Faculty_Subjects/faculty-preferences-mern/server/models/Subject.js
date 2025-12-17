import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    credits: {
      type: Number,
      default: 3,
      min: [1, 'Credits must be at least 1'],
      max: [10, 'Credits cannot exceed 10'],
    },
    semester: {
      type: String,
      trim: true,
    },
    program: {
      type: String,
      enum: ['B.E/B.Tech', 'M.Tech'],
      required: [true, 'Program is required'],
    },
    professionalElective: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
