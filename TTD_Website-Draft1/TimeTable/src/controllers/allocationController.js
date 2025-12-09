import Allocation from "../models/Allocation.js";
import User from "../models/User.js";
import { runGreedyAllocation } from "../services/allocationService.js";

// Run allocation (admin endpoint)
export const runAllocation = async (req, res) => {
  try {
    const { semester } = req.body;
    if (!semester) return res.status(400).json({ message: "semester is required" });
    const created = await runGreedyAllocation(Number(semester), req.user ? req.user._id : undefined);
    return res.json({ message: "allocation_completed", allocations: created });
  } catch (err) {
    console.error("runAllocation", err);
    return res.status(500).json({ message: "server_error", error: err.message });
  }
};

export const listAllocations = async (req, res) => {
  try {
    const { semester } = req.query;
    const q = {};
    if (semester) q.semester = Number(semester);
    const allocs = await Allocation.find(q).populate('subject').populate('teacher').lean();
    return res.json(allocs);
  } catch (err) {
    console.error("listAllocations", err);
    return res.status(500).json({ message: "server_error", error: err.message });
  }
};

export const updateAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;
    const alloc = await Allocation.findById(id);
    if (!alloc) return res.status(404).json({ message: "allocation_not_found" });

    let update = {};
    if (teacherId) {
      const t = await User.findById(teacherId).lean();
      update.teacher = teacherId;
      update.teacherName = t ? (t.name || "") : null;
      update.assignedAt = new Date();
      update.createdBy = req.user ? req.user._id : alloc.createdBy;
    } else {
      update.teacher = null;
      update.teacherName = null;
      update.assignedAt = null;
    }

    const updated = await Allocation.findByIdAndUpdate(id, { $set: update }, { new: true }).populate('subject').populate('teacher').lean();
    return res.json(updated);
  } catch (err) {
    console.error("updateAllocation", err);
    return res.status(500).json({ message: "server_error", error: err.message });
  }
};

export const getTeacherAllocations = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { semester } = req.query;
    const q = { teacher: teacherId };
    if (semester) q.semester = Number(semester);
    const allocs = await Allocation.find(q).populate('subject').lean();
    return res.json(allocs);
  } catch (err) {
    console.error("getTeacherAllocations", err);
    return res.status(500).json({ message: "server_error", error: err.message });
  }
};

// Export allocations as CSV
export const exportAllocations = async (req, res) => {
  try {
    const { semester } = req.query;
    const q = {};
    if (semester) q.semester = Number(semester);
    const allocs = await Allocation.find(q).populate('subject').populate('teacher').lean();

    // CSV header
    const rows = ["semester,subjectId,subjectName,teacherId,teacherName,assignedAt"];
    for (const a of allocs) {
      rows.push(`${a.semester},${a.subject?._id || ''},"${(a.subjectName || (a.subject && a.subject.name) || '').replace(/"/g, '""')}",${a.teacher || ''},"${(a.teacherName || (a.teacher && a.teacher.name) || '').replace(/"/g, '""')}",${a.assignedAt || ''}`);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="allocations_semester_${semester || 'all'}.csv"`);
    return res.send(rows.join("\n"));
  } catch (err) {
    console.error('exportAllocations', err);
    return res.status(500).json({ message: 'server_error', error: err.message });
  }
};
