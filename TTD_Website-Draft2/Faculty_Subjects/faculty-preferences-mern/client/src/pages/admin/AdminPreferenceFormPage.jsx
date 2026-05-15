import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, CheckCircle2, Play, Square, Edit2, Trash2, CalendarDays, BookOpen, Settings, Clock, AlertTriangle, XCircle, Info } from 'lucide-react';

const PROGRAM_OPTIONS = [
  { value: 'B.E/B.Tech', label: 'BTech' },
  { value: 'M.Tech', label: 'MTech' },
];

const PROGRAM_ORDER = PROGRAM_OPTIONS.map(option => option.value);

const createEmptyProgramSettings = () => ({
  'B.E/B.Tech': {
    includedSemesters: ['Even', 'Odd'],
    semesterPreferences: {},
    sameAsBTech: false,
  },
  'M.Tech': {
    includedSemesters: ['Even', 'Odd'],
    semesterPreferences: {},
    sameAsBTech: false,
  },
});

const getSemesterNumbersForTypes = (semesterTypes = []) => {
  const numbers = [];
  if (semesterTypes.includes('Odd')) numbers.push(1, 3, 5, 7);
  if (semesterTypes.includes('Even')) numbers.push(2, 4, 6, 8);
  return [...new Set(numbers)].sort((a, b) => a - b);
};

const programSettingsArrayToState = (settings, fallbackSemesters, fallbackPrefs, defaultCount) => {
  const state = createEmptyProgramSettings();

  if (Array.isArray(settings) && settings.length > 0) {
    settings.forEach(entry => {
      if (entry?.program && state[entry.program]) {
        state[entry.program] = {
          includedSemesters: entry.includedSemesters?.length ? entry.includedSemesters : fallbackSemesters,
          semesterPreferences: entry.semesterPreferences || {},
          sameAsBTech: Boolean(entry.sameAsBTech),
        };
      }
    });
    return state;
  }

  state['B.E/B.Tech'] = {
    includedSemesters: fallbackSemesters?.length ? fallbackSemesters : ['Even', 'Odd'],
    semesterPreferences: fallbackPrefs || {},
    sameAsBTech: false,
  };
  state['M.Tech'] = {
    includedSemesters: fallbackSemesters?.length ? fallbackSemesters : ['Even', 'Odd'],
    semesterPreferences: fallbackPrefs || {},
    sameAsBTech: true,
  };

  return state;
};

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
    semesterPreferences: { Even: 3, Odd: 3 },
    includedPrograms: ['B.E/B.Tech'],
    programSettings: createEmptyProgramSettings(),
    maxSubjectsPerTeacher: 1,
    teachersPerSubject: 1,
    includedSemesters: ['Even', 'Odd'],
    allocationMethod: 'manual',
    startsAt: '',
    endsAt: '',
  });

  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [formsRes, subjectsRes, usersRes] = await Promise.all([
        api.get('/preference-forms'),
        api.get('/subjects'),
        api.get('/users'),
      ]);
      setForms(formsRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
      const allUsers = usersRes.data?.data || [];
      setTeachers(allUsers.filter(u => u.role === 'teacher'));
    } catch (err) {
      toast.error('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectsForSemester = (semester) => {
    const allowedPrograms = selectedFormForSubjects?.includedPrograms?.length
      ? selectedFormForSubjects.includedPrograms
      : PROGRAM_ORDER;
    return subjects.filter(s =>
      allowedPrograms.includes(s.program) &&
      s.semester === semester &&
      (!selectedSemesterNumber || s.semesterNumber === selectedSemesterNumber)
    );
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

  const handleSemesterPrefChange = (semester, value) => {
    setFormData(prev => ({
      ...prev,
      semesterPreferences: {
        ...prev.semesterPreferences,
        [semester]: parseInt(value) || 1,
      }
    }));
  };

  const getEffectiveProgramSettings = (data = formData) => {
    const settings = { ...data.programSettings };
    if (
      data.includedPrograms.includes('B.E/B.Tech') &&
      data.includedPrograms.includes('M.Tech') &&
      settings['M.Tech']?.sameAsBTech
    ) {
      settings['M.Tech'] = {
        ...settings['M.Tech'],
        includedSemesters: [...(settings['B.E/B.Tech']?.includedSemesters || [])],
        semesterPreferences: { ...(settings['B.E/B.Tech']?.semesterPreferences || {}) },
      };
    }
    return settings;
  };

  const serializeProgramSettings = (data = formData) => {
    const effectiveSettings = getEffectiveProgramSettings(data);
    return data.includedPrograms.map(program => ({
      program,
      includedSemesters: effectiveSettings[program]?.includedSemesters || [],
      semesterPreferences: effectiveSettings[program]?.semesterPreferences || {},
      sameAsBTech: Boolean(data.programSettings?.[program]?.sameAsBTech),
    }));
  };

  const getSelectedSemesterNumbersForProgram = (program, data = formData) => {
    const effectiveSettings = getEffectiveProgramSettings(data);
    const config = effectiveSettings[program] || {};
    const availableSems = getSemesterNumbersForTypes(config.includedSemesters || []);
    return Object.keys(config.semesterPreferences || {})
      .map(Number)
      .filter(num => availableSems.includes(num))
      .sort((a, b) => a - b);
  };

  const buildSubmitPayload = () => {
    const programSettings = serializeProgramSettings();
    const includedSemesters = [...new Set(programSettings.flatMap(config => config.includedSemesters))];
    const semesterPreferences = programSettings[0]?.semesterPreferences || {};
    const preferencesPerSemester =
      Number(Object.values(semesterPreferences)[0]) ||
      Number(formData.preferencesPerSemester) ||
      1;

    return {
      ...formData,
      preferencesPerSemester,
      includedSemesters,
      semesterPreferences,
      programSettings,
    };
  };

  const handleProgramToggle = (program, checked) => {
    setFormData(prev => {
      const includedPrograms = checked
        ? [...new Set([...prev.includedPrograms, program])].sort((a, b) => PROGRAM_ORDER.indexOf(a) - PROGRAM_ORDER.indexOf(b))
        : prev.includedPrograms.filter(item => item !== program);

      return {
        ...prev,
        includedPrograms,
      };
    });
  };

  const handleProgramSemesterToggle = (program, semester, checked) => {
    setFormData(prev => {
      const current = prev.programSettings[program] || { includedSemesters: [], semesterPreferences: {} };
      const includedSemesters = checked
        ? [...new Set([...current.includedSemesters, semester])]
        : current.includedSemesters.filter(item => item !== semester);
      const availableSems = getSemesterNumbersForTypes(includedSemesters);
      const semesterPreferences = {};

      Object.entries(current.semesterPreferences || {}).forEach(([semNum, count]) => {
        if (availableSems.includes(Number(semNum))) {
          semesterPreferences[semNum] = count;
        }
      });

      return {
        ...prev,
        programSettings: {
          ...prev.programSettings,
          [program]: {
            ...current,
            includedSemesters,
            semesterPreferences,
          },
        },
      };
    });
  };

  const handleProgramSemesterNumberToggle = (program, semNum) => {
    setFormData(prev => {
      const current = prev.programSettings[program] || { includedSemesters: [], semesterPreferences: {} };
      const semesterPreferences = { ...(current.semesterPreferences || {}) };
      if (semesterPreferences[semNum] !== undefined) {
        delete semesterPreferences[semNum];
      } else {
        semesterPreferences[semNum] = prev.preferencesPerSemester || 1;
      }

      return {
        ...prev,
        programSettings: {
          ...prev.programSettings,
          [program]: {
            ...current,
            semesterPreferences,
          },
        },
      };
    });
  };

  const handleProgramPrefChange = (program, semNum, value) => {
    setFormData(prev => {
      const current = prev.programSettings[program] || { includedSemesters: [], semesterPreferences: {} };
      return {
        ...prev,
        programSettings: {
          ...prev.programSettings,
          [program]: {
            ...current,
            semesterPreferences: {
              ...(current.semesterPreferences || {}),
              [semNum]: parseInt(value) || 1,
            },
          },
        },
      };
    });
  };

  const handleSameAsBTechToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      programSettings: {
        ...prev.programSettings,
        'M.Tech': {
          ...prev.programSettings['M.Tech'],
          sameAsBTech: checked,
          ...(checked
            ? {
                includedSemesters: [...(prev.programSettings['B.E/B.Tech']?.includedSemesters || [])],
                semesterPreferences: { ...(prev.programSettings['B.E/B.Tech']?.semesterPreferences || {}) },
              }
            : {}),
        },
      },
    }));
  };

  const validateProgramConfiguration = (data = formData) => {
    if (data.includedPrograms.length === 0) {
      return 'Please select at least one program';
    }

    const effectiveSettings = getEffectiveProgramSettings(data);

    for (const program of data.includedPrograms) {
      const config = effectiveSettings[program];
      if (!config?.includedSemesters?.length) {
        return `Please select Even or Odd semester type for ${program}`;
      }

      const selectedSems = getSelectedSemesterNumbersForProgram(program, data);
      if (selectedSems.length === 0) {
        return `Please select at least one semester number for ${program}`;
      }

      for (const semNum of selectedSems) {
        const neededPrefs = Number(config.semesterPreferences?.[semNum]) || 0;
        const subjectCount = subjects.filter(s =>
          s.program === program &&
          s.semesterNumber === semNum &&
          !s.professionalElective &&
          !s.projectWork
        ).length;

        if (subjectCount === 0) {
          return `No ${program} core subjects found in Sem ${semNum}`;
        }

        if (neededPrefs > subjectCount) {
          return `Not enough ${program} core subjects in Sem ${semNum} to cover ${neededPrefs} preferences. Available: ${subjectCount}`;
        }
      }
    }

    return null;
  };

  const validateAutomaticAllocationConfiguration = (data = formData) => {
    if (data.allocationMethod !== 'automatic') return null;

    const teacherCount = teachers.length;
    const subjectCount = subjects.filter(s =>
      data.includedPrograms.includes(s.program) &&
      getSelectedSemesterNumbersForProgram(s.program, data).includes(s.semesterNumber)
    ).length;
    const maxPerTeacher = parseInt(data.maxSubjectsPerTeacher) || 1;
    const teachersPerSubject = parseInt(data.teachersPerSubject) || 1;
    const totalCapacity = teacherCount * maxPerTeacher;
    const requiredCapacity = subjectCount * teachersPerSubject;

    if (teacherCount === 0) {
      return 'Add teachers before setting up automatic allocation.';
    }

    if (subjectCount === 0) {
      return 'Add subjects for the selected programs and semesters first.';
    }

    if (totalCapacity < requiredCapacity) {
      return `Automatic allocation is not feasible. Capacity is ${totalCapacity}, but ${requiredCapacity} assignments are required.`;
    }

    return null;
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

    const programValidationError = validateProgramConfiguration();
    if (programValidationError) {
      toast.error(programValidationError);
      return;
    }

    const allocationValidationError = validateAutomaticAllocationConfiguration();
    if (allocationValidationError) {
      toast.error(allocationValidationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildSubmitPayload();
      if (editingForm) {
        await api.put(`/preference-forms/${editingForm._id}`, payload);
        toast.success('Preference form updated successfully');
      } else {
        await api.post('/preference-forms', payload);
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
      semesterPreferences: form.semesterPreferences || { Even: form.preferencesPerSemester || 3, Odd: form.preferencesPerSemester || 3 },
      includedPrograms: form.includedPrograms?.length ? form.includedPrograms : ['B.E/B.Tech'],
      programSettings: programSettingsArrayToState(
        form.programSettings,
        form.includedSemesters,
        form.semesterPreferences,
        form.preferencesPerSemester || 3
      ),
      maxSubjectsPerTeacher: form.maxSubjectsPerTeacher || 1,
      teachersPerSubject: form.teachersPerSubject || 1,
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
      semesterPreferences: { Even: 3, Odd: 3 },
      includedPrograms: ['B.E/B.Tech'],
      programSettings: createEmptyProgramSettings(),
      maxSubjectsPerTeacher: 1,
      teachersPerSubject: 1,
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

    const formProgramSettings = selectedFormForSubjects.programSettings?.length
      ? selectedFormForSubjects.programSettings
      : [{
          program: 'B.E/B.Tech',
          includedSemesters: selectedFormForSubjects.includedSemesters || ['Even', 'Odd'],
          semesterPreferences: selectedFormForSubjects.semesterPreferences || {},
        }];

    for (const config of formProgramSettings) {
      const semesterPreferences = config.semesterPreferences || {};
      for (const [semNum, neededPrefs] of Object.entries(semesterPreferences)) {
        if (Number(neededPrefs) > 0) {
          const selectedForSem = selectedSubjectIds.filter(id => {
            const s = subjects.find(sub => sub._id === id);
            return (
              s &&
              s.program === config.program &&
              s.semesterNumber === Number(semNum) &&
              !s.professionalElective &&
              !s.projectWork
            );
          }).length;

          if (selectedForSem < Number(neededPrefs)) {
            toast.error(`Please select at least ${neededPrefs} ${config.program} core subjects for Sem ${semNum}.`);
            return;
          }
        }
      }
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

      if (newStatus === 'closed') {
        const loadingToast = toast.loading('Processing smart allocation updates...');
        try {
          const res = await api.post(`/allocations/auto-allocate/${form._id}`);
          toast.success('Smart allocation scan completed successfully!', { id: loadingToast });
        } catch (e) {
          toast.error('Smart allocation scan failed: ' + (e.response?.data?.message || e.message), { id: loadingToast });
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

                  {form.status === 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => handleChangeStatus(form, 'active')}
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" /> Reopen Form
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

                  <div className="space-y-3">
                    <Label>Programs to Include *</Label>
                    <div className="flex flex-wrap gap-4">
                      {PROGRAM_OPTIONS.map(program => (
                        <label key={program.value} className="flex items-center space-x-2 bg-slate-50 py-2 px-4 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600"
                            checked={formData.includedPrograms.includes(program.value)}
                            onChange={(e) => handleProgramToggle(program.value, e.target.checked)}
                          />
                          <span className="text-sm font-medium">{program.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    {PROGRAM_ORDER.filter(program => formData.includedPrograms.includes(program)).map((program) => {
                      const programLabel = PROGRAM_OPTIONS.find(option => option.value === program)?.label || program;
                      const isMTechSameAsBTech =
                        program === 'M.Tech' &&
                        formData.includedPrograms.includes('B.E/B.Tech') &&
                        formData.programSettings['M.Tech']?.sameAsBTech;
                      const effectiveSettings = getEffectiveProgramSettings();
                      const config = effectiveSettings[program] || { includedSemesters: [], semesterPreferences: {} };
                      const availableSems = getSemesterNumbersForTypes(config.includedSemesters || []);
                      const selectedSems = getSelectedSemesterNumbersForProgram(program);

                      return (
                        <div key={program} className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold text-slate-800">{programLabel} Semester Details</h3>
                              <p className="text-xs text-muted-foreground">Choose semester type, semester numbers, and preference counts for {programLabel}.</p>
                            </div>
                            {program === 'M.Tech' && formData.includedPrograms.includes('B.E/B.Tech') && (
                              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border rounded-md px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData.programSettings['M.Tech']?.sameAsBTech)}
                                  onChange={(e) => handleSameAsBTechToggle(e.target.checked)}
                                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600"
                                />
                                Same as BTech
                              </label>
                            )}
                          </div>

                          <div className={isMTechSameAsBTech ? 'opacity-60 pointer-events-none space-y-4' : 'space-y-4'}>
                            <div className="space-y-2">
                              <Label>{programLabel} Semester Types *</Label>
                              <div className="flex flex-wrap gap-3">
                                {['Even', 'Odd'].map(semester => (
                                  <label key={`${program}-${semester}`} className="flex items-center space-x-2 bg-white py-2 px-4 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-600"
                                      checked={config.includedSemesters?.includes(semester)}
                                      onChange={(e) => handleProgramSemesterToggle(program, semester, e.target.checked)}
                                    />
                                    <span className="text-sm font-medium">{semester} Semesters</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {availableSems.length === 0 ? (
                              <p className="text-sm text-amber-600">Please select a semester type for {programLabel}.</p>
                            ) : (
                              <div className="space-y-2">
                                <Label>Select {programLabel} Semester Numbers *</Label>
                                <div className="flex flex-wrap gap-2">
                                  {availableSems.map(num => {
                                    const isSelected = selectedSems.includes(num);
                                    return (
                                      <Button
                                        key={`${program}-${num}`}
                                        type="button"
                                        onClick={() => handleProgramSemesterNumberToggle(program, num)}
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-10 w-12 text-base"
                                      >
                                        {num}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {selectedSems.length > 0 && (
                              <div className="space-y-3 pt-2">
                                <Label>{programLabel} Preferences per Semester *</Label>
                                {selectedSems.map(semNum => (
                                  <div key={`${program}-${semNum}-prefs`} className="flex items-center gap-3">
                                    <Label className="w-16 font-medium text-slate-600">Sem {semNum}:</Label>
                                    <Input
                                      type="number"
                                      value={config.semesterPreferences?.[semNum] || ''}
                                      onChange={(e) => handleProgramPrefChange(program, semNum, e.target.value)}
                                      min="1"
                                      max="20"
                                      required
                                      className="bg-white flex-1"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="space-y-2 max-w-sm">
                      <Label htmlFor="teachersPerSubject">Teachers per Subject *</Label>
                      <Input
                        id="teachersPerSubject"
                        type="number"
                        name="teachersPerSubject"
                        value={formData.teachersPerSubject}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        required
                        className="bg-white"
                      />
                      <p className="text-xs text-muted-foreground">How many teachers are needed for one subject?</p>
                    </div>
                  </div>

                  <fieldset className="hidden" disabled>
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
                  </fieldset>

                  <fieldset className="hidden" disabled>
                    <div className="space-y-4">
                      {(() => {
                        let availableSems = [];
                        if (formData.includedSemesters.includes('Odd')) availableSems.push(1, 3, 5, 7);
                        if (formData.includedSemesters.includes('Even')) availableSems.push(2, 4, 6, 8);
                        availableSems.sort((a, b) => a - b);

                        if (availableSems.length === 0) {
                          return <p className="text-sm text-amber-600">Please select a semester type above.</p>;
                        }

                        // Determine selected numbers
                        const selectedSems = Object.keys(formData.semesterPreferences || {})
                          .map(Number)
                          .filter(n => availableSems.includes(n));

                        return (
                          <>
                            <div className="space-y-2">
                              <Label>Select Specific Semesters *</Label>
                              <div className="flex flex-wrap gap-2">
                                {availableSems.map(num => {
                                  const isSelected = selectedSems.includes(num);
                                  return (
                                    <Button
                                      key={num}
                                      type="button"
                                      onClick={() => {
                                        const newPrefs = { ...formData.semesterPreferences };
                                        if (isSelected) {
                                          delete newPrefs[num];
                                        } else {
                                          newPrefs[num] = formData.preferencesPerSemester || 1;
                                        }
                                        setFormData({ ...formData, semesterPreferences: newPrefs });
                                      }}
                                      variant={isSelected ? 'default' : 'outline'}
                                      size="sm"
                                      className="h-10 w-12 text-base"
                                    >
                                      {num}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            {selectedSems.length > 0 && (
                              <div className="space-y-3 pt-2">
                                <Label>Preferences per Semester *</Label>
                                {selectedSems.sort((a,b)=>a-b).map(semNum => (
                                  <div key={semNum} className="flex items-center gap-3">
                                    <Label className="w-16 font-medium text-slate-600">Sem {semNum}:</Label>
                                    <Input
                                      type="number"
                                      value={formData.semesterPreferences[semNum] || ''}
                                      onChange={(e) => handleSemesterPrefChange(semNum, e.target.value)}
                                      min="1"
                                      max="20"
                                      required
                                      className="bg-white flex-1"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teachersPerSubject">Teachers per Subject *</Label>
                      <Input
                        id="teachersPerSubject"
                        type="number"
                        name="teachersPerSubject"
                        value={formData.teachersPerSubject}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        required
                        className="bg-white"
                      />
                      <p className="text-xs text-muted-foreground">How many teachers are needed for one subject?</p>
                    </div>
                  </fieldset>

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

                      {/* Feasibility Check Banner */}
                      {(() => {
                        const teacherCount = teachers.length;
                        const subjectCount = subjects.filter(s =>
                          formData.includedPrograms.includes(s.program) &&
                          getSelectedSemesterNumbersForProgram(s.program).includes(s.semesterNumber)
                        ).length;
                        const maxPerTeacher = parseInt(formData.maxSubjectsPerTeacher) || 1;
                        const teachersPerSubject = parseInt(formData.teachersPerSubject) || 1;
                        const totalCapacity = teacherCount * maxPerTeacher;
                        const requiredCapacity = subjectCount * teachersPerSubject;

                        if (teacherCount === 0) {
                          return (
                            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                              <div>
                                <p className="font-semibold">No teachers in the system</p>
                                <p className="text-xs text-rose-600 mt-0.5">Add teachers before setting up automatic allocation.</p>
                              </div>
                            </div>
                          );
                        }

                        if (subjectCount === 0) {
                          return (
                            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                              <div>
                                <p className="font-semibold">No subjects found for selected semesters</p>
                                <p className="text-xs text-amber-600 mt-0.5">Add subjects for the selected programs and semesters first.</p>
                              </div>
                            </div>
                          );
                        }

                        if (totalCapacity < requiredCapacity) {
                          const neededPerTeacher = Math.ceil(requiredCapacity / teacherCount);
                          return (
                            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                              <div>
                                <p className="font-semibold">Allocation not feasible!</p>
                                <p className="text-xs text-rose-600 mt-0.5">
                                  <strong>{teacherCount}</strong> teachers × <strong>{maxPerTeacher}</strong> subjects each = <strong>{totalCapacity}</strong> capacity, but you need <strong>{requiredCapacity}</strong> capacity (<strong>{subjectCount}</strong> subjects × <strong>{teachersPerSubject}</strong> teachers/subject).
                                </p>
                                <p className="text-xs text-rose-600 mt-1">
                                  💡 Increase to at least <strong>{neededPerTeacher}</strong> subjects per teacher, reduce teachers per subject, or add more teachers.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        const unallocatedTeachers = teacherCount - Math.ceil(subjectCount / maxPerTeacher);

                        if (unallocatedTeachers > teacherCount * 0.5) {
                          return (
                            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                              <div>
                                <p className="font-semibold">Feasible, but many teachers may go unallocated</p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                  <strong>{teacherCount}</strong> teachers × <strong>{maxPerTeacher}</strong> each = <strong>{totalCapacity}</strong> capacity for <strong>{subjectCount}</strong> subjects.
                                  ~<strong>{unallocatedTeachers}</strong> teachers may not receive any subject.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
                            <div>
                              <p className="font-semibold">Allocation looks feasible ✓</p>
                              <p className="text-xs text-emerald-600 mt-0.5">
                                <strong>{teacherCount}</strong> teachers × <strong>{maxPerTeacher}</strong> each = <strong>{totalCapacity}</strong> capacity for <strong>{subjectCount}</strong> subjects.
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}


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
                    <Button 
                      type="submit" 
                      disabled={
                        isSubmitting
                      } 
                      className="bg-indigo-600 hover:bg-indigo-700 font-medium px-6"
                    >
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
