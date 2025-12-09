import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();

  const adminLinks = [
    { name: "Dashboard", path: "/admin" },
    { name: "Manage Teachers", path: "/admin/manage-teachers" },
    { name: "Create Admin", path: "/admin/create-admin" },
    { name: "Manage Batches", path: "/admin/manage-batches" },
    { name: "Manage Subjects", path: "/admin/manage-subjects" },
    { name: "Assign Subjects", path: "/admin/assign-subjects" },
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

  const location = useLocation();

  return (
    <aside className="bg-white w-64 min-h-screen border-r shadow-sm">
      <div className="p-6 flex flex-col h-full">
        <div>
          <div className="text-2xl font-bold text-slate-700 mb-1">{role === "admin" ? "Admin" : "Teacher"}</div>
          <div className="text-sm text-slate-500 mb-4">Control panel</div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {links.map((link) => {
              const active = location.pathname.startsWith(link.path);
              return (
                <li
                  key={link.name}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition ${active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  <span>{link.name}</span>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6 text-xs text-slate-400">Version 1.0 • Lightweight dashboard</div>
      </div>
    </aside>
  );
};

export default Sidebar;
