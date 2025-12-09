import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  day: { type: String },
  period: { type: Number },
});

const timetableSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  assignments: [assignmentSchema],
  generatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Timetable", timetableSchema);
