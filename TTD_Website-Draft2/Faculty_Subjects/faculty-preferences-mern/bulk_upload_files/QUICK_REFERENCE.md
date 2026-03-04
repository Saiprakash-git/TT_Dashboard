# Excel File Quick Reference Card

## 📌 Quick Info

### File Naming
```
✓ Teachers_Batch_2024_Feb.xlsx
✓ Faculty_Upload_Spring_2024.xlsx
✓ CSE_Department_Batch_01.xlsx
```

### File Location
```
project-root/
└── bulk_upload_files/
    ├── Teachers_Batch_2024_Feb.xlsx      ← Your upload file
    ├── Teachers_Batch_Example_Feb2024.csv  ← Sample with data
    └── Teachers_Upload_Template_BLANK.csv  ← Empty template
```

---

## 📋 Column Structure (Order Matters!)

```
Column A  | Column B   | Column C     | Column D      | Column E       | Column F | Column G
----------|-----------|-------------|--------------|----------------|----------|----------
fullName  | email     | facultyId   | department   | designation    | phone    | password
Required  | Required  | Required    | Optional     | Optional       | Optional | Optional
Text      | Email     | AlphaNum    | Text         | Text           | Text     | Text
Max 100   | Max 255   | Max 50      | Max 100      | Max 100        | Max 20   | Min 6
```

---

## ✅ Data Entry Rules

### Required Fields (Must Fill)
```
✓ fullName     → Dr. Rajesh Kumar
✓ email        → rajesh@college.edu (must be valid, must be unique)
✓ facultyId    → CSE001 (must be unique, used for login)
```

### Optional Fields (Can Leave Empty)
```
○ department   → Computer Science & Engineering
○ designation  → Associate Professor
○ phone        → 9876543210
○ password     → (empty = auto temp123) or (filled = use provided)
```

---

## 📊 Sample Row

```
Dr. Rajesh Kumar | rajesh@college.edu | CSE001 | Computer Science | Associate Prof | 9876543210 | 
```

**Breakdown:**
- `Dr. Rajesh Kumar` - Full name ✓
- `rajesh@college.edu` - Valid email ✓
- `CSE001` - Unique faculty ID ✓
- `Computer Science` - Department (optional) ✓
- `Associate Prof` - Designation (optional) ✓
- `9876543210` - Phone (optional) ✓
- (empty) - No password, will be "temp123" ✓

---

## ❌ Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid email format" | notanemail | Use: user@domain.com |
| "Email already exists" | Duplicate email | Check and change email |
| "Faculty ID already exists" | Duplicate ID | Change facultyId |
| "Missing required fields" | Empty required column | Fill fullName/email/facultyId |

---

## 🎯 Pre-Upload Checklist

- [ ] File saved as `.xlsx`, `.xls`, or `.csv`
- [ ] Filename: `Teachers_Batch_YYYY_MMM.xlsx`
- [ ] Location: `bulk_upload_files/` folder
- [ ] Row 1: Headers (fullName, email, facultyId, etc.)
- [ ] All required fields filled (A, B, C columns)
- [ ] No empty rows in the middle of data
- [ ] All emails valid format (xxx@xxx.xxx)
- [ ] No duplicate emails
- [ ] No duplicate facultyIds
- [ ] Phone numbers formatted as text (not numbers)

---

## 📁 Files Provided

| File | Purpose | Use |
|------|---------|-----|
| `Teachers_Batch_Example_Feb2024.csv` | Example with real data | Copy & modify |
| `Teachers_Upload_Template_BLANK.csv` | Empty template | Fill with your data |
| `EXCEL_FILE_GUIDE.md` | Complete guide | Reference |

---

## 🚀 Quick Start Steps

1. **Create File**
   - Copy `Teachers_Upload_Template_BLANK.csv`
   - Rename: `Teachers_Batch_2024_Feb.xlsx`
   - Fill with your teacher data

2. **Validate**
   - Check all required fields filled
   - Ensure unique emails and IDs
   - Valid email format

3. **Upload**
   - Admin → Manage Teachers
   - Bulk Upload Teachers section
   - Choose file
   - View results

4. **Done!**
   - Teachers appear in system
   - Review success/error count

---

## 📝 Full Template Data

**Use this as starting point:**

```
fullName,email,facultyId,department,designation,phone,password
Dr. Name1,name1@college.edu,DEPT001,Department,Professor,9876543210,
Dr. Name2,name2@college.edu,DEPT002,Department,Associate Prof,9876543211,
Dr. Name3,name3@college.edu,DEPT003,Department,Assistant Prof,9876543212,temp@123
```

---

## 💡 Tips

✓ Leave password empty → Teacher gets "temp123", must reset  
✓ Set password → Teacher gets that password immediately  
✓ Use consistent naming → Makes it easier to track  
✓ One file per batch → Easier to manage and track  
✓ Keep archive → Save uploaded files for records  
✓ Use date in filename → Know when file was created  

---

## 📞 Support

For questions about:
- **File format** → See EXCEL_FILE_GUIDE.md
- **Upload errors** → Check error message in results
- **Column structure** → Refer to table above
- **Sample data** → Use Teachers_Batch_Example_Feb2024.csv

