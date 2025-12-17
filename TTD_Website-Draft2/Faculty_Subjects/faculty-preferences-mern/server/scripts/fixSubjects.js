import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Subject from '../models/Subject.js';

dotenv.config();

async function fixSubjects() {
  try {
    await connectDB();

    // Update existing subjects with program field
    const subjects = await Subject.find();
    
    if (subjects.length === 0) {
      console.log('No subjects found. Creating sample subjects...');
      
      // Create sample subjects
      const sampleSubjects = [
        // B.E/B.Tech subjects
        { code: 'CS301', name: 'Data Structures', credits: 4, semester: 'Sem 3', program: 'B.E/B.Tech', description: 'Advanced data structures and algorithms' },
        { code: 'CS302', name: 'Operating Systems', credits: 4, semester: 'Sem 3', program: 'B.E/B.Tech', description: 'OS concepts and implementation' },
        { code: 'CS303', name: 'Database Management', credits: 3, semester: 'Sem 3', program: 'B.E/B.Tech', description: 'Database design and SQL' },
        { code: 'CS401', name: 'Computer Networks', credits: 4, semester: 'Sem 4', program: 'B.E/B.Tech', description: 'Network protocols and architecture' },
        { code: 'CS402', name: 'Software Engineering', credits: 3, semester: 'Sem 4', program: 'B.E/B.Tech', description: 'Software development lifecycle' },
        
        // M.Tech subjects
        { code: 'MTH501', name: 'Advanced Algorithms', credits: 4, semester: 'Sem 1', program: 'M.Tech', description: 'Advanced algorithmic techniques' },
        { code: 'MTH502', name: 'Machine Learning', credits: 4, semester: 'Sem 1', program: 'M.Tech', description: 'ML algorithms and applications' },
        { code: 'MTH503', name: 'Cloud Computing', credits: 3, semester: 'Sem 1', program: 'M.Tech', description: 'Cloud platforms and services' },
      ];
      
      await Subject.insertMany(sampleSubjects);
      console.log(`✓ Created ${sampleSubjects.length} sample subjects`);
    } else {
      console.log(`Found ${subjects.length} existing subjects. Updating program field...`);
      
      // Assign B.E/B.Tech to first half, M.Tech to second half
      const midpoint = Math.ceil(subjects.length / 2);
      
      for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];
        if (!subject.program) {
          subject.program = i < midpoint ? 'B.E/B.Tech' : 'M.Tech';
          await subject.save();
        }
      }
      
      console.log(`✓ Updated ${subjects.length} subjects`);
    }
    
    // Display final count
    const allSubjects = await Subject.find();
    const betech = allSubjects.filter(s => s.program === 'B.E/B.Tech');
    const mtech = allSubjects.filter(s => s.program === 'M.Tech');
    
    console.log(`\nFinal count:`);
    console.log(`  - B.E/B.Tech: ${betech.length}`);
    console.log(`  - M.Tech: ${mtech.length}`);
    console.log(`  - Total: ${allSubjects.length}`);

    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

fixSubjects();
