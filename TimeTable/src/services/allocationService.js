import Subject from "../models/Subject.js";
import Preference from "../models/Preference.js";
import User from "../models/User.js";
import Allocation from "../models/Allocation.js";

// Greedy, capacity-aware allocator
// Returns created allocations
export async function runGreedyAllocation(semester, createdBy) {
  if (!semester) throw new Error("semester_required");

  // load subjects and preferences
  const subjects = await Subject.find({ semester }).lean();
  const preferences = await Preference.find({ semester }).lean();

  // map subjectId -> list of { teacherId, rank, submittedAt }
  const candidatesBySubject = {};
  let maxRank = 0;
  for (const pref of preferences) {
    for (const choice of pref.preferences || []) {
      const subId = String(choice.subjectId);
      if (!candidatesBySubject[subId]) candidatesBySubject[subId] = [];
      const rank = choice.preferenceRank || 999;
      if (rank > maxRank) maxRank = rank;
      candidatesBySubject[subId].push({
        teacherId: String(pref.teacherId),
        rank,
        submittedAt: pref.submittedAt || pref.createdAt,
      });
    }
  }

  // prepare teacher capacities
  const teachers = await User.find({ role: "teacher" }).lean();
  const capacityMap = {};
  for (const t of teachers) {
    capacityMap[String(t._id)] = typeof t.capacity === 'number' ? t.capacity : 1;
  }

  // clear old allocations for semester
  await Allocation.deleteMany({ semester });

  const allocations = [];
  const assignedSubjects = new Set();

  // iterate ranks from 1..maxRank, try to satisfy as many subjects as possible
  for (let rank = 1; rank <= maxRank; rank++) {
    // for each subject not yet assigned
    for (const subject of subjects) {
      const subId = String(subject._id);
      if (assignedSubjects.has(subId)) continue;
      const candidates = (candidatesBySubject[subId] || []).filter(c => c.rank === rank);
      if (!candidates.length) continue;

      // sort by submission time (earlier wins), to break ties
      candidates.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

      // pick first candidate who still has capacity
      let chosen = null;
      for (const c of candidates) {
        const capLeft = capacityMap[c.teacherId] || 0;
        if (capLeft > 0) {
          chosen = c;
          break;
        }
      }

      if (chosen) {
        capacityMap[chosen.teacherId] = (capacityMap[chosen.teacherId] || 0) - 1;
        assignedSubjects.add(subId);

        const teacherDoc = teachers.find(t => String(t._id) === String(chosen.teacherId));
        allocations.push({
          semester,
          subject: subject._id,
          subjectName: subject.name || subject.title || "",
          teacher: chosen.teacherId,
          teacherName: teacherDoc ? (teacherDoc.name || "") : null,
          createdBy,
        });
      }
    }
  }

  // optional: try to assign remaining subjects to any teacher who listed them at any rank and still has capacity
  for (const subject of subjects) {
    const subId = String(subject._id);
    if (assignedSubjects.has(subId)) continue;
    const candidates = candidatesBySubject[subId] || [];
    // sort by rank then submittedAt
    candidates.sort((a, b) => (a.rank - b.rank) || (new Date(a.submittedAt) - new Date(b.submittedAt)));
    let chosen = null;
    for (const c of candidates) {
      const capLeft = capacityMap[c.teacherId] || 0;
      if (capLeft > 0) {
        chosen = c;
        break;
      }
    }
    if (chosen) {
      capacityMap[chosen.teacherId] = (capacityMap[chosen.teacherId] || 0) - 1;
      assignedSubjects.add(subId);
      const teacherDoc = teachers.find(t => String(t._id) === String(chosen.teacherId));
      allocations.push({
        semester,
        subject: subject._id,
        subjectName: subject.name || subject.title || "",
        teacher: chosen.teacherId,
        teacherName: teacherDoc ? (teacherDoc.name || "") : null,
        createdBy,
      });
    }
  }

  // persist allocations
  const created = allocations.length ? await Allocation.insertMany(allocations) : [];
  return created;
}
