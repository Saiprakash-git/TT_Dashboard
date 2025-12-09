import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "../../api/axiosInstance";

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [semester, setSemester] = useState(1);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get("/admin/teachers");
      setTeachers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAdd = async () => {
    if (!name || !email) return alert("Fill all fields");
    try {
      const payload = { name, email };
      if (password) payload.password = password;
      if (semester) payload.semester = semester;
      const res = await axios.post("/admin/teachers", payload);
      setTeachers([...teachers, res.data]);
      setName("");
      setEmail("");
      setPassword("");
      setSemester(1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`/admin/teachers/${id}`);
      setTeachers(teachers.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete teacher");
    }
  };

  return (
    <div className="flex">
      <Sidebar role="admin" />
      <div className="flex-1">
        <Navbar role="admin" />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Manage Teachers</h1>

          {/* Add Teacher Form */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-3 border rounded flex-1"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 border rounded flex-1"
            />
            <input
              type="password"
              placeholder="Password (optional)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 border rounded flex-1"
            />
            <input
              type="number"
              min="1"
              placeholder="Semester"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="p-3 border rounded w-28"
            />
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
            >
              Add Teacher
            </button>
          </div>

          {/* Teachers Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 border">Name</th>
                  <th className="p-4 border">Email</th>
                  <th className="p-4 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-100">
                    <td className="p-4 border">{teacher.name}</td>
                    <td className="p-4 border">{teacher.email}</td>
                    <td className="p-4 border">
                      <button
                        onClick={() => handleDelete(teacher._id)}
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

export default ManageTeachers;
