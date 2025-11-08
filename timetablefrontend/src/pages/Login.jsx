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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50 to-white">
      <div className="w-full max-w-md px-6">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">T</div>
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-center text-slate-700">Welcome back</h2>
          <p className="text-center text-sm text-slate-400 mb-6">Sign in to manage or submit your timetable preferences</p>

          {error && <div className="mb-4 text-red-600">{error}</div>}

          <div className="mb-4">
            <label className="block text-sm text-slate-600 mb-2">Email</label>
            <input
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => checkEmail(email)}
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {!isFirstTime && (
            <>
              <div className="mb-4">
                <label className="block text-sm text-slate-600 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </>
          )}

          {isFirstTime && (
            <>
              <div className="mb-4 text-yellow-700">It looks like this is your first login. Please set a password.</div>
              <div className="mb-3">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="mb-6">
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <button onClick={handleSetPassword} disabled={loading} className="w-full bg-emerald-600 text-white p-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60">
                {loading ? "Setting..." : "Set Password & Login"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
