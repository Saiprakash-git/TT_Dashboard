import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, CheckCircle2, Play, Square, Edit2, Trash2, CalendarDays, BookOpen, Settings, Clock } from 'lucide-react';

const AdminPreferenceFormPage = () => {
  const [forms, setForms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFormForSubjects, setSelectedFormForSubjects] = useState(null);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('Even');
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [addingSubjects, setAddingSubjects] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    preferencesPerSemester: 3,
    maxSubjectsPerTeacher: 1,
    includedSemesters: ['Even', 'Odd'],
    allocationMethod: 'manual',
    startsAt: '',
    endsAt: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [formsRes, subjectsRes] = await Promise.all([
        api.get('/preference-forms'),
        api.get('/subjects'),
      ]);
      setForms(formsRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectsForSemester = (semester) => {
    return subjects.filter(s => s.semester === semester && (!selectedSemesterNumber || s.semesterNumber === selectedSemesterNumber));
  };

  const getSemesterNumbers = () => {
    if (selectedSemester === 'Odd') return [1, 3, 5, 7];
    if (selectedSemester === 'Even') return [2, 4, 6, 8];
    return [];
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'includedSemesters') {
        setFormData(prev => ({
          ...prev,
          includedSemesters: checked
            ? [...prev.includedSemesters, value]
            : prev.includedSemesters.filter(s => s !== value),
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || '' : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Form name is required');
      return;
    }

    if (formData.startsAt && formData.endsAt && new Date(formData.startsAt) >= new Date(formData.endsAt)) {
      toast.error('Start date must be before end date');
      return;
    }

    // Validate if there are enough subjects in the database for the included semesters
    for (const sem of formData.includedSemesters) {
      const subjectCount = subjects.filter(s => s.semester === sem).length;
      if (subjectCount < formData.preferencesPerSemester) {
        toast.error(`Not enough subjects for ${sem} semester to cover ${formData.preferencesPerSemester} preferences. Available: ${subjectCount}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingForm) {
        await api.put(`/preference-forms/${editingForm._id}`, formData);
        toast.success('Preference form updated successfully');
      } else {
        await api.post('/preference-forms', formData);
        toast.success('Preference form created successfully');
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    setFormData({
      name: form.name,
      description: form.description || '',
      preferencesPerSemester: form.preferencesPerSemester,
      maxSubjectsPerTeacher: form.maxSubjectsPerTeacher || 1,
      includedSemesters: form.includedSemesters,
      allocationMethod: form.allocationMethod,
      startsAt: form.startsAt ? form.startsAt.slice(0, 16) : '',
      endsAt: form.endsAt ? form.endsAt.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this preference form?')) return;

    try {
      await api.delete(`/preference-forms/${id}`);
      toast.success('Preference form deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete form');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingForm(null);
    setFormData({
      name: '',
      description: '',
      preferencesPerSemester: 3,
      maxSubjectsPerTeacher: 1,
      includedSemesters: ['Even', 'Odd'],
      allocationMethod: 'manual',
      startsAt: '',
      endsAt: '',
    });
  };

  const handleAddSubjectsClick = (form) => {
    setSelectedFormForSubjects(form);
    setSelectedSemester(form.includedSemesters[0] || 'Even');
    setSelectedSemesterNumber(null);
    
    // Auto-select existing subjects
    const existingIds = [];
    form.subjects?.forEach(s => {
      existingIds.push(...s.subjectIds.map(sub => typeof sub === 'string' ? sub : sub._id));
    });
    setSelectedSubjectIds(existingIds);
    
    setShowSubjectsModal(true);
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleAddSubjectsSubmit = async () => {
    if (selectedSubjectIds.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    setAddingSubjects(true);
    try {
      await api.post(`/preference-forms/${selectedFormForSubjects._id}/add-subjects`, {
        semester: selectedSemester,
        subjectIds: selectedSubjectIds.filter(id => {
          const s = subjects.find(sub => sub._id === id);
          return s && s.semester === selectedSemester;
        }),
      });
      toast.success(`Subjects updated for ${selectedSemester} semester`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subjects');
    } finally {
      setAddingSubjects(false);
    }
  };

  const handleChangeStatus = async (form, newStatus) => {
    if (newStatus === 'closed') {
      const confirmClose = window.confirm('Close form? This will end this form and process for allocation');
      if (!confirmClose) return;
    }

    try {
      await api.put(`/preference-forms/${form._id}`, { status: newStatus });
      toast.success(`Form status changed to ${newStatus}`);
      fetchData();

      if (newStatus === 'closed' && form.allocationMethod === 'automatic') {
        const loadingToast = toast.loading('Processing automatic allocation...');
        try {
          const res = await api.post(`/allocations/auto-allocate/${form._id}`);
          toast.success('Automatic allocation completed successfully!', { id: loadingToast });
        } catch (e) {
          toast.error('Auto allocation failed: ' + (e.response?.data?.message || e.message), { id: loadingToast });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getFormSubjectsForSemester = (form, semester) => {
    const semesterGroup = form.subjects?.find(s => s.semester === semester);
    return semesterGroup?.subjectIds || [];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-muted-foreground">Loading preference forms...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">📋 Form Management</h1>
            <p className="text-muted-foreground mt-1">Create and configure preference submission processes</p>
          </div>
          <Button onClick={() => setShowModal(true)} size="lg" className="shadow-md bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-5 h-5 mr-2" /> Create New Form
          </Button>
        </div>

        {forms.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-medium text-slate-700 mb-2">No forms created yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm text-center">Create a preference form to allow teachers to select their desired subjects.</p>
              <Button onClick={() => setShowModal(true)}>Create First Form</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map(form => (
              <Card key={form._id} className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200">
                <div className={`h-2 w-full ${form.status === 'active' ? 'bg-emerald-500' : form.status === 'draft' ? 'bg-slate-300' : 'bg-rose-500'}`} />
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`
                      ${form.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : ''}
                      ${form.status === 'draft' ? 'bg-slate-100 text-slate-800 border-slate-200' : ''}
                      ${form.status === 'closed' ? 'bg-rose-100 text-rose-800 border-rose-200' : ''}
                    `}>
                      {form.status.toUpperCase()}
                    </Badge>
                    <div className="flex space-x-1">
                       {form.allocationMethod === 'automatic' ? (
                        <div className="flex items-center text-xs text-indigo-600 font-medium px-2 py-1 bg-indigo-50 rounded">
                           🤖 Auto
                        </div>
                       ) : (
                        <div className="flex items-center text-xs text-slate-600 font-medium px-2 py-1 bg-slate-100 rounded">
                           👤 Manual
                        </div>
                       )}
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight text-slate-800">{form.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                    {form.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow pt-5 space-y-5">
                  <div className="flex justify-center">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center text-center">
                      <span className="text-sm font-medium text-slate-500 mb-1">Per Sem</span>
                      <span className="text-2xl font-bold text-slate-700">{form.preferencesPerSemester}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <CalendarDays className="w-4 h-4 mr-2 text-indigo-500" />
                      <span className="font-medium mr-2">Semesters:</span>
                      {form.includedSemesters.join(' & ')}
                    </div>
                    {form.startsAt && (
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                        <span className="truncate">
                          {new Date(form.startsAt).toLocaleDateString()} - {new Date(form.endsAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Form Details</p>
                    <div className="space-y-2">
                       {form.includedSemesters.map(semester => (
                        <div key={semester} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{semester} Subjects:</span>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold">
                            {getFormSubjectsForSemester(form, semester).length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {form.submittedTeachers && form.submittedTeachers.length > 0 && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm flex items-center shadow-sm border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      <span className="font-medium">{form.submittedTeachers.length}</span> &nbsp;submissions received
                    </div>
                  )}
                </CardContent>

                <div className="bg-slate-50 p-3 border-t flex flex-wrap gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-700"
                    onClick={() => handleAddSubjectsClick(form)}
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Subjects
                  </Button>

                  {form.status === 'draft' && (
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleChangeStatus(form, 'active')}
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" /> Activate
                    </Button>
                  )}

                  {form.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                      onClick={() => handleChangeStatus(form, 'closed')}
                    >
                      <Square className="w-3.5 h-3.5 mr-1.5" /> Close Form
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => handleEdit(form)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(form._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <CardHeader className="sticky top-0 bg-white z-10 border-b pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                    {editingForm ? 'Edit Preference Form' : 'Create Preference Form'}
                  </CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCloseModal} className="w-8 h-8 rounded-full -mt-2 -mr-2">✕</Button>
              </CardHeader>
              
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Form Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Spring 2024 Preferences"
                      required
                      className="bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:bg-white transition-colors"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Optional details or instructions for teachers..."
                      rows="2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="space-y-2">
                      <Label htmlFor="preferencesPerSemester">Preferences per Semester *</Label>
                      <Input
                        id="preferencesPerSemester"
                        type="number"
                        name="preferencesPerSemester"
                        value={formData.preferencesPerSemester}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        required
                        className="bg-white"
                      />
                      <p className="text-xs text-muted-foreground">E.g., 3 choices for Even, 3 for Odd</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Allocation Method *</Label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className={`flex-1 flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-all ${formData.allocationMethod === 'manual' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                        <input
                          type="radio"
                          name="allocationMethod"
                          value="manual"
                          className="mt-1 flex-shrink-0 text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                          checked={formData.allocationMethod === 'manual'}
                          onChange={handleInputChange}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">👤 Manual</span>
                          <span className="text-xs text-slate-500 mt-1">Admin assigns subjects to teachers manually after review</span>
                        </div>
                      </label>
                      <label className={`flex-1 flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-all ${formData.allocationMethod === 'automatic' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                        <input
                          type="radio"
                          name="allocationMethod"
                          value="automatic"
                          className="mt-1 flex-shrink-0 text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                          checked={formData.allocationMethod === 'automatic'}
                          onChange={handleInputChange}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">🤖 Automatic</span>
                          <span className="text-xs text-slate-500 mt-1">System attempts auto-allocation based on rankings</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {formData.allocationMethod === 'automatic' && (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <div className="space-y-2">
                        <Label htmlFor="maxSubjectsPerTeacher">Max Subjects Per Teacher for Auto-Allocation *</Label>
                        <Input
                          id="maxSubjectsPerTeacher"
                          type="number"
                          name="maxSubjectsPerTeacher"
                          value={formData.maxSubjectsPerTeacher}
                          onChange={handleInputChange}
                          min="1"
                          max="20"
                          required
                          className="bg-white"
                        />
                        <p className="text-xs text-muted-foreground">How many subjects should a teacher take up in the automatic allocation?</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Semesters to Include *</Label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center space-x-2 bg-slate-50 py-2 px-4 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          name="includedSemesters"
                          value="Even"
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600"
                          checked={formData.includedSemesters.includes('Even')}
                          onChange={handleInputChange}
                        />
                        <span className="text-sm font-medium">📅 Even Semesters</span>
                      </label>
                      <label className="flex items-center space-x-2 bg-slate-50 py-2 px-4 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          name="includedSemesters"
                          value="Odd"
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600"
                          checked={formData.includedSemesters.includes('Odd')}
                          onChange={handleInputChange}
                        />
                        <span className="text-sm font-medium">📅 Odd Semesters</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="space-y-2">
                      <Label htmlFor="startsAt" className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-1 text-slate-400" /> Start Date <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                      </Label>
                      <Input
                        id="startsAt"
                        type="datetime-local"
                        name="startsAt"
                        value={formData.startsAt}
                        onChange={handleInputChange}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endsAt" className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-1 text-slate-400" /> End Date <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                      </Label>
                      <Input
                        id="endsAt"
                        type="datetime-local"
                        name="endsAt"
                        value={formData.endsAt}
                        onChange={handleInputChange}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                    <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || formData.includedSemesters.length === 0} className="bg-indigo-600 hover:bg-indigo-700 font-medium px-6">
                      {isSubmitting ? 'Saving...' : (editingForm ? 'Update Form' : 'Create Form')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Subjects Modal */}
        {showSubjectsModal && selectedFormForSubjects && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader className="bg-white z-10 border-b flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">
                      Manage Subjects: <span className="text-indigo-600">{selectedFormForSubjects.name}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Select which subjects are available for teachers to choose from
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowSubjectsModal(false)} className="rounded-full w-8 h-8 flex-shrink-0">
                    ✕
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="overflow-y-auto flex-grow bg-slate-50/50 p-6">
                <div className="flex gap-4 mb-6 sticky top-0 bg-slate-50/90 backdrop-blur pb-4 z-10 -mx-2 px-2 border-b">
                  <div className="flex gap-2 p-1 bg-slate-200/60 rounded-lg">
                    {selectedFormForSubjects.includedSemesters.map(sem => (
                      <Button
                        key={sem}
                        variant={selectedSemester === sem ? 'default' : 'ghost'}
                        onClick={() => {
                          setSelectedSemester(sem);
                          setSelectedSemesterNumber(null);
                        }}
                        className={`rounded-md px-6 ${selectedSemester === sem ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        {sem} Semester
                      </Button>
                    ))}
                  </div>

                  {selectedSemester && (
                    <div className="flex flex-wrap gap-2 items-center pl-4 border-l border-slate-300">
                      <Button
                        variant={selectedSemesterNumber === null ? 'default' : 'outline'}
                        onClick={() => setSelectedSemesterNumber(null)}
                        size="sm"
                        className={selectedSemesterNumber === null ? 'bg-slate-800 text-white' : 'bg-white'}
                      >
                        All
                      </Button>
                      {getSemesterNumbers().map(num => (
                        <Button
                          key={num}
                          variant={selectedSemesterNumber === num ? 'default' : 'outline'}
                          onClick={() => setSelectedSemesterNumber(num)}
                          size="sm"
                          className={selectedSemesterNumber === num ? 'bg-indigo-600 text-white' : 'bg-white'}
                        >
                          Sem {num}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
                      Available {selectedSemester} Subjects {selectedSemesterNumber && `(Sem ${selectedSemesterNumber})`}
                    </h3>
                    <div className="text-sm font-medium text-slate-500 bg-white border px-3 py-1 rounded-full shadow-sm">
                      {getSubjectsForSemester(selectedSemester).filter(s => selectedSubjectIds.includes(s._id)).length} selected
                    </div>
                  </div>

                  {getSubjectsForSemester(selectedSemester).length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                      <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">No subjects found for this semester filter.</p>
                      <p className="text-sm text-slate-400 mt-1">Try switching semesters above or add subjects in the Subjects management page.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {getSubjectsForSemester(selectedSemester).map(subject => {
                        const isSelected = selectedSubjectIds.includes(subject._id);
                        return (
                          <label 
                            key={subject._id} 
                            className={`flex items-start p-4 rounded-xl border transition-all cursor-pointer shadow-sm
                              ${isSelected 
                                ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' 
                                : 'bg-white hover:bg-slate-50 hover:border-indigo-300 border-slate-200'}`}
                          >
                            <div className="flex items-center h-5 mt-0.5">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0"
                                checked={isSelected}
                                onChange={() => handleSubjectToggle(subject._id)}
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-start">
                                <span className={`font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                  {subject.name}
                                </span>
                                <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {subject.code}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] leading-tight px-1.5 py-0">
                                  {subject.credits} cr
                                </Badge>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] leading-tight px-1.5 py-0">
                                  {subject.program}
                                </Badge>
                                <Badge variant="outline" className="border-slate-200 text-slate-500 text-[10px] leading-tight px-1.5 py-0">
                                  Sem {subject.semesterNumber || '—'}
                                </Badge>
                                {subject.professionalElective && (
                                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px] leading-tight px-1.5 py-0">
                                    Elective
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>

              <div className="bg-white border-t p-4 flex justify-between items-center rounded-b-xl flex-shrink-0">
                <Button variant="outline" onClick={() => setShowSubjectsModal(false)}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button
                     variant="secondary"
                     onClick={() => {
                        const semSubjects = getSubjectsForSemester(selectedSemester).map(s => s._id);
                        const hasAll = semSubjects.every(id => selectedSubjectIds.includes(id));
                        if (hasAll) {
                           setSelectedSubjectIds(prev => prev.filter(id => !semSubjects.includes(id)));
                        } else {
                           setSelectedSubjectIds(prev => [...new Set([...prev, ...semSubjects])]);
                        }
                     }}
                     className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                     Select All Listed
                  </Button>
                  <Button 
                    onClick={handleAddSubjectsSubmit} 
                    className="bg-indigo-600 hover:bg-indigo-700 px-6"
                    disabled={addingSubjects}
                  >
                    {addingSubjects ? 'Saving...' : `Save Subjects for ${selectedSemester}`}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPreferenceFormPage;
