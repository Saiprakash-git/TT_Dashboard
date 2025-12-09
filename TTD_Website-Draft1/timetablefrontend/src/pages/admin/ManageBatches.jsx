import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from '../../api/axiosInstance';

export default function ManageBatches(){
  const [batches, setBatches] = useState([]);
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');
  const [joiningYear, setJoiningYear] = useState('');
  const [currentSemester, setCurrentSemester] = useState(1);

  const fetch = async () => {
    try{
      const res = await axios.get('/admin/batches');
      setBatches(res.data || []);
    }catch(err){ console.error(err); }
  }

  useEffect(()=>{ fetch(); }, []);

  const handleCreate = async () => {
    if(!name) return alert('Name required');
    try{
      const res = await axios.post('/admin/batches', { name, branch, section, joiningYear: joiningYear ? Number(joiningYear) : undefined, currentSemester });
      setBatches([...(batches || []), res.data]);
      setName(''); setBranch(''); setSection(''); setJoiningYear(''); setCurrentSemester(1);
    }catch(err){ console.error(err); alert('Failed to create'); }
  }

  const handleUpdateSemester = async (id, sem) => {
    try{
      const res = await axios.patch(`/admin/batches/${id}`, { currentSemester: sem });
      setBatches(batches.map(b => b._id === id ? res.data : b));
    }catch(err){ console.error(err); alert('Failed to update'); }
  }

  const handleDelete = async (id) => {
    if(!window.confirm('Delete batch?')) return;
    try{
      await axios.delete(`/admin/batches/${id}`);
      setBatches(batches.filter(b => b._id !== id));
    }catch(err){ console.error(err); alert('Failed to delete'); }
  }

  return (
    <div className="flex">
      <Sidebar role="admin" />
      <div className="flex-1">
        <Navbar role="admin" />
        <div className="p-6 max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Manage Batches</h2>
          <div className="bg-white p-4 rounded shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="p-2 border rounded" placeholder="Batch name" value={name} onChange={e=>setName(e.target.value)} />
              <input className="p-2 border rounded" placeholder="Branch" value={branch} onChange={e=>setBranch(e.target.value)} />
              <input className="p-2 border rounded" placeholder="Section" value={section} onChange={e=>setSection(e.target.value)} />
              <input className="p-2 border rounded" placeholder="Joining year" value={joiningYear} onChange={e=>setJoiningYear(e.target.value)} />
              <input type="number" className="p-2 border rounded w-40" placeholder="Current semester" value={currentSemester} onChange={e=>setCurrentSemester(Number(e.target.value))} />
              <div className="flex items-center">
                <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded">Create Batch</button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-3">Batches</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Branch</th>
                    <th className="p-2 text-left">Section</th>
                    <th className="p-2 text-left">Joining Year</th>
                    <th className="p-2 text-left">Current Semester</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b._id} className="border-t">
                      <td className="p-2">{b.name}</td>
                      <td className="p-2">{b.branch}</td>
                      <td className="p-2">{b.section}</td>
                      <td className="p-2">{b.joiningYear || '-'}</td>
                      <td className="p-2">
                        <input type="number" value={b.currentSemester || ''} onChange={e=>handleUpdateSemester(b._id, Number(e.target.value))} className="p-1 border rounded w-28" />
                      </td>
                      <td className="p-2">
                        <button onClick={()=>handleDelete(b._id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
