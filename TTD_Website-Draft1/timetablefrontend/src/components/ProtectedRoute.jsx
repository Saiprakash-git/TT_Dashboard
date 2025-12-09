import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * ProtectedRoute component
 * @param {ReactNode} children - The page/component to render
 * @param {string|string[]} role - Role(s) allowed to access this route
 */
const ProtectedRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If role is provided, check it; otherwise allow any authenticated user
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={user.role === "admin" ? "/admin" : "/teacher"} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
