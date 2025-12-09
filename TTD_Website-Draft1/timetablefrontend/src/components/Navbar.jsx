import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = ({ role }) => {
  const navigate = useNavigate();

  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    // clear auth and navigate to login
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => navigate(role === "admin" ? "/admin" : "/teacher")}>
              TTS
            </div>
            <div className="text-sm font-medium text-slate-600">Teacher Timetable System</div>
            <div className="ml-4 text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">{role?.toUpperCase()}</div>
          </div>

          <div className="flex items-center gap-3">
            {user && <div className="text-sm text-slate-700">{user.name}</div>}
            <button
              onClick={() => navigate(role === "teacher" ? "/teacher/profile" : "/admin")}
              className="px-3 py-1 rounded bg-slate-50 border text-sm hover:bg-slate-100"
            >
              Profile
            </button>
            <button onClick={handleLogout} className="px-3 py-1 rounded bg-red-50 border text-sm text-red-600 hover:bg-red-100">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
