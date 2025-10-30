import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // password may be unset initially for teachers created without password
  password: { type: String },
  // flag to indicate whether the user has set their password
  passwordSet: { type: Boolean, default: true },
  role: { type: String, enum: ["admin", "teacher"], default: "teacher" },
  semester: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  // Only hash if password is present and modified
  if (!this.password || !this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordSet = true;
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
