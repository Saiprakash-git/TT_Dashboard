import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  subjectName: { type: String },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: false },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  teacherName: { type: String },
  assignedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Allocation", allocationSchema);
