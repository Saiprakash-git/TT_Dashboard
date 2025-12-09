import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', semester: '' });

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/auth/profile');
      setProfile(res.data);
      setForm({ name: res.data.name || '', email: res.data.email || '', semester: res.data.semester || '' });
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { fetchProfile(); }, []);

  const save = async () => {
    try {
      const res = await axios.patch('/auth/profile', form);
      setProfile(res.data);
      setEditing(false);
      alert('Profile updated');
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">My Profile</h2>
      {profile ? (
        <div>
          {!editing ? (
            <div>
              <div><strong>Name:</strong> {profile.name}</div>
              <div><strong>Email:</strong> {profile.email}</div>
              <div><strong>Semester:</strong> {profile.semester || '—'}</div>
              <button onClick={() => setEditing(true)} className="mt-3 px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
            </div>
          ) : (
            <div>
              <div className="mb-2"><input className="border p-2 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="mb-2"><input className="border p-2 w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="mb-2"><input type="number" className="border p-2 w-full" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
              <button onClick={save} className="mr-2 px-3 py-1 bg-green-600 text-white rounded">Save</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
            </div>
          )}
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default Profile;
