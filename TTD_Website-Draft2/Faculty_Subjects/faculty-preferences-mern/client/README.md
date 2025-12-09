# Faculty Preferences Client

Frontend React application for Faculty Preferences Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.jsx      # Main layout with navigation
│   └── ProtectedRoute.jsx  # Route protection wrapper
│
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state management
│
├── pages/              # Page components
│   ├── AuthPage.jsx   # Login/Register page
│   ├── Dashboard.jsx  # Main dashboard
│   ├── ProfilePage.jsx    # User profile
│   ├── SubjectsPage.jsx   # View subjects
│   ├── PreferencesPage.jsx # Manage preferences
│   └── admin/         # Admin pages
│       ├── AdminSubjectsPage.jsx
│       ├── AdminTeachersPage.jsx
│       └── AdminPreferencesPage.jsx
│
├── utils/              # Utility functions
│   └── api.js         # Axios instance with interceptors
│
├── App.jsx            # Main app component with routes
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## Features

### Authentication
- Login and registration
- JWT token management
- Auto-redirect on unauthorized access
- Persistent login with localStorage

### User Roles

#### Teacher Role
- View all subjects
- Select preferred subjects
- Update personal profile
- View dashboard statistics

#### Admin Role
- Manage subjects (CRUD operations)
- View all teachers
- View all teacher preferences
- Delete users (except admin)

### UI Components
- Responsive layout with navigation
- Protected routes with role-based access
- Modal dialogs for forms
- Alert messages for feedback
- Loading states
- Styled tables and forms

## API Integration

The app connects to the backend API at `http://localhost:5000/api`.

All API calls include:
- Automatic JWT token attachment
- Error handling
- Response interceptors
- Auto-logout on 401 errors

## State Management

Uses React Context API for:
- Authentication state
- User data
- Login/logout functions
- Profile updates

## Routing

Protected routes require authentication:
- `/dashboard` - Main dashboard
- `/profile` - User profile
- `/subjects` - View subjects
- `/preferences` - Manage preferences

Admin-only routes:
- `/admin/subjects` - Manage subjects
- `/admin/teachers` - View teachers
- `/admin/preferences` - View preferences

Public routes:
- `/login` - Login/Register page

## Styling

- Custom CSS with modern styling
- Responsive design (mobile-friendly)
- Color scheme: Blue/Purple gradient
- Component-scoped styles where needed

## Development Tips

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `App.jsx`
3. Add navigation link in `Layout.jsx`

### Making API Calls
```javascript
import api from '../utils/api';

// GET request
const response = await api.get('/endpoint');

// POST request
const response = await api.post('/endpoint', data);

// PUT request
const response = await api.put('/endpoint/:id', data);

// DELETE request
const response = await api.delete('/endpoint/:id');
```

### Using Auth Context
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAdmin, login, logout } = useAuth();
  
  // Use auth state and functions
}
```

## Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

To preview:
```bash
npm run preview
```

## Environment Configuration

The app uses Vite's proxy feature to forward API calls to the backend.

See `vite.config.js` for configuration.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Cannot connect to API
- Ensure backend server is running on port 5000
- Check proxy configuration in vite.config.js

### Login not persisting
- Check browser localStorage
- Ensure JWT token is being saved
- Check token expiration in backend

### Styling issues
- Clear browser cache
- Check for CSS conflicts
- Verify class names in components
