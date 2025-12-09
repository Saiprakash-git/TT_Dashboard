import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [newSemester, setNewSemester] = useState("");
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [allocMap, setAllocMap] = useState({}); // subjectId -> allocation
  const [subjectBatchMap, setSubjectBatchMap] = useState({}); // subjectId -> batch
  const [rowLoading, setRowLoading] = useState({}); // subjectId -> bool

  const fetchSubjects = async () => {
    try {
      const res = await axios.get("/admin/subjects", { params: semester ? { semester } : {} });
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await axios.get("/admin/semesters");
      setSemesters(res.data || []);
      if (!semester && res.data && res.data.length) setSemester(res.data[0]);
    } catch (err) {
      console.error("failed to fetch semesters", err);
    }
  };

  useEffect(() => {
    // When semester changes, refresh subjects and only show batches matching semester in quick-add
    fetchSubjects();
    // rebuild subjectBatchMap by refetching batches
    fetchBatches();
    // eslint-disable-next-line
  }, [semester]);

  useEffect(() => {
    fetchSemesters();
    fetchSubjects();
    fetchBatches();
  }, []);

  useEffect(() => {
    // fetch allocations for current semester to map assigned teachers
    const fetchAllocations = async () => {
      try {
        if (!semester) return setAllocMap({});
        const res = await axios.get('/admin/allocations', { params: { semester } });
        const map = {};
        (res.data || []).forEach(a => {
          const subjId = a.subject?._id || a.subject;
          if (subjId) map[String(subjId)] = a;
        });
        setAllocMap(map);
      } catch (err) { console.error('failed to load allocations', err); }
    };
    fetchAllocations();
  }, [semester]);

  const fetchBatches = async () => {
    try {
      const res = await axios.get('/admin/batches');
      setBatches(res.data || []);
      if (res.data && res.data.length && !selectedBatch) setSelectedBatch(res.data[0]._id);
      // build subject->batch map
      const sb = {};
      (res.data || []).forEach(b => {
        const subs = b.subjects || [];
        subs.forEach(s => { const id = s._id || s; sb[String(id)] = b; });
      });
      setSubjectBatchMap(sb);
    } catch (err) { console.error('failed to load batches', err); }
  }

  const handleAdd = async () => {
    if (!name || !code || !semester) return alert("Enter name, code and semester");
    try {
      const res = await axios.post("/admin/subjects", { name, code, semester });
      setSubjects([...subjects, res.data]);
      setName(""); setCode("");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to add subject");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`/admin/subjects/${id}`);
      setSubjects(subjects.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSemester = async () => {
    if (!newSemester) return alert("Enter semester number");
    try {
      const num = Number(newSemester);
      await axios.post('/admin/semesters', { number: num });
      setNewSemester('');
      fetchSemesters();
      alert('Semester added');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to add semester');
    }
  }

  return (
    <div className="flex">
      <Sidebar role="admin" />
      <div className="flex-1">
        <Navbar role="admin" />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Manage Subjects</h1>

          {/* Add Subject Form */}
          <div className="flex gap-4 mb-6 flex-wrap items-center">
            <input
              type="text"
              placeholder="Subject Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-3 border rounded flex-1"
            />
            <input
              type="text"
              placeholder="Subject Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="p-3 border rounded w-48"
            />
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="p-2 border rounded w-40">
              <option value="">Select semester</option>
              {semesters.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
            >
              Add Subject
            </button>
            <div className="ml-4">
              <label className="block text-sm text-slate-600">Batch (for quick add)</label>
              <select value={selectedBatch} onChange={e=>setSelectedBatch(e.target.value)} className="p-2 border rounded w-56">
                <option value="">Select batch</option>
                {batches.filter(b => b.currentSemester === Number(semester)).map(b => <option key={b._id} value={b._id}>{b.name} ({b.branch||''} {b.section||''})</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-center mb-6">
            <input type="number" placeholder="New semester" value={newSemester} onChange={(e) => setNewSemester(e.target.value)} className="p-2 border rounded w-40" />
            <button onClick={handleAddSemester} className="bg-indigo-600 text-white px-4 py-2 rounded">Add Semester</button>
          </div>

          {/* Subjects Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 border">Subject Name</th>
                  <th className="p-4 border">Code</th>
                  <th className="p-4 border">Semester</th>
                  <th className="p-4 border">Assigned To</th>
                  <th className="p-4 border">Batch</th>
                  <th className="p-4 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject._id} className="hover:bg-gray-100">
                    <td className="p-4 border">{subject.name}</td>
                    <td className="p-4 border">{subject.code}</td>
                    <td className="p-4 border">{subject.semester}</td>
                    <td className="p-4 border">{allocMap[subject._id] ? (allocMap[subject._id].teacherName || '—') : '—'}</td>
                    <td className="p-4 border">{subjectBatchMap[subject._id] ? subjectBatchMap[subject._id].name : (
                      <span className="text-sm text-gray-500">Not assigned</span>
                    )}</td>
                    <td className="p-4 border">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(subject._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                        {subjectBatchMap[subject._id] ? null : (
                          <div className="flex items-center gap-2">
                            <select
                              value={subjectBatchMap[subject._id]?._id || ''}
                              onChange={async (e) => {
                                const batchId = e.target.value;
                                if (!batchId) return;
                                // validate batch semester
                                const batch = batches.find(b => b._id === batchId);
                                if (!batch || batch.currentSemester !== subject.semester) return alert('Selected batch does not match subject semester');
                                // set loading for this row
                                setRowLoading(prev => ({ ...prev, [subject._id]: true }));
                                try {
                                  await axios.post(`/admin/batches/${batchId}/subjects`, { subjectId: subject._id });
                                  // refresh maps
                                  await fetchSubjects();
                                  await fetchBatches();
                                  alert('Added to batch');
                                } catch (err) {
                                  console.error(err);
                                  alert(err?.response?.data?.message || 'Failed to add to batch');
                                } finally {
                                  setRowLoading(prev => ({ ...prev, [subject._id]: false }));
                                }
                              }}
                              className="p-2 border rounded"
                              disabled={!!rowLoading[subject._id]}
                            >
                              <option value="">Add to batch...</option>
                              {batches.filter(b => b.currentSemester === Number(subject.semester)).map(b => (
                                <option key={b._id} value={b._id}>{b.name} ({b.branch || ''} {b.section || ''})</option>
                              ))}
                            </select>
                            {rowLoading[subject._id] && <div className="text-sm text-gray-500">Adding...</div>}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSubjects;
