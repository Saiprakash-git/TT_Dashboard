import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

async function testLogin() {
  try {
    await connectDB();

    // Test finding user by facultyId
    const testId = 'FAC1001';
    console.log(`\nTesting login for Faculty ID: ${testId}`);
    
    const user = await User.findOne({ facultyId: testId }).select('+password +isFirstLogin');
    
    if (!user) {
      console.log('❌ User not found with this Faculty ID');
      
      // Check what's in the database
      const allUsers = await User.find({}).select('facultyId fullName');
      console.log('\nAll Faculty IDs in database:');
      allUsers.forEach(u => {
        console.log(`  - ${u.facultyId} (${u.fullName})`);
      });
    } else {
      console.log('✓ User found:');
      console.log(`  Name: ${user.fullName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Faculty ID: ${user.facultyId}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Can Edit Preferences: ${user.canEditPreferences}`);
      console.log(`  Is First Login: ${user.isFirstLogin}`);
      console.log(`  Has Password: ${!!user.password}`);
      
      // Test password comparison
      console.log('\nTesting password comparison...');
      const testPassword = '123456'; // Default password
      const isMatch = await user.comparePassword(testPassword);
      console.log(`  Password '${testPassword}' matches: ${isMatch}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

testLogin();
