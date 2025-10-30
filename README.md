# TT_Dashboard — local run notes

This repository contains a small MERN-style application for teacher timetable preferences.

Structure (relevant):
- TimeTable/ (backend)
  - src/
    - server.js (entry)
    - app.js (express app)
    - config/db.js (mongoose connection)
    - controllers/
    - routes/
    - models/
    - middleware/
- timetablefrontend/ (frontend React app — Vite)
  - src/
    - main.jsx
    - App.jsx
    - context/AuthContext.jsx
    - api/axiosInstance.js
    - pages/ (Login, admin pages, teacher pages)

What I changed
- Fixed `ProtectedRoute.jsx` to use React context correctly (was calling AuthProvider as a hook).
- Added admin controller endpoints: subject list without semester filter, delete subject, teacher CRUD (list, add, delete) for the admin UI.
- Wired admin routes to expose those endpoints under `/api/admin/*`.
- Updated frontend pages to call the proper endpoints:
  - Teacher preferences page now calls `/api/teacher/subjects` and posts preferences as an array to `/api/teacher/preferences`.
  - Admin ManageSubjects and ManageTeachers now call admin-prefixed endpoints (`/api/admin/...`).

Environment / Requirements
- Node.js (v16+ recommended)
- MongoDB (local or remote). Provide MONGO_URI in backend `.env`.

Security note: the project now supports an optional `ADMIN_REGISTRATION_KEY` env var. If you set `ADMIN_REGISTRATION_KEY` in `TimeTable/.env`, the frontend register page (at `/register`) must include that key to create an admin. If not set, registration is allowed but a warning is logged — do not leave it unset in production.

Backend setup (TimeTable)
1. Copy `.env.example` (if any) or create `.env` in `TimeTable` folder with at least:

   MONGO_URI=mongodb://<user>:<pass>@host:port/dbname
   JWT_SECRET=your_jwt_secret_here
   PORT=5000

2. Install and run:

   # in a PowerShell terminal
   cd "f:/EAD_Project/TT_Dashboard/TimeTable"
   npm install
   npm run dev   # or `npm start` depending on package.json

3. Seed admin user (quick manual method):
   - You can register an admin user by directly inserting into MongoDB or creating a small script.
   - Alternatively, create a user in your DB with role `admin` and a hashed password. There's a simple `utils/hash.js` which prints a bcrypt hash if run in a supported environment.

Frontend setup (timetablefrontend)
1. Create `.env` if needed (Vite):
   VITE_API_URL=http://localhost:5000/api

2. Install and run:

   cd "f:/EAD_Project/TT_Dashboard/timetablefrontend"
   npm install
   npm run dev

Notes and next steps
- The current Login page is a placeholder and uses a dummy localStorage behavior; you should replace it with a real login flow using `/api/auth/login` and `AuthContext.login`.
- Auth middleware and JWT generation are already implemented on the backend. After implementing frontend login to call `/api/auth/login` and storing the returned token and user info via `AuthContext`, the protected admin/teacher UI should work.
- I updated some endpoints to be tolerant (e.g., `GET /api/admin/subjects` returns all subjects if no semester provided).

Timetable generation (new)
- Admins can generate a simple timetable for a semester using the admin UI: open "View Timetable" and enter a semester, then click "Generate Timetable". This calls `POST /api/timetable/admin/generate` and a basic allocation algorithm assigns subjects to teachers based on top preferences and fills a 5x4 grid (Mon-Fri, 4 periods).
- Admins can also view the latest generated timetable via `GET /api/timetable?semester=<n>`.
- Teachers can view their assigned subjects via `GET /api/timetable/teacher`.


If you want, I can:
- Implement a small seed script to create an admin user automatically.
- Wire the frontend login page to call the backend and persist user/token into `AuthContext`.
- Run local smoke tests (if you want me to run the server in this environment, give me permission and confirm you have MongoDB reachable from this runner).

---
Summary of changed files (brief):
- timetablefrontend/src/components/ProtectedRoute.jsx — fixed context usage
- TimeTable/src/controllers/adminController.js — added subject/teacher admin helper endpoints
- TimeTable/src/routes/adminRoutes.js — wired new admin routes
- timetablefrontend/src/pages/teacher/SubmitPreferences.jsx — post to `/teacher/preferences` with proper body
- timetablefrontend/src/pages/admin/ManageSubjects.jsx — use `/admin/subjects`
- timetablefrontend/src/pages/admin/ManageTeachers.jsx — use `/admin/teachers`

If you'd like, I can now:
- Wire frontend login to `/api/auth/login` and update `AuthContext.login` usage across the app, or
- Add an admin seed script and show commands to run it.

Tell me which of these you'd like next (seed admin, integrate login, or run quick checks), and I'll continue.