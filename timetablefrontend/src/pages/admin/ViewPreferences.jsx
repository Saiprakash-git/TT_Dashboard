// src/pages/admin/ViewPreferences.jsx
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";

export default function ViewPreferences() {
  const [semester, setSemester] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrefs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/admin/preferences/${semester}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Could not fetch preferences");
    } finally { setLoading(false); }
  };

  useEffect(()=> { fetchPrefs(); }, []); // initial load

  return (
    <div className="bg-white p-6 rounded-lg shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-primary">Preferences (Top 2)</h3>
        <div className="ml-auto flex items-center gap-2">
          <input type="number" min="1" value={semester} onChange={e=>setSemester(Number(e.target.value))} className="p-1 border rounded w-20"/>
          <button className="bg-primary text-white px-3 py-1 rounded" onClick={fetchPrefs}>Load</button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-4">
          {data.length === 0 && <div className="text-sm text-gray-500">No subjects found for semester {semester}</div>}
          {data.map(sub => (
            <div key={sub.subjectId} className="p-4 border rounded">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{sub.subjectName} <span className="text-xs text-gray-500">({sub.subjectCode})</span></div>
                </div>
                <div className="text-sm text-gray-600">Top {sub.topTeachers.length}</div>
              </div>

              <div className="mt-2">
                {sub.topTeachers.length === 0 && <div className="text-sm text-gray-500">No preferences yet</div>}
                {sub.topTeachers.map(t => (
                  <div key={t.teacherId} className="text-sm p-2 rounded border mb-2">
                    <div className="font-medium">{t.teacherName}</div>
                    <div className="text-xs text-gray-600">Rank: {t.rank}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
