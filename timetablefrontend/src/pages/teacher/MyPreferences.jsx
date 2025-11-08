import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";

const MyPreferences = () => {
  const [semester, setSemester] = useState(1);
  const [preferences, setPreferences] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const fetchPreferences = async () => {
    try {
      const res = await axios.get(`/teacher/preferences?semester=${semester}`);
      if (res.data.exists) setPreferences(res.data.preferences || []);
      else setPreferences([]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllocations = async () => {
    try {
      const res = await axios.get(`/teacher/allocations?semester=${semester}`);
      setAllocations(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPreferences();
    fetchAllocations();
    // eslint-disable-next-line
  }, [semester]);

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">My Preferences & Allocations</h2>

      <div className="mb-4">
        <label className="mr-2">Semester:</label>
        <input type="number" value={semester} onChange={e => setSemester(Number(e.target.value))} className="border px-2 py-1" />
      </div>

      <section className="mb-6">
        <h3 className="font-semibold">My Submitted Preferences</h3>
        {preferences.length === 0 ? (
          <p>No preferences submitted for this semester.</p>
        ) : (
          <ol>
            {preferences.map((p, idx) => (
              <li key={idx}>{`Rank ${p.preferenceRank}: ${p.subjectName || p.subjectId}`}</li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="font-semibold">Allocations</h3>
        {allocations.length === 0 ? (
          <p>No allocations yet.</p>
        ) : (
          <ul>
            {allocations.map(a => (
              <li key={a._id}>{`${a.subjectName || (a.subject && a.subject.name)} — Assigned: ${a.teacherName || '—'}`}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MyPreferences;
