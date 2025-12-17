import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    academicYear: {
      type: String,
      default: () => {
        const year = new Date().getFullYear();
        return `${year}-${year + 1}`;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one teacher per subject per academic year
allocationSchema.index({ subject: 1, academicYear: 1 }, { unique: true });

const Allocation = mongoose.model('Allocation', allocationSchema);

export default Allocation;
