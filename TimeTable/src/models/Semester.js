import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Semester", semesterSchema);
