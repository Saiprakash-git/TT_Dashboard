import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { runGreedyAllocation } from '../src/services/allocationService.js';

dotenv.config({ path: './.env' });
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/timetable_dev';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('connected');
  const allocs = await runGreedyAllocation(1, null);
  console.log('allocations created:', allocs.length);
  for (const a of allocs) console.log(a.subjectName, '->', a.teacherName);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
