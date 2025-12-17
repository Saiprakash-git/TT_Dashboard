import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

async function run() {
  try {
    await connectDB();

    const users = await User.find({}).select('fullName email role facultyId').sort({ role: -1, createdAt: 1 });

    console.log('\n=== Current Faculty IDs ===\n');
    
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      users.forEach((user) => {
        console.log(`Role: ${user.role.toUpperCase()}`);
        console.log(`Name: ${user.fullName}`);
        console.log(`Email: ${user.email}`);
        console.log(`Faculty ID: ${user.facultyId || 'NOT SET'}`);
        console.log('---');
      });
    }

    console.log(`\nTotal users: ${users.length}\n`);
    process.exit(0);
  } catch (err) {
    console.error('Query failed:', err);
    process.exit(1);
  }
}

run();
