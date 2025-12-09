import mongoose from "mongoose";

const deadlineSchema = new mongoose.Schema({
  semester: { type: Number, required: true, unique: true },
  opensAt: { type: Date },
  closesAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

deadlineSchema.methods.isOpen = function() {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.opensAt && now < this.opensAt) return false;
  if (this.closesAt && now > this.closesAt) return false;
  return true;
};

export default mongoose.model("Deadline", deadlineSchema);
