# Project Updates Summary

## Overview
Two major features have been implemented in the Teacher Preferences Management System:

1. **Bulk Teacher Upload via Excel Files**
2. **Subject Preference Selection by Program & Semester**

---

## Feature 1: Bulk Teacher Upload via Excel

### Purpose
Allow administrators to add multiple teachers at once by uploading an Excel file instead of creating them one by one.

### Files Modified/Created

#### Backend Changes
1. **server/package.json**
   - Added `multer` (^1.4.5-lts.1) - for file handling
   - Added `xlsx` (^0.18.5) - for Excel parsing

2. **server/controllers/userController.js**
   - Added new controller function: `bulkUploadTeachers()`
   - Features:
     - Accepts JSON array of teacher objects
     - Validates required fields: `fullName`, `email`, `facultyId`
     - Validates email format
     - Checks for duplicate `facultyId` and `email`
     - Validates individual records before database insert
     - Returns detailed success/error report with row numbers
     - Provides clear error messages for each failed row

3. **server/routes/users.js**
   - Added new route: `POST /api/users/bulk-upload`
   - Imported `bulkUploadTeachers` controller
   - Protected route (requires admin authentication)

#### Frontend Changes
1. **client/package.json**
   - Added `xlsx` (^0.18.5) - for Excel file parsing on client side

2. **client/src/pages/admin/AdminTeachersPage.jsx**
   - Added import: `import * as XLSX from 'xlsx'`
   - Added state variables:
     - `bulkUploading` - tracks upload status
     - `uploadResults` - stores upload results
     - `showUploadModal` - controls modal visibility
   - Added new function: `handleBulkUploadFile()`
     - Reads Excel file using XLSX library
     - Validates column headers
     - Sends data to backend
     - Displays results in modal
   - Added new UI section: "Bulk Upload Teachers" card with:
     - Instructions for required/optional columns
     - File input with styled button
     - Modal showing upload results (success/error breakdown)
   - Added new styles for:
     - `.bulk-upload-section` - container styling
     - `.upload-instructions` - instruction box styling
     - `.btn-upload` - file button styling
     - `.modal-overlay` - modal backdrop
     - `.modal-content` - modal box styling
     - `.results-summary` - results cards
     - `.result-item` - individual result items

### Excel File Format

#### Required Columns
- `fullName` - Full name of the teacher
- `email` - Valid email address (must be unique)
- `facultyId` - Faculty ID (must be unique, used for login)

#### Optional Columns
- `department` - Department name
- `designation` - Job designation
- `phone` - Phone number
- `password` - Temporary password (if empty, teacher must reset on first login)

#### Example Excel Structure
```
fullName              | email           | facultyId | department    | designation | phone       | password
Dr. John Smith        | john@example.com| FAC001    | Computer Sci  | Associate   | 9876543210  | 
Dr. Sarah Johnson     | sarah@example.com| FAC002   | Electronics   | Professor   | 9876543211  | temp123
```

### Validation Rules
1. Email must be in valid format (xxx@xxx.xxx)
2. facultyId must be unique
3. Email must be unique
4. All required fields must be present

### API Response Format
```json
{
  "success": true,
  "totalProcessed": 5,
  "successCount": 4,
  "errorCount": 1,
  "data": {
    "success": [
      {
        "row": 2,
        "facultyId": "FAC001",
        "email": "john@example.com",
        "fullName": "Dr. John Smith"
      }
    ],
    "errors": [
      {
        "row": 3,
        "message": "Email already exists: existing@example.com"
      }
    ]
  }
}
```

---

## Feature 2: Subject Preference Selection by Program & Semester

### Purpose
Enable teachers to select subject preferences organized by both program level (B.E/B.Tech, M.Tech) and semester (Odd, Even), allowing for more granular preference management.

### Files Modified/Created

#### Backend Changes
1. **server/models/Subject.js**
   - Already had `semester` field (no changes needed)
   - Semester field accepts string values like "Odd", "Even"

2. **server/models/Preference.js**
   - Added `semester` field to preferences array:
     ```javascript
     semester: {
       type: String,
       trim: true,
     }
     ```
   - This allows preferences to be stored with semester information

#### Frontend Changes
1. **client/src/pages/admin/AdminSubjectsPage.jsx**
   - Updated semester input from text field to dropdown
   - Changed from: `<input type="text" />` to `<select>` with options:
     - "-- Select Semester --" (empty value)
     - "Odd" (Odd Semester)
     - "Even" (Even Semester)
   - Made semester a required field for subject creation
   - Helps ensure consistent semester naming

2. **client/src/pages/PreferencesPage.jsx**
   - Complete refactor to support program + semester organization
   - Added new state structure:
     - Changed from separate `beTechPrefs`, `mTechPrefs`, `pePrefs`
     - To: `preferences` object keyed by `program|semester`
   - Added helper functions:
     - `getPrograms()` - gets unique programs from subjects
     - `getSemestersForProgram(program)` - gets semesters for a program
   - Updated `filterAvailable()` to filter by both program AND semester
   - Added `programSectionWithSemesters()` - generates cards for each program-semester combo
   - Added `peSection()` - handles Professional Electives separately
   - Updated data persistence to save semester with preferences

3. **client/src/pages/admin/AllocateSubjectsPage.jsx**
   - Refactored subject grouping:
     - Changed from: `beTechSubjects`, `mTechSubjects`
     - To: `groupedSubjects` keyed by `program|semester`
   - Added `sortedGroups` variable that sorts by:
     1. Program (B.E/B.Tech first, then M.Tech)
     2. Semester (alphabetically)
   - Updated JSX rendering to use `sortedGroups.map()` for display
   - Each section now shows: "{Program} - {Semester} ({count})"
   - Emoji indicators: "📘" for B.E/B.Tech, "📗" for M.Tech

### Data Structure Changes

#### Preference Storage Format (Backend)
Before:
```json
{
  "preferences": [
    {
      "subject": "id123",
      "program": "B.E/B.Tech",
      "rank": 1
    }
  ]
}
```

After:
```json
{
  "preferences": [
    {
      "subject": "id123",
      "program": "B.E/B.Tech",
      "semester": "Odd",
      "rank": 1
    }
  ]
}
```

#### Frontend Preference State
Before:
```javascript
{
  beTechPrefs: ['id1', 'id2', 'id3'],
  mTechPrefs: ['id1', 'id2', 'id3'],
  pePrefs: ['id1', 'id2', 'id3']
}
```

After:
```javascript
{
  "B.E/B.Tech|Odd": ['id1', 'id2', 'id3'],
  "B.E/B.Tech|Even": ['id4', 'id5', 'id6'],
  "M.Tech|Odd": ['id7', 'id8', 'id9'],
  "PE": ['id10', 'id11', 'id12']
}
```

### UI Changes

#### Subject Management (AdminSubjectsPage)
- Semester selector is now a dropdown instead of text input
- Enforces consistent semester values (Odd/Even)
- Table shows semester value clearly

#### Preferences Page (PreferencesPage)
- Dynamic sections created based on actual programs and semesters in the database
- Example layout:
  - B.E/B.Tech - Odd Semester (3 dropdowns)
  - B.E/B.Tech - Even Semester (3 dropdowns)
  - M.Tech - Odd Semester (3 dropdowns)
  - M.Tech - Even Semester (3 dropdowns)
  - Professional Electives (3 dropdowns)
- Subject filtering is more precise (by program AND semester)
- No duplicate selections within each section

#### Allocation Page (AllocateSubjectsPage)
- Subjects now grouped by program AND semester
- Each group shown as a section with count
- Example: "📘 B.E/B.Tech - Odd (15)" 
- Cleaner organization matching the preference input structure

---

## Migration Notes

### For Existing Data
1. **Subjects without Semester**
   - Subjects created before this update may have empty semester field
   - Admin should update these through AdminSubjectsPage
   - Set semester to "Odd" or "Even" as appropriate
   - Subjects with empty semester will appear under "Unassigned" in allocation page

2. **Existing Preferences**
   - Old preferences stored without semester field will still work
   - When loading, they'll be grouped under program keys without semester
   - Teacher can re-submit preferences to include semester information

3. **Excel Upload**
   - Start fresh with bulk uploads once data is in place
   - Can be used for initial data seeding or updating multiple records

---

## Testing Checklist

### Bulk Upload Feature
- [ ] Upload valid Excel file with all required fields
- [ ] Upload Excel with optional fields
- [ ] Handle duplicate facultyId gracefully
- [ ] Handle duplicate email gracefully
- [ ] Handle invalid email format
- [ ] View upload results in modal (success and error breakdown)
- [ ] Verify teachers appear in teachers list after upload
- [ ] Verify password handling (empty vs. set)

### Semester-based Preferences
- [ ] Create subjects with Odd/Even semester values
- [ ] View preferences page with semester sections
- [ ] Select preferences across different semesters
- [ ] Save preferences with semester information
- [ ] View preferences page loads correctly with saved data
- [ ] Verify allocations page shows semester grouping
- [ ] Professional electives still work independently

### Backward Compatibility
- [ ] Old subjects without semester still work
- [ ] Existing preferences can still be viewed
- [ ] Teachers can update preferences to new structure
- [ ] Allocation process works with mixed semester data

---

## Installation Steps

1. **Install New Dependencies**
   ```bash
   # Server
   cd server
   npm install
   
   # Client
   cd ../client
   npm install
   ```

2. **Database Update**
   - Preference model schema updated (mongoose handles backward compatibility)
   - Existing documents will work without modification
   - New preferences will include semester field

3. **No Breaking Changes**
   - All existing functionality remains intact
   - New features are additive
   - Can enable semester feature gradually

---

## API Changes

### New Endpoint
- **POST /api/users/bulk-upload**
  - Body: `{ teachers: [{fullName, email, facultyId, ...}, ...] }`
  - Returns: Upload results with success/error breakdown
  - Auth: Admin only

### Modified Endpoints
- All other endpoints remain unchanged
- Preferences endpoint now accepts `semester` field (optional for compatibility)

---

## Known Limitations & Future Enhancements

1. **Current Limitations**
   - Semester values are free-text (can be "Odd", "Even", "Fall 2024", etc.)
   - Consider standardizing to fixed enum values in future

2. **Future Enhancements**
   - Add academic year to semester specification
   - Download existing teachers as Excel template
   - Bulk update/delete teachers
   - Semester/year configuration management
   - Advanced filtering in allocation view

---

## Support & Documentation

- Refer to README.md for project overview
- Check SETUP_GUIDE.md for deployment instructions
- AdminTeachersPage has inline help text for bulk upload
- AdminSubjectsPage has inline help text for semester selection
