import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [newSemester, setNewSemester] = useState("");

  const fetchSubjects = async () => {
    try {
      const res = await axios.get("/admin/subjects", { params: semester ? { semester } : {} });
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await axios.get("/admin/semesters");
      setSemesters(res.data || []);
      if (!semester && res.data && res.data.length) setSemester(res.data[0]);
    } catch (err) {
      console.error("failed to fetch semesters", err);
    }
  };

  useEffect(() => {
    fetchSemesters();
    fetchSubjects();
  }, []);

  const handleAdd = async () => {
    if (!name || !code || !semester) return alert("Enter name, code and semester");
    try {
      const res = await axios.post("/admin/subjects", { name, code, semester });
      setSubjects([...subjects, res.data]);
      setName(""); setCode("");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to add subject");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`/admin/subjects/${id}`);
      setSubjects(subjects.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSemester = async () => {
    if (!newSemester) return alert("Enter semester number");
    try {
      const num = Number(newSemester);
      await axios.post('/admin/semesters', { number: num });
      setNewSemester('');
      fetchSemesters();
      alert('Semester added');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to add semester');
    }
  }

  return (
    <div className="flex">
      <Sidebar role="admin" />
      <div className="flex-1">
        <Navbar role="admin" />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Manage Subjects</h1>

          {/* Add Subject Form */}
          <div className="flex gap-4 mb-6 flex-wrap items-center">
            <input
              type="text"
              placeholder="Subject Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-3 border rounded flex-1"
            />
            <input
              type="text"
              placeholder="Subject Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="p-3 border rounded w-48"
            />
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="p-2 border rounded w-40">
              <option value="">Select semester</option>
              {semesters.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
            >
              Add Subject
            </button>
          </div>

          <div className="flex gap-2 items-center mb-6">
            <input type="number" placeholder="New semester" value={newSemester} onChange={(e) => setNewSemester(e.target.value)} className="p-2 border rounded w-40" />
            <button onClick={handleAddSemester} className="bg-indigo-600 text-white px-4 py-2 rounded">Add Semester</button>
          </div>

          {/* Subjects Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 border">Subject Name</th>
                  <th className="p-4 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject._id} className="hover:bg-gray-100">
                    <td className="p-4 border">{subject.name}</td>
                    <td className="p-4 border">{subject.code}</td>
                    <td className="p-4 border">{subject.semester}</td>
                    <td className="p-4 border">
                      <button
                        onClick={() => handleDelete(subject._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </td>
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

export default ManageSubjects;
