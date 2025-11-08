import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
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
    <nav className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex justify-between items-center p-4 shadow-md">
      <div className="flex items-center space-x-4">
        <div className="text-2xl font-extrabold cursor-pointer" onClick={() => navigate(role === "admin" ? "/admin" : "/teacher")}>
          TTS
        </div>
        <div className="text-lg font-semibold">Teacher Timetable System</div>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="text-sm text-white/90">{user.name}</div>
        )}
        <button
          onClick={() => navigate(role === "teacher" ? "/teacher/profile" : "/admin")}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition"
        >
          Profile
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
