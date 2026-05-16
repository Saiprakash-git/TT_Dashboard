import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, BookOpen, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

export default function PreferencesPage() {
  const { user } = useAuth();
  
  // State
  const [forms, setForms] = useState([]);
  const [activeForm, setActiveForm] = useState(null);
  const [formSubjects, setFormSubjects] = useState([]);
  
  // Saved Preferences state (Global per teacher for now, adapted for the form)
  const [preferences, setPreferences] = useState({});
  const [hasExisting, setHasExisting] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [globalExistingPreferences, setGlobalExistingPreferences] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const [formsRes, prefsRes, userRes] = await Promise.all([
        api.get('/preference-forms'),
        api.get('/preferences/my/preference'),
        api.get('/auth/me'),
      ]);

      // Only show Active or Completed forms
      const availableForms = (formsRes.data?.data || []).filter(f => f.status === 'active');
      setForms(availableForms);

      setCanEdit(Boolean(userRes.data?.data?.canEditPreferences));

      const prefData = prefsRes.data?.data;
      if (prefData?.preferences?.length) {
        setHasExisting(true);
        setGlobalExistingPreferences(prefData.preferences);
      } else {
        setHasExisting(false);
        setGlobalExistingPreferences([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgramConfigFromForm = (form, program) => {
    return form?.programSettings?.find(config => config.program === program) || null;
  };

  const isOverallProgram = (program, form = activeForm) => {
    return getProgramConfigFromForm(form, program)?.preferenceMode === 'overall';
  };

  const getOverallProgramSubjects = (program) => {
    return formSubjects.filter(subject => subject.program === program);
  };

  const getSlotsForSubjectInForm = (form, subject) => {
    if (!form || !subject) return form?.preferencesPerSemester || 0;
    const programConfig = getProgramConfigFromForm(form, subject.program);

    if (programConfig?.preferenceMode === 'overall') {
      return programConfig?.overallPreferences || 0;
    }

    const num = subject.semesterNumber?.toString();

    if (programConfig?.semesterPreferences && num && programConfig.semesterPreferences[num] !== undefined) {
      return programConfig.semesterPreferences[num];
    }

    if (form.semesterPreferences && num && form.semesterPreferences[num] !== undefined) {
      return form.semesterPreferences[num];
    }

    return form.preferencesPerSemester || 0;
  };

  const handleSelectForm = (form) => {
    setActiveForm(form);
    
    // Extract all subjects from the form payload
    const allSubjects = [];
    form.subjects.forEach(semGroup => {
       allSubjects.push(...semGroup.subjectIds);
    });
    setFormSubjects(allSubjects);

    // Hydrate existing preferences scoped to this form's subjects
    const prefsMap = {};
    if (globalExistingPreferences.length > 0) {
      globalExistingPreferences.forEach((p) => {
        const subjectId = typeof p.subject === 'string' ? p.subject : p.subject?._id;
        const subjectObj = allSubjects.find(s => s._id === subjectId);
        
        if (subjectObj) {
          let key;
          if (isOverallProgram(subjectObj.program, form)) {
            key = `Overall|${subjectObj.program}`;
          } else if (subjectObj.projectWork) {
            // Project work: single flat key
            key = 'ProjectWork';
          } else if (subjectObj.professionalElective) {
            // PE key: PE|Sem X|GroupName
            const semKey = subjectObj.semesterNumber ? `Sem ${subjectObj.semesterNumber}` : 'Uncategorized';
            const groupName = subjectObj.peGroupName || 'Ungrouped';
            key = `PE|${subjectObj.program}|${semKey}|${groupName}`;
          } else {
            const semNumKey = subjectObj.semesterNumber ? `Sem ${subjectObj.semesterNumber}` : 'Uncategorized';
            key = `${subjectObj.program}|${semNumKey}`;
          }
          
          const slotsNeeded = getSlotsForSubjectInForm(form, subjectObj);
          if (!prefsMap[key]) {
            prefsMap[key] = Array(slotsNeeded).fill('');
          }
          if (p.rank >= 1 && p.rank <= slotsNeeded) {
            prefsMap[key][p.rank - 1] = subjectId;
          }
        }
      });
    }
    setPreferences(prefsMap);
  };

  const clearSelection = () => {
    setActiveForm(null);
    setFormSubjects([]);
    setPreferences({});
    // Re-fetch to ensure sync when going back to list
    setLoading(true);
    fetchInitialData();
  };

  // Group forms by Program and then Semesters dynamically
  const getPrograms = () => {
    const programs = new Set();
    formSubjects.forEach((s) => {
      if (!s.professionalElective && !s.projectWork && !isOverallProgram(s.program)) {
        programs.add(s.program);
      }
    });
    const configuredPrograms = activeForm?.includedPrograms?.length
      ? activeForm.includedPrograms
      : ['B.E/B.Tech', 'M.Tech'];
    return configuredPrograms.filter(program => programs.has(program));
  };

  const getSemesterNumbersForProgram = (program) => {
    const sems = new Set();
    formSubjects.forEach((s) => {
      if (s.program === program && !s.professionalElective && !s.projectWork) {
        sems.add(s.semesterNumber ? `Sem ${s.semesterNumber}` : 'Uncategorized');
      }
    });
    // Sort logic, ensuring Uncategorized goes to the end
    return Array.from(sems).sort((a, b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
  };

  const getSlotsNeeded = (program, semesterNumKey, peGroupName, isProjectWork) => {
    if (!activeForm) return 3;
    let subject;
    if (isProjectWork) {
      subject = formSubjects.find(s => s.projectWork === true);
    } else if (peGroupName) {
      subject = formSubjects.find(s =>
        s.professionalElective === true &&
        (!program || s.program === program) &&
        (s.peGroupName || 'Ungrouped') === peGroupName &&
        (s.semesterNumber ? `Sem ${s.semesterNumber}` : 'Uncategorized') === semesterNumKey
      );
    } else {
      subject = formSubjects.find(s => s.program === program && (s.semesterNumber ? `Sem ${s.semesterNumber}` : 'Uncategorized') === semesterNumKey && s.professionalElective !== true && s.projectWork !== true);
    }
    
    // Check if this program is in overall mode
    const programConfig = getProgramConfigFromForm(activeForm, program);
    if (programConfig?.preferenceMode === 'overall') {
      return programConfig?.overallPreferences || 0;
    }
    
    if (subject && subject.semesterNumber !== undefined) {
      const num = subject.semesterNumber.toString();
      if (programConfig?.semesterPreferences && programConfig.semesterPreferences[num] !== undefined) {
        return programConfig.semesterPreferences[num];
      }
      if (activeForm.semesterPreferences && activeForm.semesterPreferences[num] !== undefined) {
        return activeForm.semesterPreferences[num];
      }
    }
    // Fallback if no specific semester could be determined (e.g. empty group)
    return activeForm.preferencesPerSemester || 0;
  };

  const filterAvailable = (program, semesterNumKey, prefs, currentIndex, peGroupName, isProjectWork) => {
    const selected = prefs.filter((id, i) => i !== currentIndex && id);
    return formSubjects.filter((s) => {
      if (program && isOverallProgram(program)) {
        return s.program === program && !selected.includes(s._id);
      }

      // Project Work filtering — all project subjects across all semesters
      if (isProjectWork) {
        return s.projectWork === true && !isOverallProgram(s.program) && !selected.includes(s._id);
      }
      
      // PE group filtering
      if (peGroupName) {
        const sNumKey = s.semesterNumber ? `Sem ${s.semesterNumber}` : 'Uncategorized';
        return s.professionalElective === true && 
               (s.peGroupName || 'Ungrouped') === peGroupName &&
               !isOverallProgram(s.program) &&
               (!program || s.program === program) &&
               (!semesterNumKey || sNumKey === semesterNumKey) &&
               !selected.includes(s._id);
      }
      
      const sNumKey = s.semesterNumber ? `Sem ${s.semesterNumber}` : 'Uncategorized';
      return (
        s.program === program &&
        sNumKey === semesterNumKey &&
        s.professionalElective !== true &&
        s.projectWork !== true &&
        !selected.includes(s._id)
      );
    });
  };

  const handleSave = async () => {
    if (hasExisting && !canEdit) {
      toast.error('You do not have permission to edit preferences. Please contact admin.');
      return;
    }

    // === MANDATORY FIELD VALIDATION ===
    // Build a list of all expected preference groups and check each slot is filled
    const incompleteGroups = [];

    (activeForm?.includedPrograms || []).forEach((program) => {
      if (!isOverallProgram(program)) return;
      const programConfig = getProgramConfigFromForm(activeForm, program);
      const requiredPrefs = programConfig?.overallPreferences || 5;
      const key = `Overall|${program}`;
      const prefs = preferences[key] || [];
      for (let i = 0; i < requiredPrefs; i++) {
        if (!prefs[i]) {
          incompleteGroups.push(program);
          break;
        }
      }
    });

    // 1. Check core subject groups
    programs.forEach((program) => {
      const semesterNumKeys = getSemesterNumbersForProgram(program);
      semesterNumKeys.forEach((semesterNumKey) => {
        const key = `${program}|${semesterNumKey}`;
        const prefs = preferences[key] || [];
        const slotsNeeded = getSlotsNeeded(program, semesterNumKey, null, false);
        for (let i = 0; i < slotsNeeded; i++) {
          if (!prefs[i]) {
            incompleteGroups.push(`${program} — ${semesterNumKey}`);
            break;
          }
        }
      });
    });

    // 2. Check PE groups
    const peSubjects = formSubjects.filter(s => s.professionalElective === true && !isOverallProgram(s.program));
    if (peSubjects.length > 0) {
      const semGroupMap = {};
      peSubjects.forEach(s => {
        const program = s.program || 'Program';
        const semKey = s.semesterNumber ? `Sem ${s.semesterNumber}` : 'Uncategorized';
        const groupName = s.peGroupName || 'Ungrouped';
        const programSemKey = `${program}|${semKey}`;
        if (!semGroupMap[programSemKey]) semGroupMap[programSemKey] = new Set();
        semGroupMap[programSemKey].add(groupName);
      });
      Object.entries(semGroupMap).forEach(([programSemKey, groups]) => {
        const [program, semKey] = programSemKey.split('|');
        groups.forEach(groupName => {
          const peKey = `PE|${program}|${semKey}|${groupName}`;
          const prefs = preferences[peKey] || [];
          const slotsNeeded = getSlotsNeeded(program, semKey, groupName, false);
          for (let i = 0; i < slotsNeeded; i++) {
            if (!prefs[i]) {
              incompleteGroups.push(`${program} PE: ${groupName} (${semKey})`);
              break;
            }
          }
        });
      });
    }

    // 3. Check Project Work
    const projectSubjects = formSubjects.filter(s => s.projectWork === true && !isOverallProgram(s.program));
    if (projectSubjects.length > 0) {
      const pwPrefs = preferences['ProjectWork'] || [];
      const slotsNeeded = getSlotsNeeded(null, null, null, true);
      for (let i = 0; i < slotsNeeded; i++) {
        if (!pwPrefs[i]) {
          incompleteGroups.push('Project Work');
          break;
        }
      }
    }

    if (incompleteGroups.length > 0) {
      toast.error(`Please fill all preference slots. Incomplete: ${incompleteGroups.join(', ')}`);
      return;
    }
    // === END VALIDATION ===

    const allPreferences = [];
    
    // We must merge with global existing preferences that ARE NOT in this form. 
    // To do this, we collect everything from the local state mapping:
    Object.entries(preferences).forEach(([key, prefs]) => {
      let program, semesterNumKey, peGroupName;
      
      if (key === 'ProjectWork') {
        program = 'Project Work';
        semesterNumKey = 'ProjectWork';
        peGroupName = '';
      } else if (key.startsWith('Overall|')) {
        const parts = key.split('|');
        program = parts[1];
        semesterNumKey = 'Overall';
        peGroupName = '';
      } else if (key.startsWith('PE|')) {
        const parts = key.split('|');
        if (parts.length >= 4) {
          program = parts[1];
          semesterNumKey = parts[2];
          peGroupName = parts[3];
        } else {
          program = 'Professional Elective';
          semesterNumKey = parts[1];
          peGroupName = parts[2];
        }
      } else {
        [program, semesterNumKey] = key.split('|');
        peGroupName = '';
      }

      prefs.forEach((subjectId, index) => {
        if (subjectId) {
          const sObj = formSubjects.find(s => s._id === subjectId);
          allPreferences.push({
            subject: subjectId,
            program: key === 'ProjectWork' ? 'Project Work' : (sObj ? sObj.program : program),
            semester: semesterNumKey, 
            peGroupName: peGroupName || '',
            rank: index + 1,
          });
        }
      });
    });

    // Add back global preferences that aren't part of this form's subject lists
    const formSubjectIds = formSubjects.map(s => s._id.toString());
    globalExistingPreferences.forEach(p => {
      const subjectIdStr = (typeof p.subject === 'string' ? p.subject : p.subject?._id).toString();
      if (!formSubjectIds.includes(subjectIdStr)) {
        allPreferences.push({
          subject: subjectIdStr,
          program: p.program,
          semester: p.semester,
          rank: p.rank
        });
      }
    });

    setIsSaving(true);
    try {
      // 1. Save global preferences
      await api.post('/preferences', { preferences: allPreferences });
      
      // 2. Mark this teacher as submitted for this specific form
      if (activeForm) {
        await api.post(`/preference-forms/${activeForm._id}/mark-submitted`, {
          teacherId: user.id
        });
      }

      toast.success('Preferences saved successfully!');
      
      // Re-fetch everything
      await fetchInitialData();
      
      // Re-hydrate the current view
      handleSelectForm(activeForm);

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const disableEditing = hasExisting && !canEdit;

  // RENDERERS
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">
          Loading active forms...
        </div>
      </DashboardLayout>
    );
  }

  // LIST VIEW: Showing all active forms
  if (!activeForm) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Available Preference Forms</h1>
            <p className="text-muted-foreground">Select a form below to submit your top choices for upcoming semesters.</p>
          </div>

          {forms.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50 border-slate-200">
              <CardContent className="flex flex-col items-center justify-center py-24">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-medium text-slate-700 mb-1">No Active Forms</h3>
                <p className="text-slate-500 mb-0">There are currently no open preference forms to submit.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {forms.map(form => {
                const hasSubmitted = form.submittedTeachers?.some(t => {
                   const tid = typeof t === 'string' ? t : t._id;
                   return tid === user.id;
                });
                
                return (
                  <Card key={form._id} className="hover:border-indigo-300 transition-all hover:shadow-md cursor-pointer flex flex-col h-full" onClick={() => {
                    if (hasSubmitted) {
                      if (!window.confirm("You have already submitted preferences for this form. Do you want to proceed to view/edit your submission?")) {
                        return;
                      }
                    }
                    handleSelectForm(form);
                  }}>
                    <div className="h-1.5 w-full bg-indigo-500 rounded-t-xl" />
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                         <Badge className={hasSubmitted ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}>
                           {hasSubmitted ? "✅ Submitted" : "Pending Action"}
                         </Badge>
                      </div>
                      <CardTitle className="text-xl leading-tight text-slate-800">{form.name}</CardTitle>
                      {form.description && (
                        <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                          {form.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                       <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-sm font-medium text-slate-500">Semesters Included:</span>
                          <span className="font-semibold text-slate-700">{form.includedSemesters.join(' & ')}</span>
                       </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-5">
                       <Button className="w-full bg-slate-900 shadow-sm" onClick={(e) => {
                         e.stopPropagation();
                         if (hasSubmitted) {
                           if (!window.confirm("You have already submitted preferences for this form. Do you want to proceed to view/edit your submission?")) {
                             return;
                           }
                         }
                         handleSelectForm(form);
                       }}>
                         {hasSubmitted ? 'View / Edit Submission' : 'Start Preferences'}
                       </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // DETAIL VIEW: Filling out a specific form
  const programs = getPrograms();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
        
        {/* Header Ribbon */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={clearSelection} className="h-10 w-10 shrink-0 rounded-full border-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div className="flex-grow">
            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 mb-2 border-none">Active Form</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">{activeForm.name}</h1>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || disableEditing}
            className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 h-11 px-8 shadow-sm font-medium"
          >
            {isSaving ? 'Saving Form...' : 'Submit Final Preferences'}
          </Button>
        </div>

        {/* Warning card if disableEditing is true */}
        {disableEditing && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 shadow-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong>Editing is currently locked.</strong> You have already submitted preferences. If you need to make changes, please contact your administrator to explicitly enable your edit access.
            </div>
          </div>
        )}

        {/* Form Meta Details */}
        <div className="grid md:grid-cols-3 gap-4">
           {activeForm.description && (
            <Card className="md:col-span-3 bg-white shadow-sm border-slate-200">
              <CardContent className="p-5 text-slate-600">
                 {activeForm.description}
              </CardContent>
            </Card>
           )}
           <Card className="bg-slate-50 border-slate-200 shadow-none">
             <CardContent className="p-5 flex items-center">
                <CheckCircle2 className="w-8 h-8 text-indigo-400 mr-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Choices Per Semester</p>
                  <p className="text-xl font-bold text-slate-800">{activeForm.preferencesPerSemester}</p>
                </div>
             </CardContent>
           </Card>
           <Card className="bg-slate-50 border-slate-200 shadow-none">
             <CardContent className="p-5 flex items-center">
                <Clock className="w-8 h-8 text-indigo-400 mr-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Allocation Type</p>
                  <p className="text-xl font-bold text-slate-800 capitalize">{activeForm.allocationMethod}</p>
                </div>
             </CardContent>
           </Card>
        </div>

        <div className="py-2 border-b border-slate-200" />

        {formSubjects.length === 0 ? (
          <Card className="border-dashed bg-slate-50">
            <CardContent className="py-20 text-center">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-lg font-medium text-slate-600">No subjects assigned</p>
              <p className="text-sm text-slate-500">The administrator hasn't added any subjects to this form yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {(activeForm?.includedPrograms || []).filter(program => isOverallProgram(program)).map(program => {
              const subjects = getOverallProgramSubjects(program);
              if (subjects.length === 0) return null;

              const key = `Overall|${program}`;
              const programConfig = getProgramConfigFromForm(activeForm, program);
              const slotsNeeded = programConfig?.overallPreferences || 0;
              const prefs = preferences[key] || Array(slotsNeeded).fill('');

              return (
                <Card key={key} className="md:col-span-2 border-indigo-200 shadow-sm overflow-hidden">
                  <div className="bg-indigo-50 px-5 py-4 border-b border-indigo-100 flex justify-between items-center">
                    <CardTitle className="text-base font-semibold text-indigo-800">
                      {program} Overall Preferences
                    </CardTitle>
                    <Badge variant="outline" className="text-indigo-600 border-indigo-300 text-xs">
                      {subjects.length} subjects
                    </Badge>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    {Array.from({ length: slotsNeeded }).map((_, idx) => (
                      <div key={`${key}-${idx}`} className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600 flex items-center">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mr-2 border border-indigo-200">
                            {idx + 1}
                          </span>
                          {idx === 0 ? 'Top Preference' : idx === 1 ? '2nd Choice' : idx === 2 ? '3rd Choice' : `${idx + 1}th Choice`}
                        </label>
                        <select
                          className="w-full border-slate-200 rounded-md px-3 py-2.5 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                          value={prefs[idx] || ''}
                          onChange={(e) => {
                            const next = [...prefs];
                            next[idx] = e.target.value;
                            setPreferences({ ...preferences, [key]: next });
                          }}
                          disabled={disableEditing}
                        >
                          <option value="">-- Select a Subject --</option>
                          {filterAvailable(program, null, prefs, idx).map((subject) => (
                            <option key={subject._id} value={subject._id}>
                              {subject.code ? `${subject.code} - ` : ''}{subject.name}
                              {subject.semesterNumber ? ` (Sem ${subject.semesterNumber})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            {programs.map((program) => {
              const semesterNumKeys = getSemesterNumbersForProgram(program);
              
              return semesterNumKeys.map((semesterNumKey) => {
                const key = `${program}|${semesterNumKey}`;
                const slotsNeeded = getSlotsNeeded(program, semesterNumKey, null, false);
                const prefs = preferences[key] || Array(slotsNeeded).fill('');
                
                return (
                  <Card key={key} className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                      <CardTitle className="text-base font-semibold text-slate-800">
                        {program} &nbsp;—&nbsp; <span className="text-indigo-600">{semesterNumKey}</span>
                      </CardTitle>
                    </div>
                    <CardContent className="p-5 space-y-4">
                      {Array.from({ length: slotsNeeded }).map((_, idx) => (
                        <div key={`${key}-${idx}`} className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600 flex items-center">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2 border border-indigo-100">
                              {idx + 1}
                            </span>
                            {idx === 0 ? 'Top Preference' : idx === 1 ? '2nd Choice' : idx === 2 ? '3rd Choice' : `${idx + 1}th Choice`}
                          </label>
                          <select
                            className="w-full border-slate-200 rounded-md px-3 py-2.5 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                            value={prefs[idx] || ''}
                            onChange={(e) => {
                              const next = [...prefs];
                              next[idx] = e.target.value;
                              setPreferences({ ...preferences, [key]: next });
                            }}
                            disabled={disableEditing}
                          >
                            <option value="">-- Select a Subject --</option>
                            {filterAvailable(program, semesterNumKey, prefs, idx).map((subject) => (
                              <option key={subject._id} value={subject._id}>
                                {subject.code} - {subject.name} ({subject.credits} cr)
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              });
            })}

            {/* Professional Electives Block - grouped by semester then by PE group */}
            {(() => {
              const peSubjects = formSubjects.filter(s => s.professionalElective === true && !isOverallProgram(s.program));
              if (peSubjects.length === 0) return null;

              // Group PE subjects by semester number, then by PE group name
              const semGroupMap = {};
              peSubjects.forEach(s => {
                const program = s.program || 'Program';
                const semKey = s.semesterNumber ? `Sem ${s.semesterNumber}` : 'Uncategorized';
                const groupName = s.peGroupName || 'Ungrouped';
                const programSemKey = `${program}|${semKey}`;
                if (!semGroupMap[programSemKey]) semGroupMap[programSemKey] = {};
                if (!semGroupMap[programSemKey][groupName]) semGroupMap[programSemKey][groupName] = [];
                semGroupMap[programSemKey][groupName].push(s);
              });

              // Sort semester keys
              const sortedSemKeys = Object.keys(semGroupMap).sort((a, b) => {
                const [programA, semA] = a.split('|');
                const [programB, semB] = b.split('|');
                if (programA !== programB) return programA.localeCompare(programB);
                if (semA === 'Uncategorized') return 1;
                if (semB === 'Uncategorized') return -1;
                const numA = parseInt(semA.replace('Sem ', ''));
                const numB = parseInt(semB.replace('Sem ', ''));
                return numA - numB;
              });

              return (
                <div className="md:col-span-2">
                  <div className="mb-4 mt-2">
                    <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                      🎓 Professional Electives
                    </h2>
                    <p className="text-sm text-emerald-600 mt-1">Select your preferences for each PE group per semester</p>
                  </div>
                  
                  <div className="space-y-6">
                    {sortedSemKeys.map(programSemKey => {
                      const [program, semKey] = programSemKey.split('|');
                      const groups = semGroupMap[programSemKey];
                      const sortedGroupNames = Object.keys(groups).sort();

                      return (
                        <div key={programSemKey}>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-sm px-3 py-1">
                              {program} - {semKey}
                            </Badge>
                            <div className="h-px flex-grow bg-emerald-200" />
                          </div>
                          
                          <div className="grid gap-4 md:grid-cols-2">
                            {sortedGroupNames.map(groupName => {
                              const peKey = `PE|${program}|${semKey}|${groupName}`;
                              const slotsNeeded = getSlotsNeeded(program, semKey, groupName, false);
                              const prefs = preferences[peKey] || Array(slotsNeeded).fill('');

                              return (
                                <Card key={peKey} className="border-emerald-200 shadow-sm overflow-hidden">
                                  <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex justify-between items-center">
                                    <CardTitle className="text-base font-semibold text-emerald-800">
                                      {groupName}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
                                      {groups[groupName].length} subjects
                                    </Badge>
                                  </div>
                                  <CardContent className="p-5 space-y-4">
                                    {Array.from({ length: slotsNeeded }).map((_, idx) => (
                                      <div key={`${peKey}-${idx}`} className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-600 flex items-center">
                                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold mr-2 border border-emerald-200">
                                            {idx + 1}
                                          </span>
                                          {idx === 0 ? 'Top Preference' : idx === 1 ? '2nd Choice' : idx === 2 ? '3rd Choice' : `${idx + 1}th Choice`}
                                        </label>
                                        <select
                                          className="w-full border-slate-200 rounded-md px-3 py-2.5 text-sm bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                                          value={prefs[idx] || ''}
                                          onChange={(e) => {
                                            const next = [...prefs];
                                            next[idx] = e.target.value;
                                            setPreferences({ ...preferences, [peKey]: next });
                                          }}
                                          disabled={disableEditing}
                                        >
                                          <option value="">-- Select an Elective --</option>
                                          {filterAvailable(program, semKey, prefs, idx, groupName).map((subject) => (
                                            <option key={subject._id} value={subject._id}>
                                              {subject.code} - {subject.name} ({subject.credits} cr)
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Project Work Block — single flat list of all project subjects */}
            {(() => {
              const projectSubjects = formSubjects.filter(s => s.projectWork === true && !isOverallProgram(s.program));
              if (projectSubjects.length === 0) return null;

              const slotsNeeded = getSlotsNeeded(null, null, null, true);
              const pwPrefs = preferences['ProjectWork'] || Array(slotsNeeded).fill('');

              return (
                <div className="md:col-span-2">
                  <div className="mb-4 mt-2">
                    <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                      📂 Project Work
                    </h2>
                    <p className="text-sm text-amber-600 mt-1">Rank your project work preferences across all semesters</p>
                  </div>

                  <Card className="border-amber-200 shadow-sm overflow-hidden">
                    <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex justify-between items-center">
                      <CardTitle className="text-base font-semibold text-amber-800">
                        All Project Work
                      </CardTitle>
                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                        {projectSubjects.length} projects
                      </Badge>
                    </div>
                    <CardContent className="p-5 space-y-4">
                      {Array.from({ length: slotsNeeded }).map((_, idx) => (
                        <div key={`PW-${idx}`} className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600 flex items-center">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold mr-2 border border-amber-200">
                              {idx + 1}
                            </span>
                            {idx === 0 ? 'Top Preference' : idx === 1 ? '2nd Choice' : idx === 2 ? '3rd Choice' : `${idx + 1}th Choice`}
                          </label>
                          <select
                            className="w-full border-slate-200 rounded-md px-3 py-2.5 text-sm bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                            value={pwPrefs[idx] || ''}
                            onChange={(e) => {
                              const next = [...pwPrefs];
                              next[idx] = e.target.value;
                              setPreferences({ ...preferences, 'ProjectWork': next });
                            }}
                            disabled={disableEditing}
                          >
                            <option value="">-- Select a Project --</option>
                            {filterAvailable(null, null, pwPrefs, idx, null, true).map((subject) => (
                              <option key={subject._id} value={subject._id}>
                                {subject.name} (Sem {subject.semesterNumber || '?'})
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}

        {/* Mobile Save Button */}
        <div className="md:hidden mt-8">
           <Button 
              onClick={handleSave} 
              disabled={isSaving || disableEditing}
              className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md font-medium"
            >
              {isSaving ? 'Saving Form...' : 'Submit Final Preferences'}
            </Button>
        </div>

      </div>
    </DashboardLayout>
  );
}
