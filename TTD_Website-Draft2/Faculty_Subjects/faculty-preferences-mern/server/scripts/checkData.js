import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Subject from '../models/Subject.js';
import Preference from '../models/Preference.js';

dotenv.config();

async function checkData() {
  try {
    await connectDB();

    const subjects = await Subject.find();
    console.log(`\n📚 Total Subjects: ${subjects.length}`);
    
    if (subjects.length > 0) {
      console.log('\nSubjects by Program:');
      const betech = subjects.filter(s => s.program === 'B.E/B.Tech');
      const mtech = subjects.filter(s => s.program === 'M.Tech');
      console.log(`  - B.E/B.Tech: ${betech.length}`);
      console.log(`  - M.Tech: ${mtech.length}`);
      
      console.log('\nSample subjects:');
      subjects.slice(0, 3).forEach(s => {
        console.log(`  ${s.code} - ${s.name} (${s.program})`);
      });
    }

    const preferences = await Preference.find().populate('teacher', 'fullName facultyId');
    console.log(`\n📝 Total Preferences: ${preferences.length}`);
    
    if (preferences.length > 0) {
      console.log('\nPreferences breakdown:');
      preferences.forEach(pref => {
        console.log(`  - ${pref.teacher.fullName} (${pref.teacher.facultyId}): ${pref.preferences.length} prefs`);
      });
    } else {
      console.log('  No preferences submitted yet.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

checkData();
