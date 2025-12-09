import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";

const AllocateSubjects = () => {
  const [semester, setSemester] = useState(1);
  const [allocations, setAllocations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjectPrefs, setSubjectPrefs] = useState({}); // { subjectId: [ { teacherId, teacherName, rank } ] }
  const [loading, setLoading] = useState(false);
  const [rowUpdating, setRowUpdating] = useState({});

  const fetchAllocations = async () => {
    try {
      const res = await axios.get(`/admin/allocations?semester=${semester}`);
      setAllocations(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`/admin/teachers`);
      setTeachers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllocations();
    fetchTeachers();
    // eslint-disable-next-line
  }, [semester]);

  useEffect(() => {
    // after allocations load, fetch per-subject preferences for subjects that are unassigned
    const fetchPrefsForAlloc = async () => {
      try {
        const toFetch = allocations
          .map(a => ({ subjectId: a.subject || (a.subject && a.subject._id) || a.subjectId, assigned: !!(a.teacher || a.teacherName) }))
          .filter(s => s.subjectId)
          .map(s => ({ subjectId: String(s.subjectId), assigned: s.assigned }));

        const map = {};
        await Promise.all(toFetch.map(async (s) => {
          try {
            const res = await axios.get(`/admin/subject/${s.subjectId}/preferences`, { params: { semester } });
            map[s.subjectId] = res.data || [];
          } catch (err) {
            // ignore per-subject fetch errors, leave as empty list
            map[s.subjectId] = [];
          }
        }));
        setSubjectPrefs(map);
      } catch (err) {
        console.error('failed to fetch subject preferences', err);
      }
    };

    if (allocations && allocations.length) fetchPrefsForAlloc();
  }, [allocations, semester]);

  const runAllocation = async () => {
    setLoading(true);
    try {
      await axios.post(`/admin/allocations/run`, { semester });
      await fetchAllocations();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Allocation failed");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await axios.get(`/admin/allocations/export?semester=${semester}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `allocations_semester_${semester}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  };

  const updateAllocation = async (id, teacherId) => {
    try {
      setRowUpdating(prev => ({ ...prev, [id]: true }));
      const body = { teacherId: teacherId || null };
      await axios.patch(`/admin/allocations/${id}`, body);
      await fetchAllocations();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Update failed");
    } finally {
      setRowUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Allocate Subjects (Semester)</h2>
      <div className="mb-4">
        <label className="mr-2">Semester:</label>
        <input type="number" value={semester} onChange={e => setSemester(Number(e.target.value))} className="border px-2 py-1" />
        <button onClick={runAllocation} disabled={loading} className="ml-3 px-3 py-1 bg-blue-600 text-white rounded">
          {loading ? "Running..." : "Run Allocation"}
        </button>
        <button onClick={exportCSV} className="ml-3 px-3 py-1 bg-green-600 text-white rounded">Export CSV</button>
      </div>

      <table className="min-w-full table-auto border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Subject</th>
            <th className="border px-2 py-1">Assigned Teacher</th>
            <th className="border px-2 py-1">Change</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map(a => (
            <tr key={a._id}>
              <td className="border px-2 py-1">{a.subjectName || (a.subject && a.subject.name)}</td>
              <td className="border px-2 py-1">{a.teacherName || "—"}</td>
              <td className="border px-2 py-1">
                {(() => {
                  const subjectId = a.subject ? (a.subject._id || a.subject) : (a.subjectId || a._id);
                  const prefs = subjectPrefs[String(subjectId)] || [];

                  // If subject has no assigned teacher, show dropdown ordered by preference (with rank)
                  const assignedTeacherId = a.teacher ? (a.teacher._id || a.teacher) : (a.teacherId || null);

                  // Build option list: prefer subject prefs; fallback to full teacher list
                  const options = prefs.length ? prefs.map(p => ({ id: p.teacherId, label: `${p.teacherName} (Rank ${p.rank})` })) : teachers.map(t => ({ id: t._id, label: t.name || `${t.firstName || ''} ${t.lastName || ''}` }));

                  return (
                    <div className="flex items-center gap-2">
                      <select value={assignedTeacherId || ""} onChange={e => updateAllocation(a._id, e.target.value)} disabled={!!rowUpdating[a._id]}>
                        <option value="">Unassign</option>
                        {options.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                      {rowUpdating[a._id] && <div className="text-sm text-gray-500">Updating...</div>}
                    </div>
                  );
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllocateSubjects;
