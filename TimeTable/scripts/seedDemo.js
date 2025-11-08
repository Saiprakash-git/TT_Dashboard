import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import Preference from '../src/models/Preference.js';

dotenv.config({ path: './.env' });

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/timetable_dev';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('connected');

  // clear
  await User.deleteMany({});
  await Subject.deleteMany({});
  await Preference.deleteMany({});

  // create admin
  const admin = await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'password', role: 'admin' });

  // create teachers with capacity
  const t1 = await User.create({ name: 'Alice Teacher', email: 'alice@example.com', password: 'password', role: 'teacher', capacity: 2 });
  const t2 = await User.create({ name: 'Bob Teacher', email: 'bob@example.com', password: 'password', role: 'teacher', capacity: 1 });
  const t3 = await User.create({ name: 'Carol Teacher', email: 'carol@example.com', password: 'password', role: 'teacher', capacity: 2 });

  // subjects semester 1
  const s1 = await Subject.create({ name: 'Mathematics I', code: 'MTH101', semester: 1 });
  const s2 = await Subject.create({ name: 'Physics I', code: 'PHY101', semester: 1 });
  const s3 = await Subject.create({ name: 'Chemistry I', code: 'CHM101', semester: 1 });
  const s4 = await Subject.create({ name: 'Programming I', code: 'CSE101', semester: 1 });

  // preferences
  await Preference.create({ teacherId: t1._id, semester: 1, preferences: [ { subjectId: s1._id, preferenceRank: 1 }, { subjectId: s4._id, preferenceRank: 2 } ] });
  await Preference.create({ teacherId: t2._id, semester: 1, preferences: [ { subjectId: s1._id, preferenceRank: 1 }, { subjectId: s2._id, preferenceRank: 2 } ] });
  await Preference.create({ teacherId: t3._id, semester: 1, preferences: [ { subjectId: s2._id, preferenceRank: 1 }, { subjectId: s3._id, preferenceRank: 2 }, { subjectId: s4._id, preferenceRank: 3 } ] });

  console.log('seeded demo data');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
