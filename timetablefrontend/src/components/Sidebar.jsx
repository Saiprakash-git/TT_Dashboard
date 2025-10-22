import React from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();

  const adminLinks = [
    { name: "Dashboard", path: "/admin" },
    { name: "Manage Teachers", path: "/manage-teachers" },
    { name: "Manage Subjects", path: "/manage-subjects" },
    { name: "View Timetable", path: "/timetable" },
  ];

  const teacherLinks = [
    { name: "Dashboard", path: "/teacher" },
    { name: "View Timetable", path: "/timetable" },
  ];

  const links = role === "admin" ? adminLinks : teacherLinks;

  return (
    <div className="bg-gray-800 text-white w-60 min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-6">{role === "admin" ? "Admin Menu" : "Teacher Menu"}</h2>
      <ul>
        {links.map((link) => (
          <li
            key={link.name}
            onClick={() => navigate(link.path)}
            className="mb-3 p-3 rounded hover:bg-gray-700 cursor-pointer transition"
          >
            {link.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
