# Faculty Preferences System - Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                     http://localhost:5173                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Auth Page   │  │  Dashboard   │  │  Profile     │         │
│  │              │  │              │  │  Page        │         │
│  │ - Login      │  │ - Stats      │  │              │         │
│  │ - Register   │  │ - Overview   │  │ - Update     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Subjects    │  │ Preferences  │  │  Admin       │         │
│  │  Page        │  │  Page        │  │  Pages       │         │
│  │              │  │              │  │              │         │
│  │ - View All   │  │ - Select     │  │ - Manage     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌───────────────────────────────────────────────────┐         │
│  │           AuthContext (State Management)           │         │
│  │  - user, login, logout, updateProfile             │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                  │
│  ┌───────────────────────────────────────────────────┐         │
│  │         API Client (Axios + Interceptors)          │         │
│  │  - Automatic JWT token injection                  │         │
│  │  - Error handling & auto-logout on 401            │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         │ (JSON)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      BACKEND (Express.js)                        │
│                     http://localhost:5000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────┐         │
│  │                  API Routes                        │         │
│  ├───────────────────────────────────────────────────┤         │
│  │  /api/auth/*       - Authentication endpoints     │         │
│  │  /api/subjects/*   - Subject management           │         │
│  │  /api/preferences/* - Preference management       │         │
│  │  /api/users/*      - User management (admin)      │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                  │
│  ┌───────────────────────────────────────────────────┐         │
│  │              Middleware Layer                      │         │
│  ├───────────────────────────────────────────────────┤         │
│  │  - JWT Authentication (protect)                   │         │
│  │  - Role Authorization (authorize)                 │         │
│  │  - Error Handler                                  │         │
│  │  - CORS                                            │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                  │
│  ┌───────────────────────────────────────────────────┐         │
│  │              Controllers                           │         │
│  ├───────────────────────────────────────────────────┤         │
│  │  - authController    (login, register, profile)   │         │
│  │  - subjectController (CRUD operations)            │         │
│  │  - preferenceController (save, view)              │         │
│  │  - userController    (admin management)           │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                  │
│  ┌───────────────────────────────────────────────────┐         │
│  │           Mongoose Models (ODM)                    │         │
│  ├───────────────────────────────────────────────────┤         │
│  │  - User Model     (users, auth, profiles)         │         │
│  │  - Subject Model  (academic subjects)             │         │
│  │  - Preference Model (teacher preferences)         │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ MongoDB Driver
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                   DATABASE (MongoDB)                             │
│                mongodb://localhost:27017                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Database: faculty_preferences                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────┐               │
│  │  Collection: users                           │               │
│  ├─────────────────────────────────────────────┤               │
│  │  - _id, email, password (hashed)            │               │
│  │  - fullName, role, department               │               │
│  │  - designation, phone                       │               │
│  │  - createdAt, updatedAt                     │               │
│  └─────────────────────────────────────────────┘               │
│                                                                  │
│  ┌─────────────────────────────────────────────┐               │
│  │  Collection: subjects                        │               │
│  ├─────────────────────────────────────────────┤               │
│  │  - _id, name, code (unique)                 │               │
│  │  - description, credits, semester           │               │
│  │  - createdAt, updatedAt                     │               │
│  └─────────────────────────────────────────────┘               │
│                                                                  │
│  ┌─────────────────────────────────────────────┐               │
│  │  Collection: preferences                     │               │
│  ├─────────────────────────────────────────────┤               │
│  │  - _id, teacher (ref: User)                 │               │
│  │  - subjects (array of Subject refs)         │               │
│  │  - submittedAt, createdAt, updatedAt        │               │
│  └─────────────────────────────────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


DATA FLOW EXAMPLES:
───────────────────

1. USER LOGIN
   └─> React: Login form submitted
       └─> API: POST /api/auth/login {email, password}
           └─> Controller: Validate credentials
               └─> Model: Find user, compare password
                   └─> JWT: Generate token
                       └─> Response: {token, user}
                           └─> React: Store token, update context
                               └─> Navigate to dashboard

2. VIEW SUBJECTS (Teacher)
   └─> React: SubjectsPage mounted
       └─> API: GET /api/subjects (with JWT)
           └─> Middleware: Verify token
               └─> Controller: Get all subjects
                   └─> Model: Query MongoDB
                       └─> Response: {subjects array}
                           └─> React: Display in table

3. SAVE PREFERENCES (Teacher)
   └─> React: Select subjects, click save
       └─> API: POST /api/preferences {subjects: [ids]}
           └─> Middleware: Verify token (teacher role)
               └─> Controller: Upsert preference
                   └─> Model: Update or create document
                       └─> Response: {success, data}
                           └─> React: Show success message

4. CREATE SUBJECT (Admin)
   └─> React: Admin fills form, submits
       └─> API: POST /api/subjects {name, code, ...}
           └─> Middleware: Verify token + admin role
               └─> Controller: Create subject
                   └─> Model: Insert into MongoDB
                       └─> Response: {success, subject}
                           └─> React: Update list, close modal


AUTHENTICATION FLOW:
────────────────────

┌──────────┐                  ┌──────────┐                  ┌──────────┐
│  Client  │                  │  Server  │                  │ Database │
└────┬─────┘                  └────┬─────┘                  └────┬─────┘
     │                             │                             │
     │ 1. POST /auth/login         │                             │
     ├────────────────────────────>│                             │
     │    {email, password}        │                             │
     │                             │                             │
     │                             │ 2. Find user                │
     │                             ├────────────────────────────>│
     │                             │                             │
     │                             │ 3. User document            │
     │                             │<────────────────────────────┤
     │                             │                             │
     │                             │ 4. Compare password         │
     │                             │    (bcrypt.compare)         │
     │                             │                             │
     │                             │ 5. Generate JWT token       │
     │                             │    (jwt.sign)               │
     │                             │                             │
     │ 6. {token, user}            │                             │
     │<────────────────────────────┤                             │
     │                             │                             │
     │ 7. Store token              │                             │
     │    localStorage.set()       │                             │
     │                             │                             │
     │ 8. Future requests          │                             │
     │    Authorization: Bearer    │                             │
     ├────────────────────────────>│                             │
     │                             │                             │
     │                             │ 9. Verify token             │
     │                             │    (jwt.verify)             │
     │                             │                             │
     │                             │ 10. Get user from DB        │
     │                             ├────────────────────────────>│
     │                             │                             │
     │                             │ 11. User data               │
     │                             │<────────────────────────────┤
     │                             │                             │
     │ 12. Protected resource      │                             │
     │<────────────────────────────┤                             │
     │                             │                             │


ROLE-BASED ACCESS:
──────────────────

Teacher Role:
  ✓ View subjects
  ✓ Manage own preferences
  ✓ Update own profile
  ✗ Cannot access admin routes

Admin Role:
  ✓ All teacher permissions
  ✓ Create/Edit/Delete subjects
  ✓ View all teachers
  ✓ View all preferences
  ✓ Manage users
  ✓ Access admin dashboard


DEPLOYMENT ARCHITECTURE:
────────────────────────

Development:
  Frontend: localhost:5173 (Vite dev server)
  Backend:  localhost:5000 (Express with nodemon)
  Database: localhost:27017 (Local MongoDB)

Production Options:

Option 1: Separate Deployment
  Frontend: Vercel/Netlify (Static build)
  Backend:  Heroku/Railway/Render (Node.js)
  Database: MongoDB Atlas (Cloud)

Option 2: Monolithic Deployment
  Full Stack: DigitalOcean/AWS/Azure
  - Build React (npm run build)
  - Serve static files from Express
  - Single deployment unit
