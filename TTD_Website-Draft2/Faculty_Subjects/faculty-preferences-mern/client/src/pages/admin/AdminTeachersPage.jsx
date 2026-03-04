import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Users, Upload, UserPlus, Trash2, History, CheckCircle, ShieldAlert } from 'lucide-react';

const initialForm = {
  fullName: '',
  email: '',
  facultyId: '',
  department: '',
  designation: '',
  phone: '',
  password: '',
};

const AdminTeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Delete-related states
  const [deleting, setDeleting] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedTeacherForDeletion, setSelectedTeacherForDeletion] = useState(null);
  const [allocationsToReassign, setAllocationsToReassign] = useState([]);
  const [selectedReplacementTeacher, setSelectedReplacementTeacher] = useState('');
  
  // History Modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTeacherForHistory, setSelectedTeacherForHistory] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, preferencesRes, allocsRes] = await Promise.all([
        api.get('/users'),
        api.get('/preferences'),
        api.get('/allocations')
      ]);
      setTeachers(teachersRes.data.data || []);
      setPreferences(preferencesRes.data.data || []);
      setAllocations(allocsRes.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const preferenceMap = useMemo(() => {
    const map = new Map();
    preferences.forEach((pref) => {
      map.set(pref.teacher?._id, pref);
    });
    return map;
  }, [preferences]);

  const teacherAllocations = useMemo(() => {
    const map = new Map();
    allocations.forEach((alloc) => {
      const tid = alloc.teacher?._id || alloc.teacher;
      if (!map.has(tid)) {
        map.set(tid, []);
      }
      map.get(tid).push(alloc);
    });
    return map;
  }, [allocations]);

  const handleOpenHistory = (teacher) => {
    setSelectedTeacherForHistory(teacher);
    setShowHistoryModal(true);
  };

  const handleDelete = async (id) => {
    const teacher = teachers.find(t => t._id === id);
    if (!teacher) return;

    setDeleting(id);
    setSelectedTeacherForDeletion(teacher);

    try {
      // First, try to delete (backend will check for allocations)
      const response = await api.delete(`/users/${id}`);

      // If successful deletion (no allocations)
      if (response.data.success) {
        toast.success(response.data.message);
        fetchData();
        setDeleting('');
        setSelectedTeacherForDeletion(null);
      }
    } catch (err) {
      // Check if backend returned allocation info
      const responseData = err.response?.data;
      
      if (responseData?.requiresReplacement) {
        // Teacher has allocations, show replacement modal
        setAllocationsToReassign(responseData.allocations || []);
        setShowReplacementModal(true);
        setDeleting('');
      } else {
        // Other error
        const msg = responseData?.message || 'Failed to delete teacher';
        toast.error(msg);
        setDeleting('');
        setSelectedTeacherForDeletion(null);
      }
    }
  };

  const handleConfirmDeletion = async () => {
    if (!selectedTeacherForDeletion) return;

    setDeleting(selectedTeacherForDeletion._id);
    
    try {
      const response = await api.delete(`/users/${selectedTeacherForDeletion._id}`, {
        data: { replacementTeacherId: selectedReplacementTeacher }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        if (response.data.reassignedCount > 0) {
          toast.info(`${response.data.reassignedCount} subject(s) reassigned successfully`);
        }
        fetchData();
        setShowReplacementModal(false);
        setSelectedReplacementTeacher('');
        setAllocationsToReassign([]);
        setSelectedTeacherForDeletion(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete teacher';
      toast.error(msg);
    } finally {
      setDeleting('');
    }
  };

  const handleCancelDeletion = () => {
    setShowReplacementModal(false);
    setShowDeleteConfirm(false);
    setSelectedReplacementTeacher('');
    setAllocationsToReassign([]);
    setSelectedTeacherForDeletion(null);
    setDeleting('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!form.fullName || !form.email || !form.facultyId) {
      setError('Full name, email, and faculty ID are required.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/users/create-teacher', form);
      toast.success('Teacher created successfully');
      setForm(initialForm);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create teacher';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleEdit = async (teacherId) => {
    setToggling(teacherId);
    try {
      const res = await api.put(`/users/${teacherId}/toggle-preference-edit`);
      const updated = res.data?.data;
      setTeachers((prev) => prev.map((t) => (t._id === teacherId ? updated : t)));
      toast.success(`Preference editing ${updated.canEditPreferences ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to update permission:', err);
    } finally {
      setToggling('');
    }
  };

  const handleBulkUploadFile = async (file) => {
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        toast.error('Excel file is empty or invalid');
        return;
      }

      // Validate headers
      const requiredHeaders = ['fullName', 'email', 'facultyId'];
      const headers = Object.keys(data[0]);
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      setBulkUploading(true);
      const res = await api.post('/users/bulk-upload', { teachers: data });
      
      setUploadResults(res.data);
      setShowUploadModal(true);

      if (res.data.errorCount === 0) {
        toast.success(`✓ Successfully added ${res.data.successCount} teachers!`);
      } else {
        toast.warning(`Added ${res.data.successCount} teachers, ${res.data.errorCount} errors`);
      }

      fetchData();
    } catch (err) {
      console.error('Error processing file:', err);
      toast.error(err.response?.data?.message || 'Failed to process Excel file');
    } finally {
      setBulkUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
          <div className="animate-pulse flex flex-col items-center">
            <Users className="w-10 h-10 mb-4 opacity-50" />
            <p>Loading teachers data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" /> Manage Teachers
            </h1>
            <p className="text-slate-500 mt-1">Create faculty accounts, manage permissions, and track submissions</p>
          </div>
        </div>

        {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-md border border-emerald-200">{message}</div>}
        {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-md border border-rose-200">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" /> Add Single Teacher
              </CardTitle>
              <CardDescription>Create a new faculty account manually</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Faculty ID *</Label>
                    <Input required value={form.facultyId} onChange={e => setForm({...form, facultyId: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2 relative">
                    <Label>Temporary Password</Label>
                    <Input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Leave blank to force first-time reset" className="bg-slate-50" />
                  </div>
                </div>
                <Button type="submit" className="w-full mt-2" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Teacher Account'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" /> Bulk Upload Teachers
              </CardTitle>
              <CardDescription>Upload multiple teachers at once via Excel</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-indigo-50/50 rounded-lg p-5 border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 mb-2 text-sm">Required Excel Columns:</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-white border-indigo-200">fullName</Badge>
                  <Badge variant="secondary" className="bg-white border-indigo-200">email</Badge>
                  <Badge variant="secondary" className="bg-white border-indigo-200">facultyId</Badge>
                </div>
                <h3 className="font-semibold text-indigo-900 mb-2 text-sm">Optional Columns:</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="outline" className="bg-white/50 text-slate-500">department</Badge>
                  <Badge variant="outline" className="bg-white/50 text-slate-500">designation</Badge>
                  <Badge variant="outline" className="bg-white/50 text-slate-500">phone</Badge>
                  <Badge variant="outline" className="bg-white/50 text-slate-500">password</Badge>
                </div>
                
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="bulk-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-200 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-indigo-500" />
                      <p className="mb-2 text-sm text-slate-500 font-semibold">{bulkUploading ? 'Processing...' : 'Click or drag excel file here'}</p>
                      <p className="text-xs text-slate-400">.xlsx, .xls, .csv allowed</p>
                    </div>
                    <input id="bulk-upload" type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => handleBulkUploadFile(e.target.files[0])} disabled={bulkUploading} />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Results Modal */}
        {showUploadModal && uploadResults && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
            <Card className="max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between sticky top-0 z-10">
                <CardTitle>📈 Upload Results</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowUploadModal(false)} className="rounded-full">✕</Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-emerald-600">{uploadResults.successCount}</span>
                    <span className="text-sm font-medium text-emerald-800">Successfully Added</span>
                  </div>
                  <div className={`border p-4 rounded-lg flex flex-col items-center justify-center ${uploadResults.errorCount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 text-slate-500'}`}>
                    <span className={`text-3xl font-bold ${uploadResults.errorCount > 0 ? 'text-rose-600' : ''}`}>{uploadResults.errorCount}</span>
                    <span className="text-sm font-medium">Errors</span>
                  </div>
                </div>

                {uploadResults.data.success.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-emerald-700 flex items-center mb-2"><CheckCircle className="w-4 h-4 mr-2" /> Added Teachers ({uploadResults.data.success.length})</h3>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-slate-50 space-y-2">
                      {uploadResults.data.success.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded shadow-sm border border-slate-100">
                          <span className="font-medium text-slate-700">{item.fullName}</span>
                          <span className="text-xs text-slate-500 font-mono">{item.facultyId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResults.data.errors.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-rose-700 flex items-center mb-2"><ShieldAlert className="w-4 h-4 mr-2" /> Encountered Errors ({uploadResults.data.errors.length})</h3>
                    <div className="max-h-60 overflow-y-auto border border-rose-100 rounded-md p-2 bg-rose-50/50 space-y-2">
                      {uploadResults.data.errors.map((item, idx) => (
                        <div key={idx} className="text-sm bg-white p-2 rounded shadow-sm border border-rose-100 break-words">
                          <span className="font-bold text-rose-600 mr-2">Row {item.row}:</span>
                          <span className="text-rose-800">{item.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button className="w-full" onClick={() => setShowUploadModal(false)}>Close Summary</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Replacement Teacher Selection Modal */}
        {showReplacementModal && selectedTeacherForDeletion && (
          <div className="modal-overlay" onClick={handleCancelDeletion}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>⚠️ Teacher Has Subject Allocations</h2>
                <button className="modal-close" onClick={handleCancelDeletion}>×</button>
              </div>
              <div className="modal-body">
                <div className="warning-message">
                  <p><strong>{selectedTeacherForDeletion.fullName}</strong> is currently assigned to the following subject(s):</p>
                </div>

                <div className="allocations-list">
                  {allocationsToReassign.map((allocation, idx) => (
                    <div key={idx} className="allocation-item">
                      <span className="allocation-badge">📚</span>
                      <div>
                        <div className="allocation-name">{allocation.subjectName}</div>
                        <div className="allocation-meta">{allocation.subjectCode} • {allocation.academicYear}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="replacement-section">
                  <h3>Select Replacement Teacher</h3>
                  <p className="help-text">Choose another teacher to take over these subject allocations before deleting.</p>
                  
                  <select
                    className="form-select"
                    value={selectedReplacementTeacher}
                    onChange={(e) => setSelectedReplacementTeacher(e.target.value)}
                  >
                    <option value="">-- Select Replacement Teacher --</option>
                    {teachers
                      .filter(t => t._id !== selectedTeacherForDeletion._id && t.role === 'teacher')
                      .map(teacher => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.fullName} ({teacher.facultyId}) - {teacher.department || 'No Dept'}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="confirmation-message">
                  <p><strong>⚠️ Warning:</strong> This action cannot be undone. The teacher will be permanently deleted and all their subject allocations will be transferred to the selected replacement teacher.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCancelDeletion}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleConfirmDeletion}
                  disabled={!selectedReplacementTeacher || deleting}
                >
                  {deleting ? 'Deleting...' : `Delete & Reassign (${allocationsToReassign.length})`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedTeacherForHistory && (
          <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📜 {selectedTeacherForHistory.fullName} - History</h2>
                <button className="modal-close" onClick={() => setShowHistoryModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="mb-6">
                  <h3 className="text-lg font-bold border-b pb-2 mb-3">Current Allocations</h3>
                  {teacherAllocations.has(selectedTeacherForHistory._id) && teacherAllocations.get(selectedTeacherForHistory._id).length > 0 ? (
                    <div className="grid gap-2">
                      {teacherAllocations.get(selectedTeacherForHistory._id).map((alloc, idx) => (
                        <div key={idx} className="bg-emerald-50 border border-emerald-100 p-3 rounded flex flex-col">
                          <span className="font-semibold text-emerald-800">{alloc.subject?.name} ({alloc.subject?.code})</span>
                          <span className="text-sm text-emerald-600">Semester: {alloc.subject?.semester || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No subjects currently allocated.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold border-b pb-2 mb-3">Preference History</h3>
                  {preferenceMap.has(selectedTeacherForHistory._id) && preferenceMap.get(selectedTeacherForHistory._id).preferences?.length > 0 ? (
                    <div className="grid gap-2">
                      {preferenceMap.get(selectedTeacherForHistory._id).preferences.map((p, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded flex items-center justify-between">
                          <div>
                            <span className="font-semibold block">{p.subject?.name} ({p.subject?.code})</span>
                            <span className="text-sm text-slate-500">Program: {p.program}</span>
                          </div>
                          <span className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded">Rank #{p.rank}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No preferences submitted.</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Teacher Table using standard styling classes equivalent to tailwind */}
        <Card className="shadow-sm border-slate-200 mt-6">
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle>Registered Faculty List ({teachers.length})</CardTitle>
              <CardDescription>View all faculty, manage roles, and review preferences</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {teachers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No teachers exist in the system yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-slate-500 uppercase text-xs font-semibold border-b">
                    <tr>
                      <th className="px-4 py-3">Name & ID</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Role & Permissions</th>
                      <th className="px-4 py-3 w-64">Allocated Subject(s)</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.map((teacher, idx) => {
                      const hasPreference = preferenceMap.has(teacher._id);
                      const canEdit = teacher.canEditPreferences;
                      const isAdmin = teacher.role === 'admin';
                      return (
                        <tr key={teacher._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{teacher.fullName}</div>
                            <div className="text-slate-500 text-xs font-mono">{teacher.facultyId} | {teacher.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-700">{teacher.department || '-'}</span>
                            <div className="text-xs text-slate-400">{teacher.designation}</div>
                          </td>
                          <td className="px-4 py-3 space-y-1">
                            <div className="flex items-center gap-2">
                              {isAdmin ? (
                                <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 shadow-none border-none">Admin</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-none border-none">Faculty</Badge>
                              )}
                              {!isAdmin && (
                                <Badge variant="outline" className={hasPreference ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'}>
                                  {hasPreference ? 'Opt: Done' : 'Opt: Pnd'}
                                </Badge>
                              )}
                            </div>
                            {!isAdmin && (
                              <button
                                onClick={() => handleToggleEdit(teacher._id)}
                                disabled={toggling === teacher._id}
                                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded transition-colors ${canEdit ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                              >
                                {toggling === teacher._id ? 'WAIT..' : canEdit ? 'Forms Opened' : 'Forms Locked'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {teacherAllocations.has(teacher._id) && teacherAllocations.get(teacher._id).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {teacherAllocations.get(teacher._id).map((alloc, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800" title={alloc.subject?.name}>
                                    {alloc.subject?.code || 'SUB'}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Unallocated</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasPreference && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                  onClick={() => handleOpenHistory(teacher)}
                                >
                                  <History className="w-3.5 h-3.5 mr-1" /> History
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100"
                                onClick={() => handleDelete(teacher._id)}
                                disabled={isAdmin || deleting === teacher._id}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      
    </DashboardLayout>
  );
};

export default AdminTeachersPage;
