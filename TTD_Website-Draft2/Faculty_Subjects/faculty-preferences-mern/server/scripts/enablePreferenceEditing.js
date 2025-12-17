import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

async function run() {
  try {
    await connectDB();

    // Enable canEditPreferences for all teachers by default
    const result = await User.updateMany(
      { role: 'teacher', canEditPreferences: false },
      { $set: { canEditPreferences: true } }
    );

    console.log(`✓ Updated ${result.modifiedCount} teacher(s) to allow preference editing.`);

    // Also ensure isFirstLogin is false for backfilled accounts
    const firstLoginResult = await User.updateMany(
      { isFirstLogin: true, facultyId: { $exists: true, $ne: null } },
      { $set: { isFirstLogin: false } }
    );

    console.log(`✓ Updated ${firstLoginResult.modifiedCount} account(s) to mark as not first login.`);

    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

run();
