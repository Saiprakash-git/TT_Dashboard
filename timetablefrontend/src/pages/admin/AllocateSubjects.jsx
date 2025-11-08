import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";

const AllocateSubjects = () => {
  const [semester, setSemester] = useState(1);
  const [allocations, setAllocations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

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
      await axios.patch(`/admin/allocations/${id}`, { teacherId });
      await fetchAllocations();
    } catch (err) {
      console.error(err);
      alert("Update failed");
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
                <select defaultValue={a.teacher ? a.teacher._id : ""} onChange={e => updateAllocation(a._id, e.target.value)}>
                  <option value="">Unassign</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{`${t.firstName || ""} ${t.lastName || ""}`}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllocateSubjects;
