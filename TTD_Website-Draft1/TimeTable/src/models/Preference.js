import mongoose from "mongoose";

const preferenceSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  semester: { type: Number, required: true },
  preferences: [
    {
      subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
      preferenceRank: { type: Number, required: true }
    }
  ],
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Preference", preferenceSchema);
