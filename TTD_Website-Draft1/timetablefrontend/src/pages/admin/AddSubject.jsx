// src/pages/admin/AddSubject.jsx
import React, { useState } from "react";
import axios from "../../api/axiosInstance";

export default function AddSubject() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/admin/subjects", { name, code, semester });
      alert("Subject added: " + res.data.name);
      setName(""); setCode(""); setSemester(1);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Add failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-card max-w-md">
      <h3 className="text-lg font-semibold text-primary mb-4">Add Subject</h3>
      <form onSubmit={handleAdd} className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Subject name" value={name} onChange={e=>setName(e.target.value)} required/>
        <input className="w-full p-2 border rounded" placeholder="Subject code" value={code} onChange={e=>setCode(e.target.value)} required/>
        <input className="w-full p-2 border rounded" type="number" min="1" placeholder="Semester" value={semester} onChange={e=>setSemester(Number(e.target.value))} required/>
        <button className="bg-primary text-white px-4 py-2 rounded" disabled={loading}>{loading ? "Adding..." : "Add Subject"}</button>
      </form>
    </div>
  );
}
