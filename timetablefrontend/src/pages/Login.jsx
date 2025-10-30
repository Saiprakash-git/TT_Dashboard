import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", { email, password });
      // res.data: { _id, name, email, role, semester, token }
      const user = { _id: res.data._id, name: res.data.name, email: res.data.email, role: res.data.role, semester: res.data.semester };
      login({ token: res.data.token, role: res.data.role, user });

      // Navigate based on role
      if (res.data.role === "admin") navigate("/admin");
      else navigate("/teacher");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // check whether email exists and if password is set
  const checkEmail = async (emailToCheck) => {
    if (!emailToCheck) return;
    try {
      const res = await axios.post("/auth/check-email", { email: emailToCheck });
      if (res.data.exists && res.data.passwordSet === false) {
        setIsFirstTime(true);
      } else {
        setIsFirstTime(false);
      }
    } catch (err) {
      console.error("checkEmail error", err);
      setIsFirstTime(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newPassword || newPassword.length < 6) return setError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    try {
      const res = await axios.post("/auth/set-password", { email, newPassword });
      const user = { _id: res.data._id, name: res.data.name, email: res.data.email, role: res.data.role, semester: res.data.semester };
      login({ token: res.data.token, role: res.data.role, user });
      if (res.data.role === "admin") navigate("/admin");
      else navigate("/teacher");
    } catch (err) {
      console.error("setPassword failed", err);
      setError(err.response?.data?.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => checkEmail(email)}
          required
          className="w-full mb-4 p-3 border rounded"
        />

        {!isFirstTime && (
          <>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mb-6 p-3 border rounded"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </>
        )}

        {isFirstTime && (
          <>
            <div className="mb-4 text-yellow-700">It looks like this is your first login. Please set a password.</div>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mb-3 p-3 border rounded"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mb-6 p-3 border rounded"
            />
            <button onClick={handleSetPassword} disabled={loading} className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 transition disabled:opacity-60">
              {loading ? "Setting..." : "Set Password & Login"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default Login;
