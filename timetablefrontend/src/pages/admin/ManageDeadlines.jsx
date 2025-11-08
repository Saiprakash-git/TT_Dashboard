import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "../../api/axiosInstance";

const ManageDeadlines = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [semester, setSemester] = useState(1);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchDeadlines = async () => {
    try {
      const res = await axios.get("/admin/deadlines");
      setDeadlines(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchDeadlines(); }, []);

  const handleUpsert = async () => {
    try {
      await axios.post('/admin/deadlines', { semester: Number(semester), opensAt: opensAt || null, closesAt: closesAt || null, isActive });
      fetchDeadlines();
      alert('Saved');
    } catch (err) { console.error(err); alert(err?.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (sem) => {
    if (!window.confirm('Delete deadline for semester '+sem+'?')) return;
    try { await axios.delete(`/admin/deadlines/${sem}`); fetchDeadlines(); } catch (err) { console.error(err); alert('Failed to delete'); }
  };

  return (
    <div className="flex">
      <Sidebar role="admin" />
      <div className="flex-1">
        <Navbar role="admin" />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Manage Deadlines</h1>

          <div className="mb-6 p-4 border rounded bg-gray-50">
            <div className="flex gap-3 items-center mb-3">
              <input type="number" value={semester} onChange={(e) => setSemester(e.target.value)} className="p-2 border rounded w-32" />
              <input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} className="p-2 border rounded" />
              <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="p-2 border rounded" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
              <button onClick={handleUpsert} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </div>
            <div className="text-sm text-gray-600">Note: times are local browser time and will be stored as ISO.</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead className="bg-blue-600 text-white"><tr><th className="p-3 border">Semester</th><th className="p-3 border">Opens At</th><th className="p-3 border">Closes At</th><th className="p-3 border">Active</th><th className="p-3 border">Action</th></tr></thead>
              <tbody>
                {deadlines.map(d => (
                  <tr key={d.semester} className="hover:bg-gray-100"><td className="p-3 border">{d.semester}</td><td className="p-3 border">{d.opensAt ? new Date(d.opensAt).toLocaleString() : '-'}</td><td className="p-3 border">{d.closesAt ? new Date(d.closesAt).toLocaleString() : '-'}</td><td className="p-3 border">{d.isActive ? 'Yes' : 'No'}</td><td className="p-3 border"><button onClick={() => handleDelete(d.semester)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageDeadlines;
