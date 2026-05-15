import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Target, ArrowLeft, Bot, UserIcon, Trash2, CheckCircle2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const AdminAllocationPage = () => {
  const [forms, setForms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formPreferences, setFormPreferences] = useState([]);
  const [autoAllocating, setAutoAllocating] = useState(false);
  const [inlineAllocating, setInlineAllocating] = useState(false);
  const [teachersCountConfig, setTeachersCountConfig] = useState({});
  const [filters, setFilters] = useState({
    semester: 'All',
    program: 'All',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [formsRes, teachersRes, allocationsRes, prefsRes] = await Promise.all([
        api.get('/preference-forms'),
        api.get('/users'),
        api.get('/allocations'),
        api.get('/preferences'),
      ]);
      
      setForms(formsRes.data.data || []);
      setTeachers(teachersRes.data.data?.filter(u => u.role === 'teacher') || []);
      setAllocations(allocationsRes.data.data || []);
      setFormPreferences(prefsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = (form) => {
    setSelectedForm(form);
    setFilters({ semester: 'All', program: 'All' });
    setTeachersCountConfig({}); // Reset config on form select
  };

  const getFormSubjects = () => {
    if (!selectedForm) return [];
    
    const subjects = selectedForm.subjects?.flatMap(s => 
      s.subjectIds.map(subject => ({
        ...subject,
        semester: s.semester,
      }))
    ) || [];

    let filtered = subjects;

    if (filters.semester !== 'All') {
      filtered = filtered.filter(s => s.semester === filters.semester);
    }

    if (filters.program !== 'All') {
      filtered = filtered.filter(s => s.program === filters.program);
    }

    return filtered;
  };

  const getSubjectName = (subjectId) => {
    const pref = formPreferences.find(p => 
      p.preferences?.some(pr => pr.subject?._id === subjectId || pr.subject === subjectId)
    );
    
    if (pref?.preferences) {
      const found = pref.preferences.find(pr => pr.subject?._id === subjectId || pr.subject === subjectId);
      if (found?.subject?.name) return found.subject.name;
    }

    return 'Unknown Subject';
  };

  const getTeacherPreferences = (subjectId) => {
    return formPreferences
      .filter(pref => pref.preferences?.some(pr => pr.subject?._id === subjectId || pr.subject === subjectId))
      .map(pref => {
        const preference = pref.preferences.find(pr => pr.subject?._id === subjectId || pr.subject === subjectId);
        return {
          teacher: pref.teacher,
          rank: preference?.rank,
        };
      })
      .sort((a, b) => a.rank - b.rank);
  };

  const getAllocatedTeachers = (subjectId) => {
    return allocations
      .filter(a => a.subject?._id === subjectId || a.subject === subjectId)
      .map(a => ({ allocId: a._id, teacher: a.teacher }));
  };

  const isSubjectAllocatedFully = (subjectId) => {
    const needed = teachersCountConfig[subjectId] || selectedForm?.teachersPerSubject || 1;
    const currentCount = getAllocatedTeachers(subjectId).length;
    return currentCount >= needed;
  };

  const handleAutoAllocate = async () => {
    if (!selectedForm) return;

    if (!window.confirm(`This will automatically allocate all subjects based on teacher preferences. Continue?`)) {
      return;
    }

    setAutoAllocating(true);
    try {
      const response = await api.post(`/allocations/auto-allocate/${selectedForm._id}`, {
        academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      });

      toast.success(response.data.message);
      fetchData();
      setSelectedForm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally {
      setAutoAllocating(false);
    }
  };

  const handleInlineAllocate = async (subjectId, teacherId) => {
    if (!subjectId || !teacherId) return;

    const prefs = getTeacherPreferences(subjectId);
    const needed = teachersCountConfig[subjectId] || selectedForm?.teachersPerSubject || 1;
    
    if (needed > prefs.length) {
      toast.error(`Insufficient teachers in preferences. You requested ${needed} but only ${prefs.length} teachers submitted preferences for this subject.`);
      return;
    }

    const currentCount = getAllocatedTeachers(subjectId).length;
    if (currentCount >= needed) {
      toast.error(`Subject already has ${needed} teachers allocated.`);
      return;
    }

    setInlineAllocating(true);
    const toastId = toast.loading('Allocating subject...');
    try {
      await api.post('/allocations/allocate-manual', {
        subjectId,
        teacherId,
        academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      });

      toast.success('Teacher allocated successfully', { id: toastId });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed', { id: toastId });
    } finally {
      setInlineAllocating(false);
    }
  };

  const handleDeallocate = async (allocId) => {
    if (!window.confirm('Are you sure you want to remove this teacher allocation?')) return;
    
    if (!allocId) return;

    const toastId = toast.loading('Removing allocation...');
    try {
      await api.delete(`/allocations/${allocId}`);
      toast.success('Allocation removed', { id: toastId });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove allocation', { id: toastId });
    }
  };

  const handleExportExcel = () => {
    if (!selectedForm) return;

    const exportData = getFormSubjects().map(subject => {
      const allocatedTeacher = getAllocatedTeacher(subject._id);
      return {
        'Subject Code': subject.code,
        'Subject Name': subject.name,
        'Semester': subject.semester,
        'Credits': subject.credits,
        'Allocated Teacher Name': allocatedTeacher ? allocatedTeacher.fullName : 'Not Allocated',
        'Teacher Email': allocatedTeacher ? allocatedTeacher.email : 'N/A',
        'Teacher Department': allocatedTeacher ? allocatedTeacher.department : 'N/A',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Allocations');
    
    // Generate buffer and open download dialog
    XLSX.writeFile(workbook, `${selectedForm.name.replace(/[^a-zA-Z0-9]/g, '_')}_Allocations.xlsx`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
          <div className="animate-pulse flex flex-col items-center">
            <Target className="w-10 h-10 mb-4 opacity-50" />
            <p>Loading allocation data...</p>
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
              <Target className="w-8 h-8 text-indigo-600" /> Subject Allocations
            </h1>
            <p className="text-slate-500 mt-1">Allocate subjects to teachers based on preferences</p>
          </div>
        </div>

        {!selectedForm ? (
          // Select Preference Form
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-slate-800">Select Preference Form</h2>
              <p className="text-slate-500 text-sm">Choose an active or completed preference form to view or execute subject allocations.</p>
            </div>

            {forms.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-4">📭</span>
                  <p className="text-lg font-medium text-slate-700">No preference forms found</p>
                  <p className="text-sm text-slate-500">Create preference forms first in Manage Forms section.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map(form => {
                  const subjectIdsInForm = form.subjects?.flatMap(s => s.subjectIds.map(sub => sub._id || sub)) || [];
                  const countAllocated = allocations.filter(a => {
                    const aSubjectId = a.subject?._id || a.subject;
                    return subjectIdsInForm.includes(aSubjectId);
                  }).length;
                  const totalSubjects = subjectIdsInForm.length;
                  const isComplete = totalSubjects > 0 && countAllocated >= totalSubjects;

                  return (
                    <Card key={form._id} className="hover:shadow-md transition-shadow border-slate-200">
                      <CardHeader className="pb-4 border-b bg-slate-50/50">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg line-clamp-1">{form.name}</CardTitle>
                          <Badge variant="outline" className={form.allocationMethod === 'automatic' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
                            {form.allocationMethod === 'automatic' ? <><Bot className="w-3 h-3 mr-1"/> Auto</> : <><UserIcon className="w-3 h-3 mr-1"/> Manual</>}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{form.description || 'No description provided'}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-slate-50 p-2 rounded-md border text-center">
                            <p className="text-slate-500 text-xs">Status</p>
                            <p className="font-semibold text-slate-700 capitalize">{form.status}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-md border text-center">
                            <p className="text-slate-500 text-xs">Responses</p>
                            <p className="font-semibold text-slate-700">{form.submittedTeachers?.length || 0}</p>
                          </div>
                        </div>
                        
                        {isComplete ? (
                          <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                            onClick={() => handleSelectForm(form)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> View Allocations
                          </Button>
                        ) : (
                          <Button 
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                            onClick={() => handleSelectForm(form)}
                          >
                            Incomplete Allocations →
                          </Button>
                        )}
                        
                        <div className="text-center text-xs text-slate-500 mt-2">
                          {countAllocated} / {totalSubjects} Subjects Allocated
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Allocation Interface
          <div className="space-y-6 animate-zoom-in">
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setSelectedForm(null)} className="h-9">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <h2 className="text-xl font-bold m-0 flex-1">{selectedForm.name}</h2>
              <Badge variant="secondary" className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 border-indigo-200">
                {selectedForm.allocationMethod === 'automatic' ? '🤖 Automatic Allocation' : '👤 Manual Allocation'}
              </Badge>
            </div>



            {selectedForm.allocationMethod === 'manual' && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-4">
                <UserIcon className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-amber-900 font-semibold text-lg">Manual Allocation Mode active</h3>
                  <p className="text-amber-700 text-sm mt-1">Review the top choices submitted by faculty members for each subject below. Use the "Select" button to explicitly bind a subject to a specific teacher.</p>
                </div>
              </div>
            )}

            {/* Filters */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="font-semibold text-slate-700 text-sm whitespace-nowrap">Filter By:</span>
                  <select
                    value={filters.semester}
                    onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                    className="flex-1 w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                  >
                    <option value="All">All Semesters</option>
                    {selectedForm.includedSemesters?.map(sem => (
                      <option key={sem} value={sem}>{sem} Semester</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <select
                    value={filters.program}
                    onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                  >
                    <option value="All">All Programs</option>
                    <option value="B.E/B.Tech">B.E/B.Tech</option>
                  </select>
                </div>
                <div className="flex-1 text-right text-sm text-slate-500">
                  Showing <span className="font-bold text-slate-800">{getFormSubjects().length}</span> subjects
                </div>
              </CardContent>
            </Card>

            {/* Subjects Allocation Table */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-white border-b px-6 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Allocation Manifest</CardTitle>
                {(() => {
                  const subjectIdsInSelectedForm = selectedForm.subjects?.flatMap(s => s.subjectIds.map(sub => sub._id || sub)) || [];
                  const countAllocatedSelected = allocations.filter(a => subjectIdsInSelectedForm.includes(a.subject?._id || a.subject)).length;
                  const isSelectedComplete = subjectIdsInSelectedForm.length > 0 && countAllocatedSelected >= subjectIdsInSelectedForm.length;
                  
                  return isSelectedComplete ? (
                    <Button size="sm" onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Download className="w-4 h-4 mr-2" /> Download to Excel
                    </Button>
                  ) : null;
                })()}
              </CardHeader>
              <CardContent className="p-0">
                {getFormSubjects().length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl">📭</span>
                    <p className="text-slate-500 mt-4 font-medium">No subjects matched the current filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b">
                        <tr>
                          <th className="px-6 py-4">Code</th>
                          <th className="px-6 py-4 w-1/4">Subject & Semester</th>
                          <th className="px-6 py-4 w-1/3">Teacher Preferences</th>
                          <th className="px-6 py-4">Allocated Teacher</th>
                          <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getFormSubjects().map(subject => {
                          const prefs = getTeacherPreferences(subject._id);
                          const allocatedTeachers = getAllocatedTeachers(subject._id);
                          const isAllocatedFully = isSubjectAllocatedFully(subject._id);
                          const neededTeachers = teachersCountConfig[subject._id] || selectedForm?.teachersPerSubject || 1;

                          return (
                            <tr key={subject._id} className={`hover:bg-slate-50/80 transition-colors ${isAllocatedFully ? 'bg-emerald-50/20' : ''}`}>
                              <td className="px-6 py-4 font-mono text-slate-500 text-xs font-semibold">{subject.code}</td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-slate-900">{subject.name}</div>
                                <div className="text-xs text-slate-500 mt-1">{subject.semester} • {subject.credits} Credits</div>
                                {selectedForm.allocationMethod === 'manual' && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <label className="text-xs text-slate-600 font-medium">No of teachers:</label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={neededTeachers}
                                      onChange={(e) => setTeachersCountConfig({...teachersCountConfig, [subject._id]: parseInt(e.target.value) || 1})}
                                      className="h-6 w-16 text-xs px-2"
                                    />
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1.5">
                                  {prefs.length === 0 ? (
                                    <span className="text-slate-400 text-xs italic">No faculty preferences submitted yet.</span>
                                  ) : (
                                    prefs.map((pref, idx) => (
                                      <div key={idx} className={`flex justify-between items-center p-2 rounded-md border ${allocatedTeachers.some(at => at.teacher?._id === pref.teacher?._id) ? 'bg-emerald-100/50 border-emerald-200' : 'bg-white border-slate-200'} shadow-sm text-xs`}>
                                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                                          <span className="shrink-0 bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px]">Pref {pref.rank}</span>
                                          <span className={`font-medium truncate ${allocatedTeachers.some(at => at.teacher?._id === pref.teacher?._id) ? 'text-emerald-800' : 'text-slate-700'}`} title={pref.teacher?.fullName}>
                                            {pref.teacher?.fullName || 'Unknown'}
                                          </span>
                                        </div>
                                        {selectedForm.allocationMethod === 'manual' && !allocatedTeachers.some(at => at.teacher?._id === pref.teacher?._id) && !isAllocatedFully && (
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleInlineAllocate(subject._id, pref.teacher?._id)}
                                            disabled={inlineAllocating}
                                            className="h-6 text-[10px] px-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shrink-0"
                                          >
                                            Select
                                          </Button>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {allocatedTeachers.length > 0 ? (
                                  <div className="space-y-2">
                                    {allocatedTeachers.map((at, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <span className="bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                                        <span className="font-medium text-emerald-700 truncate" title={at.teacher?.fullName}>{at.teacher?.fullName}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-slate-400 border-dashed border-slate-300 font-normal">Unassigned</Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {allocatedTeachers.length > 0 && (
                                  <div className="space-y-2">
                                    {allocatedTeachers.map((at, i) => (
                                      <Button
                                        key={i}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeallocate(at.allocId)}
                                        className="h-6 text-[10px] px-2 bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 mx-auto flex w-full max-w-[100px]"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                                      </Button>
                                    ))}
                                  </div>
                                )}
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
        )}



        
      </div>
    </DashboardLayout>
  );
};

export default AdminAllocationPage;
