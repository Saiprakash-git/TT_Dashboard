import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from '../../api/axiosInstance';

export default function CreateAdmin() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !email) return alert('Name and email required');
    setLoading(true);
    try {
      const res = await axios.post('/admin/admins', { name, email });
      alert(`Admin created: ${res.data.email}`);
      setName(''); setEmail('');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to create admin');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex">
      <Sidebar role="admin" />
      <div className="flex-1">
        <Navbar role="admin" />
        <div className="p-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Create Admin</h2>
          <p className="text-sm text-slate-600 mb-4">Create a new administrator account. The new admin will be prompted to set their password on first login.</p>
          <form onSubmit={handleCreate} className="bg-white p-6 rounded shadow-sm">
            <div className="mb-4">
              <label className="block text-sm mb-2">Full name</label>
              <input className="w-full p-2 border rounded" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-2">Email</label>
              <input type="email" className="w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Creating...' : 'Create Admin'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
