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
    <div className="p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">My Preferences & Allocations</h2>
          <div>
            <label className="text-sm text-slate-600 mr-2">Semester</label>
            <input type="number" value={semester} onChange={e => setSemester(Number(e.target.value))} className="border px-2 py-1 rounded" />
          </div>
        </div>

        <section className="mb-6">
          <h3 className="font-semibold mb-2">My Submitted Preferences</h3>
          {preferences.length === 0 ? (
            <p className="text-sm text-gray-600">No preferences submitted for this semester.</p>
          ) : (
            <ol className="list-decimal pl-5">
              {preferences.map((p, idx) => (
                <li key={idx} className="py-1">{`Rank ${p.preferenceRank}: ${p.subjectName || p.subjectId}`}</li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-2">Allocations</h3>
          {allocations.length === 0 ? (
            <p className="text-sm text-gray-600">No allocations yet.</p>
          ) : (
            <ul className="space-y-2">
              {allocations.map(a => (
                <li key={a._id} className="p-2 border rounded">{`${a.subjectName || (a.subject && a.subject.name)} — Assigned: ${a.teacherName || '—'}`}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default MyPreferences;
