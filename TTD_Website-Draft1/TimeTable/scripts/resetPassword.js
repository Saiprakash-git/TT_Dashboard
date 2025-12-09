import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config({ path: './.env' });
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/timetable_dev';

async function run() {
  const [,, email, newPassword] = process.argv;
  if (!email || !newPassword) {
    console.error('Usage: node resetPassword.js <email> <newPassword>');
    process.exit(1);
  }
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const user = await User.findOne({ email });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  user.password = newPassword; // pre-save hook will hash
  user.passwordSet = true;
  await user.save();
  console.log('Password reset for', email);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
