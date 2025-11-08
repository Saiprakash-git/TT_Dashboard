import React from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();

  const adminLinks = [
    { name: "Dashboard", path: "/admin" },
    { name: "Manage Teachers", path: "/admin/manage-teachers" },
    { name: "Manage Subjects", path: "/admin/manage-subjects" },
    { name: "Manage Deadlines", path: "/admin/manage-deadlines" },
    { name: "Allocate Subjects", path: "/admin/allocate" },
    { name: "View Timetable", path: "/timetable" },
  ];

  const teacherLinks = [
    { name: "Dashboard", path: "/teacher" },
    { name: "Submit Preferences", path: "/teacher/submit-preferences" },
    { name: "My Preferences", path: "/teacher/my-preferences" },
    { name: "View Timetable", path: "/timetable" },
    { name: "Profile", path: "/teacher/profile" },
  ];

  const links = role === "admin" ? adminLinks : teacherLinks;

  return (
    <aside className="bg-white w-64 min-h-screen border-r shadow-sm">
      <div className="p-6">
        <div className="text-2xl font-bold text-slate-700 mb-2">{role === "admin" ? "Admin" : "Teacher"}</div>
        <div className="text-sm text-slate-500 mb-6">Control panel</div>

        <nav>
          <ul className="space-y-2">
            {links.map((link) => (
              <li
                key={link.name}
                onClick={() => navigate(link.path)}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-slate-100 cursor-pointer transition text-slate-700"
              >
                <span>{link.name}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
