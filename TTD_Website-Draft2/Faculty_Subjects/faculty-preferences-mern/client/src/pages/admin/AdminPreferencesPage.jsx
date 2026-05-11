import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import api from '../../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Search, X, Loader2, Table2 } from 'lucide-react';
const AdminPreferencesPage = () => {
  const [allPreferences, setAllPreferences] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPreference, setSelectedPreference] = useState(null);
  
  // Filter states
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [topN, setTopN] = useState('all');
  const [customTopN, setCustomTopN] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prefResponse, subjectsResponse] = await Promise.all([
        api.get('/preferences'),
        api.get('/subjects')
      ]);
      setAllPreferences(prefResponse.data.data);
      setAllSubjects(subjectsResponse.data.data || []);
    } catch (err) {
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  // Get unique teachers with preferences
  const teachersWithPreferences = useMemo(() => {
    return [...new Map(allPreferences.filter(p => p.teacher && p.teacher._id).map(p => [p.teacher._id, p.teacher])).values()];
  }, [allPreferences]);

  // Get subjects that appear in preferences
  const subjectsInPreferences = useMemo(() => {
    const subjectIds = new Set();
    allPreferences.forEach(pref => {
      pref.preferences?.forEach((p) => {
        const subjectId = typeof p.subject === 'string' ? p.subject : p.subject?._id;
        if (subjectId) subjectIds.add(subjectId);
      });
    });
    return allSubjects.filter(s => subjectIds.has(s._id));
  }, [allPreferences, allSubjects]);

  // Flatten preferences with ranking and apply filters
  const filteredPreferences = useMemo(() => {
    const results = [];

    // Flatten preferences - each preference item carries rank and program
    allPreferences.forEach(preference => {
      preference.preferences?.forEach((p, index) => {
        let subjectObj = p.subject;
        const subjectId = typeof subjectObj === 'string' ? subjectObj : subjectObj?._id;
        
        // Ensure subjectObj is fully populated from allSubjects if it's currently just an ID or missing name
        if (!subjectObj?.name) {
          const foundSubject = allSubjects.find(s => String(s._id) === String(subjectId));
          if (foundSubject) {
            subjectObj = foundSubject;
          }
        }

        results.push({
          preferencId: preference._id,
          teacherId: preference.teacher?._id,
          teacherName: preference.teacher?.fullName || 'Unknown',
          teacherEmail: preference.teacher?.email,
          subjectId,
          subjectName: subjectObj?.name || 'Unknown',
          subjectCode: subjectObj?.code || '',
          subjectSemesterType: subjectObj?.semester || '',
          subjectSemesterNumber: subjectObj?.semesterNumber || null,
          isPE: subjectObj?.professionalElective || false,
          peGroupName: subjectObj?.peGroupName || p.peGroupName || '',
          rank: p.rank || index + 1,
          program: p.program,
          submittedAt: preference.submittedAt || preference.updatedAt || preference.createdAt,
        });
      });
    });

    // Apply teacher filter
    if (selectedTeacher !== 'all') {
      results.splice(0, results.length, ...results.filter(r => r.teacherId === selectedTeacher));
    }

    // Apply subject filter
    if (selectedSubject !== 'all') {
      results.splice(0, results.length, ...results.filter(r => r.subjectId === selectedSubject));
    }

    // Apply semester filter
    if (selectedSemester !== 'all') {
      results.splice(0, results.length, ...results.filter(r => {
        if (selectedSemester === 'Even') return r.subjectSemesterType === 'Even';
        if (selectedSemester === 'Odd') return r.subjectSemesterType === 'Odd';
        return r.subjectSemesterNumber === parseInt(selectedSemester) || String(r.subjectSemesterType) === selectedSemester;
      }));
    }

    // Apply top N filter
    if (topN !== 'all') {
      const n = parseInt(topN);
      results.splice(0, results.length, ...results.filter(r => r.rank <= n));
    }

    // Apply custom top N filter
    if (customTopN) {
      const n = parseInt(customTopN);
      if (!isNaN(n) && n > 0) {
        results.splice(0, results.length, ...results.filter(r => r.rank <= n));
      }
    }

    // Sort by RANK first (most important preferences shown first), then by teacher name
    results.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;  // Sort by rank first (1, 2, 3, etc.)
      }
      return a.teacherName.localeCompare(b.teacherName);  // Then by teacher name
    });

    return results;
  }, [allPreferences, selectedTeacher, selectedSubject, selectedSemester, topN, customTopN]);

  const clearFilters = () => {
    setSelectedTeacher('all');
    setSelectedSubject('all');
    setSelectedSemester('all');
    setTopN('all');
    setCustomTopN('');
  };

  const hasActiveFilters = selectedTeacher !== 'all' || selectedSubject !== 'all' || selectedSemester !== 'all' || topN !== 'all' || customTopN !== '';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
          <div className="animate-pulse flex flex-col items-center">
            <Loader2 className="w-10 h-10 mb-4 opacity-50 animate-spin" />
            <p>Loading preferences data...</p>
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
              <Table2 className="w-8 h-8 text-indigo-600" /> Preferences Analytics
            </h1>
            <p className="text-slate-500 mt-1">Filter and analyze faculty subject preferences submissions</p>
          </div>
        </div>

        {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-lg border border-rose-200">{error}</div>}

        {/* Filters Card */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-b from-slate-50/50 to-white">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400" /> Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters} className="text-slate-500 hover:text-slate-900 h-8 px-2">
                <X className="w-4 h-4 mr-1" /> Clear All
              </Button>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Teacher Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="teacher-select">Teacher</Label>
                <select
                  id="teacher-select"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-10"
                >
                  <option value="all">All Teachers</option>
                  {teachersWithPreferences.filter(t => t && t._id).map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="subject-select">Subject</Label>
                <select
                  id="subject-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-10"
                >
                  <option value="all">All Subjects</option>
                  {subjectsInPreferences.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="semester-select">Semester</Label>
                <select
                  id="semester-select"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-10"
                >
                  <option value="all">All Semesters</option>
                  <option value="Even">Even Semesters</option>
                  <option value="Odd">Odd Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num.toString()}>Semester {num}</option>
                  ))}
                </select>
              </div>

              {/* Top N Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="topn-select">Top N Preferences</Label>
                <select
                  id="topn-select"
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-10"
                >
                  <option value="all">All Ranks</option>
                  <option value="1">Top 1 Only</option>
                  <option value="2">Top 2</option>
                  <option value="3">Top 3</option>
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Custom Top N Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="custom-topn-input">Custom Top N</Label>
                <div className="relative">
                  <Input
                    id="custom-topn-input"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Enter rank limit"
                    value={customTopN}
                    onChange={(e) => setCustomTopN(e.target.value)}
                    disabled={topN !== 'custom'}
                    className={topN !== 'custom' ? 'bg-slate-100 placeholder:text-slate-400' : ''}
                  />
                  {customTopN && topN === 'custom' && (
                    <span className="absolute -bottom-5 left-0 text-[10px] text-indigo-600 font-medium whitespace-nowrap">
                      Showing Top {customTopN}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Results Table</h2>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">{filteredPreferences.length} matching rows</Badge>
          </div>
          <CardContent className="p-0">
            {filteredPreferences.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-4xl">📭</span>
                <p className="text-slate-500 mt-4 font-medium">No preferences match the current filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Faculty Name</th>
                      <th className="px-6 py-4">Subject & Code</th>
                      <th className="px-6 py-4 text-right">Submission Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPreferences.map((row, idx) => (
                      <tr key={`${row.preferencId}-${row.subjectId}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-slate-100/50 border-slate-200 text-slate-700 font-bold px-2.5 py-1">
                            #{row.rank}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{row.teacherName}</div>
                          <div className="text-xs text-slate-500 mt-1">{row.teacherEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{row.subjectName}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{row.subjectCode}</span>
                            <span className="text-xs text-slate-500">Sem {row.subjectSemesterNumber || row.subjectSemesterType}</span>
                            {row.isPE && row.peGroupName && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">{row.peGroupName}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 text-xs text-nowrap">
                          {new Date(row.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
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

export default AdminPreferencesPage;
