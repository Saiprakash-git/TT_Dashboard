# Faculty Preferences Server

Backend API for Faculty Preferences Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
copy .env.example .env
```

3. Update `.env` with your configuration:
- MongoDB connection string
- JWT secret key
- Port number (default: 5000)

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "department": "Computer Science",
  "designation": "Professor",
  "phone": "1234567890"
}
```

### Subject Endpoints

#### Get All Subjects
```http
GET /subjects
Authorization: Bearer <token>
```

#### Create Subject (Admin Only)
```http
POST /subjects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Data Structures",
  "code": "CS201",
  "description": "Introduction to data structures",
  "credits": 3,
  "semester": "Fall 2024"
}
```

#### Update Subject (Admin Only)
```http
PUT /subjects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Advanced Data Structures",
  "credits": 4
}
```

#### Delete Subject (Admin Only)
```http
DELETE /subjects/:id
Authorization: Bearer <token>
```

### Preference Endpoints

#### Get My Preference
```http
GET /preferences/my/preference
Authorization: Bearer <token>
```

#### Save/Update Preference
```http
POST /preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "subjects": ["subjectId1", "subjectId2", "subjectId3"]
}
```

#### Get All Preferences (Admin Only)
```http
GET /preferences
Authorization: Bearer <token>
```

### User Management Endpoints (Admin Only)

#### Get All Users
```http
GET /users
Authorization: Bearer <token>
```

#### Update User
```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "role": "teacher"
}
```

#### Delete User
```http
DELETE /users/:id
Authorization: Bearer <token>
```

## Database Models

### User
- email (String, unique, required)
- password (String, required, hashed)
- fullName (String, required)
- role (String: 'admin' | 'teacher', default: 'teacher')
- department (String)
- designation (String)
- phone (String)

### Subject
- name (String, required)
- code (String, unique, required)
- description (String)
- credits (Number, default: 3)
- semester (String)

### Preference
- teacher (ObjectId, ref: User, unique)
- subjects (Array of ObjectId, ref: Subject)
- submittedAt (Date)

## Error Handling

All errors return in the format:
```json
{
  "success": false,
  "message": "Error message here"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- CORS protection
- MongoDB injection prevention

## Development

Run with auto-reload:
```bash
npm run dev
```

The server uses nodemon to automatically restart when files change.
