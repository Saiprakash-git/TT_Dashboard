import mongoose from 'mongoose';

const preferenceFormSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Minimum preferences across all semesters
    minimumPreferences: {
      type: Number,
      default: 2,
      min: 1,
    },
    // How many preferences per semester (Legacy)
    preferencesPerSemester: {
      type: Number,
      default: 3,
      min: 1,
    },
    // Required preferences per semester configuration
    semesterPreferences: {
      type: Map,
      of: Number,
      default: {},
    },
    // Which semesters are included in this form
    includedSemesters: {
      type: [String],
      enum: ['Even', 'Odd'],
      default: ['Even', 'Odd'],
    },
    // Which programs are included in this form
    includedPrograms: {
      type: [String],
      default: ['B.E/B.Tech', 'M.Tech'],
    },
    // Allocation method: 'automatic' or 'manual'
    allocationMethod: {
      type: String,
      enum: ['automatic', 'manual'],
      default: 'manual',
    },
    // Max subjects per teacher for auto-allocation
    maxSubjectsPerTeacher: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Teachers required for each subject
    teachersPerSubject: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Status: draft, active, closed
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft',
    },
    // When the preference submission period opens and closes
    startsAt: {
      type: Date,
    },
    endsAt: {
      type: Date,
    },
    // Created by admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Subjects included in this preference form (per semester)
    subjects: [
      {
        semester: {
          type: String,
          enum: ['Even', 'Odd'],
        },
        subjectIds: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
          },
        ],
      },
    ],
    // Track teachers who have submitted preferences for this form
    submittedTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Track allocated subjects from this preference form
    allocations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Allocation',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PreferenceForm = mongoose.model('PreferenceForm', preferenceFormSchema);

export default PreferenceForm;
