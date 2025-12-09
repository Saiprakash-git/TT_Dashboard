# Faculty Preferences Management System (MERN Stack)

A full-stack web application for managing faculty subject preferences, built with MongoDB, Express.js, React, and Node.js.

## Features

### For Teachers
- **Subject Browsing**: View all available subjects with details
- **Preference Management**: Select and submit preferred subjects to teach
- **Profile Management**: Update personal information
- **Dashboard**: View statistics and quick actions

### For Admins
- **Subject Management**: Create, update, and delete subjects
- **Teacher Management**: View and manage all teachers
- **Preference Viewing**: View all teacher preferences with detailed information
- **Analytics Dashboard**: Overview of system statistics

### General Features
- **Authentication**: Secure JWT-based authentication
- **Role-based Access**: Separate views for teachers and admins
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Instant feedback on all operations

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Routing
- **Axios** - HTTP client
- **Vite** - Build tool
- **Context API** - State management

## Project Structure

```
faculty-preferences-mern/
├── server/                 # Backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── .env.example      # Environment variables template
│   ├── package.json      # Backend dependencies
│   └── server.js         # Entry point
│
├── client/                # Frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── utils/        # Utility functions
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── index.html        # HTML template
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
│
└── README.md             # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone or Navigate to the Project
```bash
cd faculty-preferences-mern
```

### Step 2: Setup Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env

# Edit .env file with your configuration
# - Set MONGODB_URI (local or Atlas connection string)
# - Set JWT_SECRET (use a strong random string)
# - Adjust PORT if needed (default: 5000)

# Start the server
npm run dev
```

The backend server will start on `http://localhost:5000`

### Step 3: Setup Frontend

```bash
# Open a new terminal and navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 4: Setup MongoDB

#### Option A: Local MongoDB
1. Install MongoDB on your machine
2. Start MongoDB service
3. Database will be created automatically on first run

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update MONGODB_URI in server/.env

## Default Admin Account

The system automatically assigns admin role to users with email `admin@gmail.com`.

To create an admin account:
1. Go to the registration page
2. Register with email: `admin@gmail.com`
3. Use any password (minimum 6 characters)
4. You'll automatically get admin privileges

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create subject (Admin only)
- `PUT /api/subjects/:id` - Update subject (Admin only)
- `DELETE /api/subjects/:id` - Delete subject (Admin only)

### Preferences
- `GET /api/preferences/my/preference` - Get current user's preference
- `POST /api/preferences` - Save/Update preference
- `GET /api/preferences` - Get all preferences (Admin only)

### Users
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

## Usage Guide

### For Teachers
1. **Register/Login**: Create an account or login
2. **View Subjects**: Browse available subjects from the Subjects page
3. **Set Preferences**: Go to "My Preferences" and select subjects you want to teach
4. **Update Profile**: Add your department, designation, and contact info

### For Admins
1. **Login**: Use admin@gmail.com account
2. **Manage Subjects**: Add, edit, or delete subjects
3. **View Teachers**: See all registered teachers and their information
4. **View Preferences**: Check which subjects each teacher has selected

## Development

### Backend Development
```bash
cd server
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd client
npm run dev  # Vite dev server with HMR
```

### Build for Production

#### Backend
```bash
cd server
npm start
```

#### Frontend
```bash
cd client
npm run build  # Creates dist/ folder
npm run preview  # Preview production build
```

## Environment Variables

### Server (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/faculty_preferences
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- For Atlas, whitelist your IP address

### Port Already in Use
- Change PORT in server/.env
- Change port in client/vite.config.js

### CORS Errors
- Ensure CORS_ORIGIN in server/.env matches your frontend URL
- Restart the server after changing .env

## Future Enhancements
- Email notifications
- Export preferences to Excel/PDF
- Subject allocation algorithm
- Advanced filtering and search
- File upload for profile pictures
- Password reset functionality

## License
MIT

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## Support
For issues or questions, please open an issue in the repository.
