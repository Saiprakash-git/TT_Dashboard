# Quick Reference Card

## 🚀 Start the Application

### Backend
```bash
cd server
npm run dev
```
Server runs on: **http://localhost:5000**

### Frontend
```bash
cd client
npm run dev
```
App opens on: **http://localhost:5173**

---

## 🔑 Default Login

**Admin Account:**
- Email: `admin@gmail.com`
- Password: Set during registration
- Gets admin role automatically

**Teacher Account:**
- Email: Any other email
- Password: Set during registration
- Gets teacher role by default

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Subjects
- `GET /api/subjects` - List all
- `POST /api/subjects` - Create (admin)
- `PUT /api/subjects/:id` - Update (admin)
- `DELETE /api/subjects/:id` - Delete (admin)

### Preferences
- `GET /api/preferences/my/preference` - My preference
- `POST /api/preferences` - Save/update
- `GET /api/preferences` - All (admin)

### Users (Admin)
- `GET /api/users` - List all
- `PUT /api/users/:id` - Update
- `DELETE /api/users/:id` - Delete

---

## 📁 Important Files

### Backend
- `server/.env` - Environment config
- `server/server.js` - Entry point
- `server/models/` - Database schemas
- `server/routes/` - API routes

### Frontend
- `client/src/App.jsx` - Main app
- `client/src/contexts/AuthContext.jsx` - Auth state
- `client/src/utils/api.js` - API client
- `client/src/pages/` - All pages

---

## 🛠️ Common Commands

### Install Dependencies
```bash
npm install
```

### Start Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Check MongoDB Connection
```bash
mongo --eval "db.runCommand({ connectionStatus: 1 })"
```

---

## 🐛 Troubleshooting

### MongoDB not running?
```bash
net start MongoDB  # Windows
brew services start mongodb-community  # Mac
sudo systemctl start mongod  # Linux
```

### Port already in use?
Change in `server/.env`:
```
PORT=5001
```

### Clear and reinstall?
```bash
Remove-Item -Recurse node_modules
Remove-Item package-lock.json
npm install
```

---

## 📊 Database Collections

### users
```javascript
{
  email: String,
  password: String (hashed),
  fullName: String,
  role: "admin" | "teacher",
  department: String,
  designation: String,
  phone: String
}
```

### subjects
```javascript
{
  name: String,
  code: String (unique),
  description: String,
  credits: Number,
  semester: String
}
```

### preferences
```javascript
{
  teacher: ObjectId (User),
  subjects: [ObjectId (Subject)],
  submittedAt: Date
}
```

---

## 🎯 User Stories

### As a Teacher:
1. Register account
2. Login
3. View all subjects
4. Select preferred subjects
5. Save preferences
6. Update profile

### As an Admin:
1. Login with admin@gmail.com
2. Create subjects
3. View all teachers
4. View all preferences
5. Manage users

---

## 📝 Environment Variables

### server/.env
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/faculty_preferences
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

---

## 🔒 Security Features

- ✅ Password hashing (bcryptjs)
- ✅ JWT authentication
- ✅ Protected routes
- ✅ Role-based access
- ✅ CORS protection
- ✅ Input validation

---

## 📦 Dependencies

### Backend (server)
- express - Web framework
- mongoose - MongoDB ODM
- jsonwebtoken - JWT auth
- bcryptjs - Password hashing
- dotenv - Environment variables
- cors - CORS handling

### Frontend (client)
- react - UI library
- react-router-dom - Routing
- axios - HTTP client
- vite - Build tool

---

## 🎨 Project Structure

```
faculty-preferences-mern/
├── server/           # Backend
│   ├── config/       # DB config
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth & errors
│   ├── models/       # Mongoose models
│   └── routes/       # API routes
└── client/           # Frontend
    └── src/
        ├── components/   # Reusable UI
        ├── contexts/     # State
        ├── pages/        # Views
        └── utils/        # Helpers
```

---

## 🚀 Deployment Checklist

- [ ] Set strong JWT_SECRET
- [ ] Use MongoDB Atlas
- [ ] Set NODE_ENV=production
- [ ] Build React app
- [ ] Configure CORS properly
- [ ] Set up SSL/HTTPS
- [ ] Add rate limiting
- [ ] Set up monitoring

---

## 📚 Helpful Links

- MongoDB: https://www.mongodb.com/
- Express: https://expressjs.com/
- React: https://react.dev/
- JWT: https://jwt.io/

---

## 💡 Tips

1. Always start MongoDB first
2. Run backend before frontend
3. Check console for errors
4. Use admin@gmail.com for admin role
5. Keep .env file secure
6. Clear browser cache if issues

---

## ⚡ Quick Test Flow

1. Start MongoDB
2. Start backend: `cd server && npm run dev`
3. Start frontend: `cd client && npm run dev`
4. Register with admin@gmail.com
5. Create a subject
6. Register teacher account
7. Select preferences as teacher
8. View preferences as admin

✅ All working? You're ready to go!
