import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/authMiddleware.js";

// @desc    Login user/admin
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        semester: user.semester || null,
        token: generateToken(user._id, user.role)
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/check-email
export const checkEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  try {
    const user = await User.findOne({ email }).select("passwordSet role name email semester");
    if (!user) return res.json({ exists: false });
    return res.json({ exists: true, passwordSet: !!user.passwordSet, role: user.role, name: user.name, semester: user.semester });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/set-password
export const setPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ message: "Email and newPassword are required" });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.passwordSet) return res.status(400).json({ message: "Password already set" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordSet = true;
    await user.save();

    // Return token and user info so frontend can log in
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, semester: user.semester, token: generateToken(user._id, user.role) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Register an admin user (requires ADMIN_REGISTRATION_KEY if set)
// @route   POST /api/auth/register
// @access  Public (protected by ADMIN_REGISTRATION_KEY env when set)
export const registerAdmin = async (req, res) => {
  const { name, email, password, adminKey } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide name, email and password" });
  }

  // If an ADMIN_REGISTRATION_KEY is set, require it
  if (process.env.ADMIN_REGISTRATION_KEY) {
    if (!adminKey || adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(401).json({ message: "Invalid admin registration key" });
    }
  } else {
    console.warn("ADMIN_REGISTRATION_KEY not set; allowing open admin registration. Consider setting this in production.");
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password, role: "admin" });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/auth/profile  (protected)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('getProfile', err);
    return res.status(500).json({ message: 'server_error' });
  }
};

// PATCH /api/auth/profile  (protected)
export const updateProfile = async (req, res) => {
  try {
    const { name, email, semester } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof semester !== 'undefined') user.semester = semester;
    await user.save();
    const u = user.toObject(); delete u.password;
    return res.json(u);
  } catch (err) {
    console.error('updateProfile', err);
    return res.status(500).json({ message: 'server_error' });
  }
};

// PATCH /api/auth/change-password  (protected)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword and newPassword required' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await user.matchPassword(currentPassword);
    if (!ok) return res.status(401).json({ message: 'Current password incorrect' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordSet = true;
    await user.save();
    return res.json({ message: 'password_changed' });
  } catch (err) {
    console.error('changePassword', err);
    return res.status(500).json({ message: 'server_error' });
  }
};
