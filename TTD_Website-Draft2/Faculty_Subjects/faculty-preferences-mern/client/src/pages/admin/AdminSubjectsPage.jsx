import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Edit2, Trash2, Plus, BookOpen, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

const AdminSubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('Even');
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    semester: '',
    semesterNumber: '',
    program: 'B.E/B.Tech',
    professionalElective: false,
    peGroupName: '',
  });
  const [peGroups, setPeGroups] = useState({}); // { semesterNumber: ['PE1', 'PE2', ...] }
  const [showNewPeInput, setShowNewPeInput] = useState(false);
  const [newPeGroupName, setNewPeGroupName] = useState('');

  useEffect(() => {
    fetchSubjects();
    fetchPeGroups();
  }, []);

  const fetchPeGroups = async () => {
    try {
      const res = await api.get('/subjects/pe-groups');
      setPeGroups(res.data.data || {});
    } catch (err) {
      console.error('Failed to fetch PE groups', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const [subsRes, allocsRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/allocations')
      ]);
      setSubjects(subsRes.data.data);
      setAllocations(allocsRes.data.data);
    } catch (err) {
      toast.error('Failed to load subjects data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, formData);
        toast.success('Subject updated successfully!');
      } else {
        await api.post('/subjects', formData);
        toast.success('Subject created successfully!');
      }

      fetchSubjects();
      fetchPeGroups();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      credits: subject.credits,
      semester: subject.semester || '',
      semesterNumber: subject.semesterNumber || '',
      program: subject.program || 'B.E/B.Tech',
      professionalElective: Boolean(subject.professionalElective),
      peGroupName: subject.peGroupName || '',
    });
    setShowNewPeInput(false);
    setNewPeGroupName('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted successfully!');
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      credits: 3,
      semester: '',
      semesterNumber: '',
      program: 'B.E/B.Tech',
      professionalElective: false,
      peGroupName: '',
    });
    setShowNewPeInput(false);
    setNewPeGroupName('');
  };

  const handleEndSemester = async () => {
    let name = selectedSemesterNumber === 'All' ? `${selectedSemester} Semester` : `Semester ${selectedSemesterNumber}`;
    if (!window.confirm(`Are you sure you want to end ${name}? This will relieve all teachers from subjects in this selection by removing their current allocations.`)) return;

    try {
      // Find subjects in this selection
      const subjectsToRelieve = getFilteredSubjects().map(s => s._id);
      if (subjectsToRelieve.length === 0) {
        return toast.info('No subjects found in this selection.');
      }

      await api.post('/allocations/remove-multiple', { subjectIds: subjectsToRelieve });
      toast.success(`${name} ended successfully! Teachers relieved.`);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to end ${name}`);
    }
  };

  const getAllocatedTeacher = (subjectId) => {
    const alloc = allocations.find(a => String(a.subject?._id || a.subject) === String(subjectId));
    return alloc?.teacher?.fullName || null;
  };

  const getFilteredSubjects = () => {
    return subjects.filter(subject => {
      // Treat missing/empty semester as 'Uncategorized'
      const subjectSem = subject.semester || 'Uncategorized';
      const matchSem = subjectSem === selectedSemester;
      
      if (!matchSem) return false;
      
      if (selectedSemesterNumber !== 'All') {
        return subject.semesterNumber === selectedSemesterNumber;
      }
      return true;
    });
  };

  const getSemesterNumbers = (sem) => {
    if (sem === 'Odd') return [1, 3, 5, 7];
    if (sem === 'Even') return [2, 4, 6, 8];
    // If Uncategorized or anything else, just return an empty array or the specific known numbers
    const unsortedSemesters = subjects
      .filter(s => (s.semester || 'Uncategorized') === 'Uncategorized' && s.semesterNumber)
      .map(s => s.semesterNumber);
    return [...new Set(unsortedSemesters)].sort();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-muted-foreground">Loading subjects...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">📚 Manage Subjects</h1>
            <p className="text-muted-foreground mt-1">Create, edit, and organize course offerings</p>
          </div>
          <Button onClick={() => setShowModal(true)} size="lg" className="shadow-md">
            <Plus className="w-5 h-5 mr-2" /> Add New Subject
          </Button>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-xl">Subjects List ({subjects.length})</CardTitle>
                <CardDescription>Filter and view available subjects</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
                <Button 
                  variant="outline"
                  onClick={handleEndSemester} 
                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border-rose-200 shadow-sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> End {selectedSemesterNumber === 'All' ? selectedSemester : `Sem ${selectedSemesterNumber}`}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setFormData({ ...formData, semester: selectedSemester, semesterNumber: selectedSemesterNumber === 'All' ? '' : selectedSemesterNumber });
                    setShowModal(true);
                  }} 
                  className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Subject to {selectedSemester}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs 
              value={selectedSemester} 
              onValueChange={(val) => {
                setSelectedSemester(val);
                setSelectedSemesterNumber('All');
              }} 
              className="w-full"
            >
              <div className="px-6 pt-6 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-indigo-100 pb-0">
                <TabsList className="mb-4 bg-white/60 shadow-sm border border-slate-200 flex flex-wrap h-auto">
                  <TabsTrigger value="Even" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                    📅 Even Semester
                  </TabsTrigger>
                  <TabsTrigger value="Odd" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                    📅 Odd Semester
                  </TabsTrigger>
                  <TabsTrigger value="Uncategorized" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                    ⚠️ Uncategorized
                  </TabsTrigger>
                </TabsList>

                {/* Second tier tabs for semester numbers */}
                <Tabs 
                  value={selectedSemesterNumber.toString()} 
                  onValueChange={(val) => setSelectedSemesterNumber(val === 'All' ? 'All' : parseInt(val))}
                  className="w-full"
                >
                  <TabsList className="bg-transparent border-none flex-wrap h-auto gap-2 mb-4 pb-0 items-start justify-start">
                    <TabsTrigger 
                      value="All"
                      className="rounded-full px-4 border border-indigo-200 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 bg-white"
                    >
                      All
                    </TabsTrigger>
                    {getSemesterNumbers(selectedSemester).map(num => (
                      <TabsTrigger 
                        key={num} 
                        value={num.toString()}
                        className="rounded-full px-4 border border-indigo-200 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 bg-white"
                      >
                        Sem {num}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="p-6">
                {getFilteredSubjects().length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-lg font-medium text-slate-600 mb-2">No subjects found</p>
                    <p className="text-sm text-slate-500 mb-6">There are no subjects matching your filters.</p>
                    <Button 
                      onClick={() => {
                        setFormData({ ...formData, semester: selectedSemester, semesterNumber: selectedSemesterNumber === 'All' ? '' : selectedSemesterNumber });
                        setShowModal(true);
                      }} 
                    >
                      <Plus className="w-4 h-4 mr-2" /> Create First Subject
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-xs border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Sem</th>
                          <th className="px-4 py-3">Program</th>
                          <th className="px-4 py-3 text-center">Credits</th>
                          <th className="px-4 py-3">Allocated To</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3 w-48 hidden md:table-cell">Description</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getFilteredSubjects().map((subject) => (
                          <tr key={subject._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono font-medium text-slate-800">
                              {subject.code}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">{subject.name}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="bg-slate-50">
                                {subject.semesterNumber ? `Sem ${subject.semesterNumber}` : subject.semester}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant="secondary" 
                                className={subject.program === 'B.E/B.Tech' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}
                              >
                                {subject.program}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 rounded-md px-2 py-1 font-semibold text-xs min-w-8">
                                {subject.credits}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {getAllocatedTeacher(subject._id) ? (
                                <span className="font-medium text-emerald-700 text-sm">{getAllocatedTeacher(subject._id)}</span>
                              ) : (
                                <span className="text-slate-400 italic text-sm">Not allocated</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {subject.professionalElective ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Prof. Elective</Badge>
                                  {subject.peGroupName && (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50/50 text-xs">{subject.peGroupName}</Badge>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-slate-500 bg-slate-50">Core</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-slate-500 truncate max-w-[200px]">
                              {subject.description || '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(subject)}
                                  className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 h-8"
                                >
                                  <Edit2 className="w-4 h-4 mr-1" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(subject._id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 h-8"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
              <CardHeader className="sticky top-0 bg-white z-10 border-b flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</CardTitle>
                  <CardDescription>Fill in the details for the subject</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-full w-8 h-8 -mt-2 -mr-2 text-slate-500 hover:text-slate-900">
                  ✕
                </Button>
              </CardHeader>
              
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="code">Subject Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. CS201"
                        required
                        className="font-mono bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credits">Credits *</Label>
                      <Input
                        id="credits"
                        type="number"
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || '' })}
                        min="1"
                        max="10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Subject Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Data Structures"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester Type *</Label>
                      <select
                        id="semester"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value, semesterNumber: '' })}
                        required
                      >
                        <option value="">-- Select --</option>
                        <option value="Odd">Odd Semester</option>
                        <option value="Even">Even Semester</option>
                      </select>
                    </div>

                    {formData.semester && (
                      <div className="space-y-2">
                        <Label>Semester Number</Label>
                        <div className="flex flex-wrap gap-2">
                          {getSemesterNumbers(formData.semester).map(num => (
                            <Button
                              key={num}
                              type="button"
                              onClick={() => setFormData({ ...formData, semesterNumber: num })}
                              variant={formData.semesterNumber === num ? 'default' : 'outline'}
                              size="sm"
                              className="h-9 w-9 p-0"
                            >
                              {num}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="program">Program *</Label>
                      <select
                        id="program"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        required
                      >
                        <option value="B.E/B.Tech">B.E/B.Tech</option>
                        <option value="M.Tech">M.Tech</option>
                      </select>
                    </div>

                    <div className="space-y-2 flex flex-col justify-center pt-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          checked={formData.professionalElective}
                          onChange={(e) => setFormData({ ...formData, professionalElective: e.target.checked, peGroupName: e.target.checked ? formData.peGroupName : '' })}
                        />
                        <span className="text-sm font-medium">Professional Elective</span>
                      </label>
                      <p className="text-xs text-muted-foreground ml-6">Mark this subject as an elective</p>
                    </div>
                  </div>

                  {/* PE Group Name Selector - only when PE is checked and semester is selected */}
                  {formData.professionalElective && formData.semesterNumber && (
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-3">
                      <Label className="text-emerald-800 font-semibold">PE Group Name *</Label>
                      <p className="text-xs text-emerald-600">Select an existing PE group in Semester {formData.semesterNumber} or create a new one</p>
                      
                      {!showNewPeInput ? (
                        <div className="space-y-2">
                          <select
                            className="flex h-10 w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                            value={formData.peGroupName}
                            onChange={(e) => {
                              if (e.target.value === '__NEW__') {
                                setShowNewPeInput(true);
                                setFormData({ ...formData, peGroupName: '' });
                              } else {
                                setFormData({ ...formData, peGroupName: e.target.value });
                              }
                            }}
                          >
                            <option value="">-- Select PE Group --</option>
                            {(peGroups[formData.semesterNumber] || []).map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                            <option value="__NEW__">➕ Add New PE Group</option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g. PE1, PE2, Professional Elective 3"
                              value={newPeGroupName}
                              onChange={(e) => setNewPeGroupName(e.target.value)}
                              className="bg-white border-emerald-300 focus-visible:ring-emerald-500"
                            />
                            <Button
                              type="button"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap h-10"
                              onClick={() => {
                                if (newPeGroupName.trim()) {
                                  setFormData({ ...formData, peGroupName: newPeGroupName.trim() });
                                  setShowNewPeInput(false);
                                }
                              }}
                            >
                              Confirm
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-10 border-emerald-300"
                              onClick={() => {
                                setShowNewPeInput(false);
                                setNewPeGroupName('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {formData.peGroupName && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                            {formData.peGroupName}
                          </Badge>
                          <span className="text-xs text-emerald-600">— Semester {formData.semesterNumber}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.professionalElective && !formData.semesterNumber && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-700 text-sm">
                      ⚠️ Please select a semester number first to assign a PE group name.
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional details about this course"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                    <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !formData.name || !formData.code}>
                      {isSubmitting ? 'Saving...' : (editingSubject ? 'Update Subject' : 'Create Subject')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSubjectsPage;
