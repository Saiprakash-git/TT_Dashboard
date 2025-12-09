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
  const [deadline, setDeadline] = useState(null);
  const [locked, setLocked] = useState(false);

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
    if (semester) {
      // clear previous selection when switching semester to avoid rank carry-over
      setSelectedRanks({});
      setSubmitted(false);
      fetchSubjects();
      fetchDeadline();
      fetchExistingPreferences();
      fetchMyAllocations();
    }
  }, [semester]);

  const [submitted, setSubmitted] = useState(false);
  const [existingPrefsMap, setExistingPrefsMap] = useState({}); // { subjectId: rank }
  const [myAllocation, setMyAllocation] = useState(null);

  const fetchExistingPreferences = async () => {
    try {
      const res = await axios.get('/teacher/preferences', { params: { semester } });
      if (res.data && res.data.exists) {
        const prefs = res.data.preferences || [];
        const map = {};
        prefs.forEach(p => { if (p.subjectId) map[p.subjectId.toString()] = p.preferenceRank; });
        // store existing preferences separately; do not block submitting additional ones
        setExistingPrefsMap(map);
        // keep selectedRanks limited to any non-existing ones (clear previously selected to avoid confusion)
        setSelectedRanks({});
        setSubmitted(true);
      } else {
        // no existing preferences for this semester -> clear any prior selection
        setSelectedRanks({});
        setExistingPrefsMap({});
        setSubmitted(false);
      }
    } catch (err) {
      console.error('failed to fetch existing preferences', err);
    }
  }

  const fetchMyAllocations = async () => {
    try {
      const res = await axios.get('/teacher/allocations', { params: { semester } });
      if (res.data && Array.isArray(res.data) && res.data.length) {
        setMyAllocation(res.data[0]);
      } else {
        setMyAllocation(null);
      }
    } catch (err) {
      console.error('failed to fetch allocations', err);
    }
  }

  const fetchDeadline = async () => {
    try {
      const res = await axios.get('/teacher/deadline', { params: { semester } });
      if (res.data && res.data.exists) {
        setDeadline(res.data);
        const now = new Date();
        const opens = res.data.opensAt ? new Date(res.data.opensAt) : null;
        const closes = res.data.closesAt ? new Date(res.data.closesAt) : null;
        let isLocked = false;
        if (!res.data.isActive) isLocked = true;
        if (opens && now < opens) isLocked = true;
        if (closes && now > closes) isLocked = true;
        setLocked(isLocked);
      } else {
        setDeadline(null);
        setLocked(false);
      }
    } catch (err) {
      console.error('failed to fetch deadline', err);
      setDeadline(null);
      setLocked(false);
    }
  }

  const usedRanks = Object.values(selectedRanks);
  // include ranks already used in existing submitted prefs so new picks don't clash
  const existingRanksUsed = Object.values(existingPrefsMap || {});
  const allUsedRanks = [...new Set([...usedRanks, ...existingRanksUsed])];

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
    // filter selectedRanks to only include subjects that are not already submitted
    const entries = Object.entries(selectedRanks).filter(([subjectId]) => !existingPrefsMap[subjectId]);
    if (entries.length === 0) return alert("Select at least one NEW subject and assign ranks");
    // build array for submission
    const preferences = entries.map(([subjectId, rank]) => ({ subjectId, preferenceRank: rank }));
    try {
      const res = await axios.post("/teacher/preferences", { preferences, semester });
      alert(res?.data?.message || "Preferences submitted successfully!");
      // merge newly submitted prefs into existingPrefsMap so UI shows them as submitted
      const newMap = { ...existingPrefsMap };
      entries.forEach(([subjectId, rank]) => { newMap[subjectId] = rank; });
      setExistingPrefsMap(newMap);
      // remove newly submitted entries from selectedRanks
      setSelectedRanks(prev => {
        const copy = { ...prev };
        entries.forEach(([subjectId]) => { delete copy[subjectId]; });
        return copy;
      });
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
        <div className="p-6 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-slate-800">Submit Your Subject Preferences</h1>
          <p className="text-sm text-slate-500 mb-4">Select and rank subjects you prefer to teach for the chosen semester.</p>
          <div className="mb-4">
            <label className="block mb-2">Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="p-2 border rounded">
              <option value="">Select semester</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {deadline && (
            <div className={`p-3 mb-4 rounded ${locked ? 'bg-red-50 text-red-800 border' : 'bg-green-50 text-green-800 border'}`}>
              <div>Deadline for semester {semester}: {deadline.opensAt ? new Date(deadline.opensAt).toLocaleString() : '—'} → {deadline.closesAt ? new Date(deadline.closesAt).toLocaleString() : '—'}</div>
              <div>Status: {locked ? 'Closed / Locked' : 'Open'}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {subjects.map((subject) => (
              <div key={subject._id} className="p-4 rounded border bg-white shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-sm text-gray-500">{subject.code} — Semester {subject.semester}</div>
                </div>
                <div>
                  {existingPrefsMap[subject._id] ? (
                    <div className="text-sm text-gray-700">Submitted — Rank: {existingPrefsMap[subject._id]}</div>
                  ) : (
                    <select value={selectedRanks[subject._id] || ""} onChange={(e) => handleRankChange(subject._id, e.target.value)} className="p-2 border rounded" disabled={locked}>
                      <option value="">No rank</option>
                      {Array.from({ length: subjects.length }).map((_, i) => {
                        const val = i + 1;
                        const disabled = allUsedRanks.includes(val) && selectedRanks[subject._id] !== val;
                        return (
                          <option key={val} value={val} disabled={disabled}>{val}</option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Show submit button only if there are unsubmitted subjects available */}
          {(() => {
            const unsubmittedSubjects = subjects.filter(s => !existingPrefsMap[s._id]);
            if (unsubmittedSubjects.length === 0) {
              return (
                <div className="p-4 bg-blue-50 rounded">
                  <div className="mb-2">You have submitted preferences for all subjects in this semester.</div>
                  {myAllocation ? (
                    <div className="font-medium">Allocated Subject: {myAllocation.subjectName || (myAllocation.subject && myAllocation.subject.name)} — Assigned by admin: {myAllocation.teacherName || '—'}</div>
                  ) : (
                    <div className="text-sm text-gray-600">Allocation not yet available. Check back later.</div>
                  )}
                </div>
              );
            }

            return (
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
                disabled={locked}
              >
                {locked ? 'Submission locked' : 'Submit Preferences for remaining subjects'}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default SubmitPreferences;
