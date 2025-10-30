import React, { useEffect, useState, useContext } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "../../api/axiosInstance";
import { AuthContext } from "../../context/AuthContext";

const SubmitPreferences = () => {
  const [subjects, setSubjects] = useState([]);
  // selectedRanks: { subjectId: rank }
  const [selectedRanks, setSelectedRanks] = useState({});
  const [semester, setSemester] = useState("");
  const [semesters, setSemesters] = useState([]);

  // Fetch subjects from backend
  const fetchSubjects = async () => {
    try {
      // teacher-specific endpoint, pass selected semester
      const res = await axios.get("/teacher/subjects", { params: { semester } });
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSemesters();
    // fetchSubjects(); // fetch when semester selected
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await axios.get('/teacher/semesters');
      setSemesters(res.data || []);
      if (res.data && res.data.length) setSemester(res.data[0]);
    } catch (err) {
      console.error('failed to load semesters', err);
    }
  }

  useEffect(() => {
    if (semester) fetchSubjects();
  }, [semester]);

  const usedRanks = Object.values(selectedRanks);

  const handleRankChange = (subjectId, rank) => {
    setSelectedRanks((prev) => {
      const copy = { ...prev };
      if (rank === "") {
        delete copy[subjectId];
      } else {
        copy[subjectId] = Number(rank);
      }
      return copy;
    });
  };

  const handleSubmit = async () => {
    const entries = Object.entries(selectedRanks);
    if (entries.length === 0) return alert("Select at least one subject and assign ranks");
    // build array sorted by rank
    const preferences = entries.map(([subjectId, rank]) => ({ subjectId, preferenceRank: rank }));
    try {
      await axios.post("/teacher/preferences", { preferences, semester });
      alert("Preferences submitted successfully!");
      setSelectedRanks({});
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to submit preferences');
    }
  };

  return (
    <div className="flex">
      <Sidebar role="teacher" />
      <div className="flex-1">
        <Navbar role="teacher" />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Submit Your Subject Preferences</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {subjects.map((subject) => (
              <div key={subject._id} className="p-4 rounded border flex items-center justify-between">
                <div>
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-sm text-gray-500">{subject.code} — Semester {subject.semester}</div>
                </div>
                <div>
                  <select value={selectedRanks[subject._id] || ""} onChange={(e) => handleRankChange(subject._id, e.target.value)} className="p-2 border rounded">
                    <option value="">No rank</option>
                    {Array.from({ length: subjects.length }).map((_, i) => {
                      const val = i + 1;
                      const disabled = usedRanks.includes(val) && selectedRanks[subject._id] !== val;
                      return (
                        <option key={val} value={val} disabled={disabled}>{val}</option>
                      );
                    })}
                  </select>
                </div>
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
