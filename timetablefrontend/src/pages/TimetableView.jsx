import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "../api/axiosInstance";
import { getRole } from "../context/AuthContext"; // Or use your auth context

const TimetableView = () => {
  const role = getRole(); // "admin" or "teacher"
  const [timetable, setTimetable] = useState([]);

  // Fetch timetable from backend
  const fetchTimetable = async () => {
    try {
      const res =
        role === "admin"
          ? await axios.get("/timetable")
          : await axios.get("/timetable/teacher"); // Teacher sees only their periods
      setTimetable(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [role]);

  return (
    <div className="flex">
      <Sidebar role={role} />
      <div className="flex-1">
        <Navbar role={role} />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Timetable</h1>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 border">Day</th>
                  <th className="p-4 border">Period 1</th>
                  <th className="p-4 border">Period 2</th>
                  <th className="p-4 border">Period 3</th>
                  <th className="p-4 border">Period 4</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((row) => (
                  <tr key={row.day} className="hover:bg-gray-100">
                    <td className="p-4 border font-bold">{row.day}</td>
                    {row.slots.map((slot, i) => (
                      <td key={i} className="p-4 border text-center">
                        {slot.subjectName} {/* assuming backend returns subjectName */}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableView;
