import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    preferences: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        program: {
          type: String,
          enum: ['B.E/B.Tech', 'M.Tech', 'Professional Elective'],
          required: true,
        },
        rank: {
          type: Number,
          required: true,
          min: 1,
          max: 3,
        },
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Preference = mongoose.model('Preference', preferenceSchema);

export default Preference;
