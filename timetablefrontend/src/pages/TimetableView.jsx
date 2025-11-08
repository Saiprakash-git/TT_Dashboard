import React, { useEffect, useState, useContext } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";



const TimetableView = () => {
  const { user, role: ctxRole } = useContext(AuthContext);
  const role = ctxRole || user?.role;
  const [timetable, setTimetable] = useState([]);
  const [semester, setSemester] = useState(user?.semester || "");
  const [loadingGen, setLoadingGen] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [subjectsForSemester, setSubjectsForSemester] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignDay, setAssignDay] = useState("Mon");
  const [assignPeriod, setAssignPeriod] = useState(1);
  const [assignSubject, setAssignSubject] = useState("");
  const [assignTeacher, setAssignTeacher] = useState(""); 

  // Fetch timetable from backend
  const fetchTimetable = async () => {
    try {
      const res = role === "admin"
        ? await axios.get("/timetable", { params: semester ? { semester } : {} })
        : await axios.get("/timetable/teacher"); // Teacher sees only their periods

      setTimetable(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await axios.get('/admin/semesters');
      setSemesters(res.data || []);
    } catch (err) { console.error(err); }
  }

  const fetchSubjectsAndTeachers = async (sem) => {
    try {
      const [sres, tres] = await Promise.all([
        axios.get('/admin/subjects', { params: sem ? { semester: sem } : {} }),
        axios.get('/admin/teachers')
      ]);
      setSubjectsForSemester(sres.data || []);
      setTeachers(tres.data || []);
      if ((sres.data || []).length && !assignSubject) setAssignSubject(sres.data[0]._id);
      if ((tres.data || []).length && !assignTeacher) setAssignTeacher(tres.data[0]._id);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    fetchSemesters();
    fetchTimetable();
    fetchSubjectsAndTeachers(semester);
  }, [role, semester]);

  const handleGenerate = async () => {
    if (!semester) return alert("Please enter semester to generate for");
    setLoadingGen(true);
    try {
      const res = await axios.post(`/timetable/admin/generate`, { semester });
      // server returns { rows }
      setTimetable(res.data.rows || []);
      alert("Timetable generated");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to generate timetable");
    } finally {
      setLoadingGen(false);
    }
  };

  const handleAssign = async () => {
    if (!semester) return alert('Select semester first');
    try {
      await axios.post('/timetable/admin/assign', { semester, day: assignDay, period: assignPeriod, subjectId: assignSubject, teacherId: assignTeacher });
      alert('Assignment saved');
      fetchTimetable();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to save assignment');
    }
  }

  return (
    <div className="flex">
      <Sidebar role={role} />
      <div className="flex-1">
        <Navbar role={role} />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Timetable</h1>
          {role === "admin" && (
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <select value={semester} onChange={(e) => { setSemester(e.target.value); fetchSubjectsAndTeachers(e.target.value); }} className="p-2 border rounded w-40">
                  <option value="">Select semester</option>
                  {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleGenerate} disabled={loadingGen} className="bg-green-600 text-white px-4 py-2 rounded">
                  {loadingGen ? "Generating..." : "Generate Timetable"}
                </button>
              </div>

              <div className="p-4 border rounded bg-gray-50">
                <h3 className="font-semibold mb-2">Insert Assignment</h3>
                <div className="flex gap-3 items-center flex-wrap">
                  <select value={assignDay} onChange={(e) => setAssignDay(e.target.value)} className="p-2 border rounded">
                    <option>Mon</option>
                    <option>Tue</option>
                    <option>Wed</option>
                    <option>Thu</option>
                    <option>Fri</option>
                  </select>
                  <select value={assignPeriod} onChange={(e) => setAssignPeriod(Number(e.target.value))} className="p-2 border rounded">
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                  <select value={assignSubject} onChange={(e) => setAssignSubject(e.target.value)} className="p-2 border rounded">
                    {subjectsForSemester.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                  <select value={assignTeacher} onChange={(e) => setAssignTeacher(e.target.value)} className="p-2 border rounded">
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                  <button onClick={handleAssign} className="bg-indigo-600 text-white px-4 py-2 rounded">Save Assignment</button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 border">Day</th>
                  <th className="p-4 border">Period 1</th>
                  <th className="p-4 border">Period 2</th>
                  <th className="p-4 border">Period 3</th>
                  <th className="p-4 border">Period 4</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(timetable) && timetable.length > 0 ? (
                  // Distinguish between admin grid rows (have .day and .slots) vs teacher assignment list (have subjectName)
                  timetable[0].day && Array.isArray(timetable[0].slots) ? (
                    timetable.map((row) => (
                      <tr key={row.day} className="hover:bg-gray-100">
                        <td className="p-4 border font-bold">{row.day}</td>
                        {row.slots.map((slot, i) => (
                          <td key={i} className="p-4 border text-center">
                            <div className="text-sm font-medium">{slot.subjectName}</div>
                            <div className="text-xs text-gray-600">{slot.teacherName}</div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    // Teacher assignment list
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">
                        <div>
                          <h3 className="text-lg font-semibold">Assigned Subjects</h3>
                          <ul className="mt-2">
                            {timetable.map((t, idx) => (
                              <li key={idx} className="mb-1">{t.subjectName} {t.semester ? `(Semester ${t.semester})` : ''}</li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      {role === "teacher" ? (
                        <div>
                          <h3 className="text-lg font-semibold">Assigned Subjects</h3>
                          <div className="text-sm text-gray-500 mt-2">No assignments yet</div>
                        </div>
                      ) : (
                        "No timetable available. Admin can generate one."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableView;
