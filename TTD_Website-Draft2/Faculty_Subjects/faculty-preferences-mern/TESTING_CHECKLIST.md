# Testing Checklist - Feature Verification

## Pre-Testing Setup
- [ ] Install dependencies: `npm install` in both server and client directories
- [ ] Backend server running on configured port
- [ ] Frontend running and can access admin pages
- [ ] Admin user logged in and accessible
- [ ] Database connectivity verified

---

## Feature 1: Bulk Teacher Upload Testing

### Basic Functionality
- [ ] **Excel file upload successful**
  - [ ] Navigate to Manage Teachers page
  - [ ] Scroll to "Bulk Upload Teachers" section
  - [ ] Click "Choose Excel File" button
  - [ ] Select a valid Excel file
  - [ ] File processes without errors

- [ ] **Upload results display**
  - [ ] Results modal appears after upload
  - [ ] Shows success count
  - [ ] Shows error count
  - [ ] Lists successfully added teachers
  - [ ] Lists failed rows with error messages

- [ ] **Teachers appear in list**
  - [ ] Refresh page after upload
  - [ ] New teachers visible in "Teachers List"
  - [ ] All uploaded data appears correctly (name, email, faculty ID)

### File Format Testing
- [ ] **Minimum valid file** (only required columns)
  - Create Excel with columns: fullName, email, facultyId
  - Upload 3-5 rows
  - All should succeed

- [ ] **File with optional fields**
  - Include columns: fullName, email, facultyId, department, designation, phone, password
  - Upload successfully
  - Verify data saved to database

- [ ] **CSV format support**
  - Export as CSV instead of XLSX
  - Upload works
  - Data correct

### Validation Testing
- [ ] **Invalid email format**
  - Row with email "notanemail"
  - Should error: "Invalid email format"
  - Other rows still process

- [ ] **Duplicate faculty ID**
  - Create teacher with facultyId="TEST001"
  - Upload file with same facultyId
  - Should error: "Faculty ID already exists"
  - Verify not created twice

- [ ] **Duplicate email**
  - Create teacher with email="test@example.com"
  - Upload file with same email
  - Should error: "Email already exists"

- [ ] **Missing required fields**
  - Row missing "email"
  - Should error: "Missing required fields"

- [ ] **Headers validation**
  - File with wrong column names (typos)
  - Should error: "Missing required columns"
  - Tell which columns are missing

### Error Handling
- [ ] **Mixed results**
  - Upload file with 5 rows: 3 valid, 2 invalid
  - Should succeed 3, error 2
  - Successful ones should be in database

- [ ] **Empty file**
  - Upload file with no data rows
  - Should error: "Excel file is empty"

- [ ] **Malformed Excel**
  - Upload corrupted/invalid Excel file
  - Should handle gracefully with error

### Password Handling
- [ ] **Without password**
  - Upload teacher without password field
  - Teacher created with temp password "temp123"
  - `isFirstLogin` set to true

- [ ] **With password**
  - Upload teacher with password="mypass123"
  - Teacher created with that password
  - `isFirstLogin` set to false

---

## Feature 2: Semester-Based Preferences Testing

### Subject Management
- [ ] **Create subject with Odd semester**
  - Go to Manage Subjects
  - Click "Add New Subject"
  - Fill form: Code=CS301, Name="Networks", Credits=3
  - Select Semester: "Odd Semester"
  - Select Program: "B.E/B.Tech"
  - Submit
  - Subject appears in list with "Odd" showing

- [ ] **Create subject with Even semester**
  - Create another subject for Even semester
  - Verify appears in list correctly

- [ ] **Edit subject semester**
  - Edit existing subject
  - Change semester value
  - Verify change persists

- [ ] **Semester dropdown enforcement**
  - Only two options available: "Odd Semester", "Even Semester"
  - Free text not allowed
  - Prevents inconsistent values

### Preference Selection Interface
- [ ] **Dynamic section creation**
  - Go to Submit Preferences
  - If subjects exist:
    - [ ] See section for each program-semester combo
    - [ ] B.E/B.Tech - Odd appears
    - [ ] B.E/B.Tech - Even appears
    - [ ] M.Tech sections appear (if M.Tech subjects exist)
    - [ ] Professional Electives section appears

- [ ] **Correct subjects in dropdowns**
  - B.E/B.Tech - Odd section
    - [ ] Only shows B.E/B.Tech subjects with Odd semester
    - [ ] Doesn't show B.E/B.Tech Even subjects
    - [ ] Doesn't show M.Tech subjects
  
  - B.E/B.Tech - Even section
    - [ ] Only shows B.E/B.Tech subjects with Even semester

- [ ] **Professional Electives section**
  - [ ] Shows only Professional Elective subjects
  - [ ] Not grouped by semester
  - [ ] Separate from program-specific sections

### Preference Submission
- [ ] **Save preferences with semester**
  - Select preferences in multiple sections
  - Click "Save Preferences"
  - Success message appears
  - Page refreshes

- [ ] **Load saved preferences**
  - After saving, section shows:
    - [ ] "✓ Allocated to: [Teacher Name]" cards
    - [ ] Saved subjects appear in correct sections
    - [ ] Semester info preserved
    - [ ] Ranking preserved

- [ ] **Edit existing preferences**
  - Change selection in one section
  - Save again
  - Verify update successful
  - Old selection removed

### Allocation Interface
- [ ] **Subjects grouped by program and semester**
  - Go to Allocate Subjects to Teachers
  - Verify grouping:
    - [ ] "📘 B.E/B.Tech - Odd (X)" section
    - [ ] "📘 B.E/B.Tech - Even (Y)" section  
    - [ ] "📗 M.Tech - Odd (Z)" section
    - [ ] Subjects within each section

- [ ] **Correct subjects in each group**
  - Click expand on B.E/B.Tech - Odd section
  - [ ] Shows correct subjects for that group
  - [ ] Teacher preferences from Odd semester shown
  - [ ] Allocation still works normally

- [ ] **Allocation process unchanged**
  - [ ] Can select teacher for each subject
  - [ ] Selected teachers highlight
  - [ ] Progress counter works
  - [ ] Submit button functions
  - [ ] Allocations save correctly

---

## Data Consistency Testing

- [ ] **No data loss during migration**
  - Existing old preferences still viewable
  - Can convert to new format by re-saving

- [ ] **Semester field optional for compatibility**
  - Old subjects without semester still work
  - Can view in allocation (show as "Unassigned")
  - New subjects must have semester

- [ ] **Admin Preferences page**
  - Go to View Teacher Preferences
  - Can filter and view preferences
  - Shows semester info correctly
  - Matches submitted preferences

---

## User Experience Testing

### Bulk Upload UX
- [ ] **Instructions clear**
  - Help text explains what columns needed
  - Instructions visible before upload
  - Easy to understand requirements

- [ ] **Upload button intuitive**
  - "Choose Excel File" button obvious
  - Clear disabled state when uploading
  - Feedback during processing

- [ ] **Results presentation**
  - Modal shows clear success/error split
  - Individual row details visible
  - Error messages actionable and specific
  - Easy to close modal

### Semester Selection UX
- [ ] **No confusion between sections**
  - Each program-semester clearly labeled
  - Visual separation between sections
  - Scrolling between sections smooth

- [ ] **Dropdown clarity**
  - Semester selector very obvious dropdown
  - Not easy to miss or confuse
  - Options clearly labeled

- [ ] **Validation feedback**
  - Error if less than 3 preferences total
  - Clear message about requirements
  - Can't accidentally submit incomplete prefs

---

## Performance Testing

- [ ] **Upload performance**
  - [ ] Small file (10 rows): < 5 seconds
  - [ ] Medium file (100 rows): < 15 seconds
  - [ ] Large file (1000 rows): < 60 seconds

- [ ] **Preference page load**
  - [ ] With 50 subjects: instant load
  - [ ] With 100 subjects: < 2 seconds
  - [ ] Dropdown filtering responsive

- [ ] **Allocation page**
  - [ ] Groups 100+ subjects smoothly
  - [ ] No lag when scrolling
  - [ ] No lag when selecting teachers

---

## Browser Compatibility
- [ ] **Chrome** - All features work
- [ ] **Firefox** - All features work
- [ ] **Safari** - All features work
- [ ] **Edge** - All features work

---

## Error Scenarios

- [ ] **Network error during upload**
  - [ ] Shows error message
  - [ ] Can retry
  - [ ] No data corruption

- [ ] **Incomplete form submission**
  - [ ] Can't submit Excel without file
  - [ ] Can't submit preferences without minimum 3

- [ ] **Database error**
  - [ ] Graceful error message
  - [ ] User informed
  - [ ] Can retry

---

## Regression Testing

Test that existing functionality still works:

- [ ] **Single teacher creation**
  - [ ] "Add Teacher" form still works
  - [ ] Can create one teacher manually
  - [ ] All validations work

- [ ] **Subject management**
  - [ ] Can create subjects without bulk upload
  - [ ] Can edit subjects
  - [ ] Can delete subjects

- [ ] **Existing preference submission**
  - [ ] Teachers can submit preferences
  - [ ] Can save and reload
  - [ ] Preferences display correctly

- [ ] **Admin functions**
  - [ ] Can toggle preference editing
  - [ ] Can delete teachers
  - [ ] Can view allocations
  - [ ] Reports work

---

## Sign-Off

**Tested By:** _________________ **Date:** _________

**Result:** ☐ PASS  ☐ FAIL  ☐ PASS WITH ISSUES

**Issues Found:**
```
1. 
2. 
3. 
```

**Notes:**
```


```

**Approved For Production:** ☐ Yes  ☐ No

**Approval By:** _________________ **Date:** _________

