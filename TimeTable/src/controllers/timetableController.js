import Timetable from "../models/Timetable.js";
import Subject from "../models/Subject.js";
import Preference from "../models/Preference.js";
import User from "../models/User.js";

// Helper: format assignments into grid rows (Mon-Fri, 4 periods)
const buildGrid = (assignments) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const periodsPerDay = 4;
  const rows = days.map((d) => ({ day: d, slots: Array(periodsPerDay).fill({ subjectName: "", teacherName: "" }) }));

  let idx = 0;
  assignments.forEach((a) => {
    const dayIndex = Math.floor(idx / periodsPerDay) % days.length;
    const periodIndex = idx % periodsPerDay;
    rows[dayIndex].slots[periodIndex] = {
      subjectName: a.subjectName || "",
      teacherName: a.teacherName || "",
    };
    idx += 1;
  });

  return rows;
};

// POST /api/admin/timetable/generate?semester=1
export const generateTimetable = async (req, res) => {
  const semester = parseInt(req.query.semester || req.body.semester);
  if (!semester) return res.status(400).json({ message: "semester required" });

  try {
    // Get subjects for semester
    const subjects = await Subject.find({ semester });

    // For each subject, pick top preferred teacher from Preference collection
    const assignments = [];

    for (const subject of subjects) {
      // find all preference docs for semester where subject exists
      const prefs = await Preference.find({ semester }).populate("teacherId", "name email").lean();

      // build list of teacher ranks for this subject
      const subjectPrefs = [];
      prefs.forEach((p) => {
        const pr = p.preferences.find((prf) => prf.subjectId && prf.subjectId.toString() === subject._id.toString());
        if (pr) {
          subjectPrefs.push({ teacherId: p.teacherId?._id, teacherName: p.teacherId?.name, rank: pr.preferenceRank });
        }
      });

      // sort by rank asc
      subjectPrefs.sort((a, b) => a.rank - b.rank);

      // pick top teacher if any, else leave unassigned
      const chosen = subjectPrefs.length > 0 ? subjectPrefs[0] : null;

      assignments.push({
        subject: subject._id,
        subjectName: subject.name,
        teacher: chosen ? chosen.teacherId : null,
        teacherName: chosen ? chosen.teacherName : "Unassigned",
      });
    }

    // Save into Timetable doc with simple day/period placement
    const timetableAssignments = assignments.map((a, i) => ({ subject: a.subject, teacher: a.teacher, day: null, period: null }));

    const tt = await Timetable.create({ semester, assignments: timetableAssignments });

    // Populate subject and teacher names for response
    const populated = assignments;
    const rows = buildGrid(populated);

    res.json({ timetableId: tt._id, semester, rows, generatedAt: tt.generatedAt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/timetable?semester=1  (admin)
export const getTimetableForAdmin = async (req, res) => {
  const semester = parseInt(req.query.semester);
  try {
    const tt = await Timetable.findOne({ semester }).sort({ generatedAt: -1 }).lean();
    if (!tt) return res.json({ rows: [] });

    // populate subject and teacher names
    const populated = await Promise.all(tt.assignments.map(async (a) => {
      const subject = a.subject ? await Subject.findById(a.subject).lean() : null;
      const teacher = a.teacher ? await User.findById(a.teacher).lean() : null;
      return { subjectName: subject?.name || "", teacherName: teacher?.name || "" };
    }));

    const rows = buildGrid(populated);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/timetable/teacher  (teacher)
export const getTimetableForTeacher = async (req, res) => {
  try {
    const teacherId = req.user._id;
    // find latest timetable for teacher across semesters
    const tts = await Timetable.find({}).sort({ generatedAt: -1 }).lean();
    if (!tts || tts.length === 0) return res.json([]);

    // take most recent timetable and filter assignments for teacher
    const tt = tts[0];

    const myAssignments = await Promise.all(tt.assignments.filter(a => a.teacher && a.teacher.toString() === teacherId.toString()).map(async (a) => {
      const subject = a.subject ? await Subject.findById(a.subject).lean() : null;
      return { subjectName: subject?.name || "", semester: tt.semester };
    }));

    res.json(myAssignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/admin/timetable/assign
export const assignTimetable = async (req, res) => {
  // body: { semester, day, period, subjectId, teacherId }
  const { semester, day, period, subjectId, teacherId } = req.body;
  if (!semester || !day || period === undefined) return res.status(400).json({ message: "semester, day and period required" });
  try {
    // find or create timetable for semester
    let tt = await Timetable.findOne({ semester }).sort({ generatedAt: -1 });
    if (!tt) {
      tt = await Timetable.create({ semester, assignments: [] });
    }

    // find if assignment slot exists for given day+period -> we store day/period in assignment schema
    // for simplicity, map day+period to an index position; we'll store explicit day/period
    const existingIdx = tt.assignments.findIndex(a => a.day === day && a.period === period);
    if (existingIdx !== -1) {
      tt.assignments[existingIdx].subject = subjectId || null;
      tt.assignments[existingIdx].teacher = teacherId || null;
    } else {
      tt.assignments.push({ subject: subjectId || null, teacher: teacherId || null, day, period });
    }

    await tt.save();
    return res.json({ message: "assignment saved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
