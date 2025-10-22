import React from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const cards = [
    { name: "Submit Preferences", path: "/teacher/submit-preferences" },
    { name: "View Timetable", path: "/timetable" },
  ];

  return (
    <div className="flex">
      <Sidebar role="teacher" />
      <div className="flex-1">
        <Navbar role="teacher" />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((card) => (
              <div
                key={card.name}
                onClick={() => navigate(card.path)}
                className="p-6 rounded-lg shadow-lg bg-white cursor-pointer hover:shadow-xl transition text-center"
              >
                <h2 className="text-xl font-bold">{card.name}</h2>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
