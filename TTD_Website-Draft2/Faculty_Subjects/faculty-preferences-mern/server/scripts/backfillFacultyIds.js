import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

async function run() {
  try {
    await connectDB();

    const users = await User.find({}).sort({ createdAt: 1 });

    // Collect existing facultyIds to avoid duplicates
    const usedIds = new Set(
      users
        .map((u) => u.facultyId)
        .filter(Boolean)
        .map((id) => id.toUpperCase())
    );

    let teacherCounter = 1001; // start from FAC1001
    let adminCounter = 1; // ADMIN-0001

    const updates = [];

    for (const user of users) {
      if (user.facultyId) {
        continue; // already has an ID
      }

      if (user.role === 'admin') {
        // Assign default admin ID(s)
        let candidate;
        do {
          const suffix = String(adminCounter).padStart(4, '0');
          candidate = `ADMIN-${suffix}`;
          adminCounter += 1;
        } while (usedIds.has(candidate));

        user.facultyId = candidate;
        usedIds.add(candidate);
        updates.push(user.save());
      } else {
        // Teachers: assign dummy numeric-style IDs
        let candidate;
        do {
          candidate = `FAC${String(teacherCounter).padStart(4, '0')}`;
          teacherCounter += 1;
        } while (usedIds.has(candidate));

        user.facultyId = candidate;
        usedIds.add(candidate);
        updates.push(user.save());
      }
    }

    if (updates.length === 0) {
      console.log('No users required facultyId backfill.');
    } else {
      await Promise.all(updates);
      console.log(`Backfill complete. Updated ${updates.length} user(s).`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
}

run();
