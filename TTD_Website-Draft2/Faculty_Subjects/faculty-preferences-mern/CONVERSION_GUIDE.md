# TypeScript/Supabase to JavaScript/MERN Conversion

## Overview

This document shows how the original TypeScript project with Supabase was converted to a JavaScript MERN stack project.

## Technology Stack Changes

### Original Project (faculty-preferences-hub-78-main)
| Component | Technology |
|-----------|-----------|
| Language | TypeScript |
| Frontend Framework | React with TypeScript |
| State Management | TanStack React Query |
| UI Components | shadcn/ui (Radix UI) |
| Styling | Tailwind CSS |
| Backend/Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Build Tool | Vite |

### New Project (faculty-preferences-mern)
| Component | Technology |
|-----------|-----------|
| Language | JavaScript (ES6+) |
| Frontend Framework | React with JavaScript |
| State Management | React Context API |
| UI Components | Custom React components |
| Styling | Custom CSS |
| Backend | Express.js + Node.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcryptjs |
| Build Tool | Vite |

## Feature Comparison

✅ All features have been preserved and converted:

### Authentication & Authorization
- ✅ User registration and login
- ✅ JWT-based authentication (replaced Supabase Auth)
- ✅ Role-based access control (admin/teacher)
- ✅ Auto-admin assignment for admin@gmail.com
- ✅ Protected routes
- ✅ Profile management

### Subject Management
- ✅ View all subjects
- ✅ Create subjects (admin only)
- ✅ Update subjects (admin only)
- ✅ Delete subjects (admin only)
- ✅ Subject fields: name, code, description, credits, semester

### Preference Management
- ✅ Teachers can select preferred subjects
- ✅ Save/update preferences
- ✅ View own preferences
- ✅ Admins can view all preferences
- ✅ Preference submission tracking

### User Management
- ✅ View all users (admin only)
- ✅ Update user information
- ✅ Delete users (admin only)
- ✅ User profile fields: name, email, department, designation, phone

### Dashboard
- ✅ Statistics overview
- ✅ Role-specific views
- ✅ Quick action links

## Database Schema Conversion

### Original (Supabase/PostgreSQL)

```sql
-- profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  department TEXT,
  designation TEXT,
  phone TEXT
);

-- subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY,
  name TEXT,
  code TEXT UNIQUE,
  description TEXT,
  credits INTEGER,
  semester TEXT
);

-- preferences table
CREATE TABLE preferences (
  id UUID PRIMARY KEY,
  teacher_id UUID,
  subject_ids UUID[]
);

-- user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID,
  role app_role
);
```

### New (MongoDB/Mongoose)

```javascript
// User model (combines profiles + user_roles)
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  fullName: String,
  role: String (enum: admin/teacher),
  department: String,
  designation: String,
  phone: String,
  timestamps: true
}

// Subject model
{
  _id: ObjectId,
  name: String,
  code: String (unique),
  description: String,
  credits: Number,
  semester: String,
  timestamps: true
}

// Preference model
{
  _id: ObjectId,
  teacher: ObjectId (ref: User),
  subjects: [ObjectId] (ref: Subject),
  submittedAt: Date,
  timestamps: true
}
```

## Code Structure Comparison

### File Organization

**Original:**
```
src/
├── integrations/supabase/  # Supabase client
├── hooks/                  # React hooks for data
├── contexts/              # Auth context
├── components/            # UI components
└── pages/                 # Page components
```

**New:**
```
server/                    # Backend API
├── models/               # Mongoose models
├── controllers/          # Business logic
├── routes/              # API routes
└── middleware/          # Auth & error handling

client/src/
├── utils/               # API client
├── contexts/           # Auth context
├── components/         # UI components
└── pages/             # Page components
```

### Authentication Flow

**Original (Supabase):**
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});

// Check auth
const { data: { session } } = await supabase.auth.getSession();

// Get profile
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .maybeSingle();
```

**New (JWT + Express):**
```javascript
// Login endpoint
router.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ email });
  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token, user });
});

// Auth middleware
const token = req.headers.authorization.split(' ')[1];
const decoded = jwt.verify(token, JWT_SECRET);
const user = await User.findById(decoded.id);
```

### Data Fetching

**Original (Supabase + React Query):**
```typescript
const { data: subjects } = useQuery({
  queryKey: ['subjects'],
  queryFn: async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    return data;
  }
});
```

**New (REST API + Context):**
```javascript
// API call
const response = await api.get('/api/subjects');
setSubjects(response.data.data);

// With auth header automatically added
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## API Endpoints Mapping

### Authentication
| Supabase | MERN |
|----------|------|
| `supabase.auth.signUp()` | `POST /api/auth/register` |
| `supabase.auth.signInWithPassword()` | `POST /api/auth/login` |
| `supabase.auth.getSession()` | `GET /api/auth/me` |
| `supabase.from('profiles').update()` | `PUT /api/auth/profile` |

### Subjects
| Supabase | MERN |
|----------|------|
| `from('subjects').select()` | `GET /api/subjects` |
| `from('subjects').insert()` | `POST /api/subjects` |
| `from('subjects').update()` | `PUT /api/subjects/:id` |
| `from('subjects').delete()` | `DELETE /api/subjects/:id` |

### Preferences
| Supabase | MERN |
|----------|------|
| `from('preferences').select()` | `GET /api/preferences/my/preference` |
| `from('preferences').upsert()` | `POST /api/preferences` |

## Key Improvements in MERN Version

### 1. **Full Backend Control**
   - Custom business logic
   - Flexible API design
   - No vendor lock-in
   - Easy to extend

### 2. **Simplified Authentication**
   - Standard JWT implementation
   - Easy to understand and maintain
   - Portable to other platforms

### 3. **Better for Learning**
   - See full stack implementation
   - Understand each layer
   - No "magic" from BaaS

### 4. **Cost Efficiency**
   - No Supabase subscription needed
   - Free MongoDB Atlas tier available
   - Can deploy anywhere

### 5. **Flexibility**
   - Easy to add custom endpoints
   - Full control over database queries
   - Can add any npm package

## Running the Projects

### Original (TypeScript/Supabase)
```bash
cd faculty-preferences-hub-78-main
npm install
# Need to configure Supabase project
# Need to set environment variables
npm run dev
```

### New (JavaScript/MERN)
```bash
# Backend
cd faculty-preferences-mern/server
npm install
npm run dev

# Frontend
cd faculty-preferences-mern/client
npm install
npm run dev
```

## Migration Benefits

1. **No Cloud Dependencies**: Works completely offline with local MongoDB
2. **Learning Value**: Full visibility into backend operations
3. **Customization**: Easy to modify any part of the stack
4. **Portability**: Can deploy anywhere that supports Node.js
5. **Cost**: Free for development and small deployments
6. **JavaScript Everywhere**: No TypeScript compilation needed

## Conclusion

The MERN version successfully replicates all features of the original Supabase project while providing:
- Greater control over the entire stack
- Simpler setup for local development
- Better learning opportunities
- More deployment options
- No vendor dependencies

Both projects maintain the same user experience and functionality, but the MERN version is more suitable for learning, customization, and independent deployment.
