# Faculty Preferences Management System - Setup Guide

## Quick Start

Follow these steps to get the application running:

### 1. Install MongoDB

#### Windows:
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will start automatically as a service

#### macOS (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 2. Setup Backend

Open PowerShell/Terminal and run:

```powershell
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env file with your settings
# For local MongoDB, use: MONGODB_URI=mongodb://localhost:27017/faculty_preferences
# Generate a random JWT_SECRET or use: your_very_secure_jwt_secret_key_here

# Start the server
npm run dev
```

You should see: "Server running in development mode on port 5000" and "MongoDB Connected"

### 3. Setup Frontend

Open a NEW PowerShell/Terminal window and run:

```powershell
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

You should see: "Local: http://localhost:5173"

### 4. Access the Application

1. Open your browser and go to: http://localhost:5173
2. You'll see the Login/Register page

### 5. Create Admin Account

1. Click "Register"
2. Fill in:
   - Email: `admin@gmail.com` (this email gets admin role automatically)
   - Password: any password (minimum 6 characters)
   - Full Name: Your name
3. Click "Register"
4. You'll be logged in as admin

### 6. Add Sample Data (Optional)

As admin, you can:
1. Go to "Manage Subjects" and add some subjects
2. Register another account (with different email) to test teacher features

---

## Troubleshooting

### MongoDB Connection Error

**Error**: "MongooseServerSelectionError: connect ECONNREFUSED"

**Solution**:
- Ensure MongoDB is running
- Windows: Check if MongoDB service is started (Services app)
- Mac/Linux: Run `sudo systemctl status mongod` or `brew services list`
- Try restarting MongoDB service

### Port Already in Use

**Error**: "Port 5000 is already in use"

**Solution**:
1. Change port in `server/.env`: `PORT=5001`
2. Update proxy in `client/vite.config.js` to point to new port

### Cannot Install Dependencies

**Error**: npm install fails

**Solution**:
- Ensure you have Node.js v16+ installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete node_modules folder and try again
- Try using `npm install --legacy-peer-deps`

### CORS Errors in Browser

**Error**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**:
1. Ensure CORS_ORIGIN in `server/.env` matches your frontend URL
2. Restart the backend server
3. Clear browser cache

---

## Using MongoDB Atlas (Cloud Database)

If you prefer not to install MongoDB locally:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Create a database user (Database Access)
5. Whitelist your IP (Network Access) or allow access from anywhere (0.0.0.0/0)
6. Get your connection string (Connect -> Connect your application)
7. Update `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/faculty_preferences?retryWrites=true&w=majority
   ```
8. Restart the server

---

## Default Credentials

### Admin Account
- Email: admin@gmail.com
- Password: (whatever you set during registration)

### Teacher Account
- Email: (any email except admin@gmail.com)
- Password: (whatever you set during registration)

---

## Project Features

### For Teachers:
✅ View all subjects
✅ Select preferred subjects to teach
✅ Update profile information
✅ View dashboard statistics

### For Admins:
✅ Create, edit, delete subjects
✅ View all registered teachers
✅ View all teacher preferences
✅ Manage user accounts
✅ System overview dashboard

---

## Next Steps

1. Create an admin account
2. Add subjects (Go to "Manage Subjects")
3. Create a teacher account (logout and register with different email)
4. As teacher, select subject preferences
5. As admin, view all preferences

---

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Ensure all prerequisites are installed
3. Check server console for error messages
4. Check browser console (F12) for frontend errors

---

## Production Deployment

For production deployment, see the main README.md file for:
- Environment setup
- Security considerations
- Build process
- Hosting options
