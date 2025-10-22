import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Assuming you have AuthContext

/**
 * ProtectedRoute component
 * @param {ReactNode} children - The page/component to render
 * @param {string|string[]} role - Role(s) allowed to access this route
 */
const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth(); // user object should contain role info

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/" />;
  }

  // Convert role to array for uniformity
  const allowedRoles = Array.isArray(role) ? role : [role];

  // If user role not allowed, redirect to their dashboard
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/teacher"} />;
  }

  return children;
};

export default ProtectedRoute;
