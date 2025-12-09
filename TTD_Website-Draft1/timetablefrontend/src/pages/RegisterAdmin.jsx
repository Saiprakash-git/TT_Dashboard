import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";

const RegisterAdmin = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/auth/register", { name, email, password, adminKey });
      // res.data should include token + user info
      const user = { _id: res.data._id, name: res.data.name, email: res.data.email, role: res.data.role };
      login({ token: res.data.token, role: res.data.role, user });
      navigate("/admin");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">Register Admin</h2>

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          type="text"
          placeholder="Admin registration key (if required)"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Registering..." : "Register Admin"}
        </button>
      </form>
    </div>
  );
};

export default RegisterAdmin;
