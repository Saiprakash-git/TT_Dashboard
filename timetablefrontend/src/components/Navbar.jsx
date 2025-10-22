import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ role }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 text-white flex justify-between items-center p-4 shadow">
      <div className="font-bold text-xl cursor-pointer" onClick={() => navigate(role === "admin" ? "/admin" : "/teacher")}>
        Teacher Timetable System
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition"
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
