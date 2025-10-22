// src/pages/admin/RegisterTeacher.jsx
import React, { useState } from "react";
import axios from "../../api/axiosInstance";

export default function RegisterTeacher() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/admin/register-teacher", {
        name, email, password, semester
      });
      alert("Teacher registered: " + res.data.name);
      setName(""); setEmail(""); setPassword(""); setSemester(1);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-card">
      <h3 className="text-lg font-semibold text-primary mb-4">Register Teacher</h3>
      <form onSubmit={handleRegister} className="space-y-3 max-w-md">
        <input className="w-full p-2 border rounded" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required/>
        <input className="w-full p-2 border rounded" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
        <input className="w-full p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
        <input className="w-full p-2 border rounded" type="number" min="1" placeholder="Semester" value={semester} onChange={e=>setSemester(Number(e.target.value))} required/>
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? "Registering..." : "Register Teacher"}
        </button>
      </form>
    </div>
  );
}
