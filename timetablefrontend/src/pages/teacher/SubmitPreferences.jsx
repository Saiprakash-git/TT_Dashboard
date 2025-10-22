import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "../../api/axiosInstance";

const SubmitPreferences = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  // Fetch subjects from backend
  const fetchSubjects = async () => {
    try {
      const res = await axios.get("/subjects");
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleToggle = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) return alert("Select at least one subject");

    try {
      await axios.post("/preferences", { subjects: selectedSubjects });
      alert("Preferences submitted successfully!");
      setSelectedSubjects([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex">
      <Sidebar role="teacher" />
      <div className="flex-1">
        <Navbar role="teacher" />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Submit Your Subject Preferences</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {subjects.map((subject) => (
              <div
                key={subject._id}
                onClick={() => handleToggle(subject._id)}
                className={`p-4 text-center rounded border cursor-pointer transition ${
                  selectedSubjects.includes(subject._id)
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {subject.name}
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
          >
            Submit Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitPreferences;
