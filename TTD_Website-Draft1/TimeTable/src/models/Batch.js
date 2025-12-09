import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branch: { type: String },
  section: { type: String },
  joiningYear: { type: Number },
  currentSemester: { type: Number },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Batch', batchSchema);
