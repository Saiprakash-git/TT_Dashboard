import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageSubjects from "./pages/admin/ManageSubjects";
import AddSubject from "./pages/admin/AddSubject";
import RegisterTeacher from "./pages/admin/RegisterTeacher";
import ViewPreferences from "./pages/admin/ViewPreferences";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import SubmitPreferences from "./pages/teacher/SubmitPreferences";

// Timetable
import TimetableView from "./pages/TimetableView";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-teachers"
          element={
            <ProtectedRoute role="admin">
              <ManageTeachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-subjects"
          element={
            <ProtectedRoute role="admin">
              <ManageSubjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/add-subject"
          element={
            <ProtectedRoute role="admin">
              <AddSubject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/register-teacher"
          element={
            <ProtectedRoute role="admin">
              <RegisterTeacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/view-preferences"
          element={
            <ProtectedRoute role="admin">
              <ViewPreferences />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/submit-preferences"
          element={
            <ProtectedRoute role="teacher">
              <SubmitPreferences />
            </ProtectedRoute>
          }
        />

        {/* Timetable (accessible to both) */}
        <Route
          path="/timetable"
          element={
            <ProtectedRoute role={["admin", "teacher"]}>
              <TimetableView />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
