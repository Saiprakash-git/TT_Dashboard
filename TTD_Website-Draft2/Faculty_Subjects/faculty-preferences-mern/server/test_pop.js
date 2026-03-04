import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const PreferenceForm = (await import('./models/PreferenceForm.js')).default;
  const Subject = (await import('./models/Subject.js')).default;
  
  const forms = await PreferenceForm.find()
      .populate('subjects.subjectIds', 'code name semester semesterNumber program credits professionalElective');
      
  console.log(JSON.stringify(forms, null, 2));
  process.exit(0);
}).catch(console.error);
