import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useSubjects } from '../hooks/useSubjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

export default function SubjectsPage() {
  const { subjects, isLoading } = useSubjects();
  const [allocations, setAllocations] = useState([]);
  const [allocLoading, setAllocLoading] = useState(true);
  
  const [selectedSemester, setSelectedSemester] = useState('Even');
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState('All');

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const res = await api.get('/allocations/my-subjects');
        setAllocations(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch allocations', err);
      } finally {
        setAllocLoading(false);
      }
    };

    fetchAllocations();
  }, []);

  const getFilteredSubjects = () => {
    if (!subjects) return [];
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
    // If Uncategorized
    const unsortedSemesters = subjects
      .filter(s => (s.semester || 'Uncategorized') === 'Uncategorized' && s.semesterNumber)
      .map(s => s.semesterNumber);
    return [...new Set(unsortedSemesters)].sort();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800" style={{fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em'}}>Subjects</h1>
          <p className="text-muted-foreground">View your allocated subjects and browse all available offerings.</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Allocated Subjects</CardTitle>
                <CardDescription>Subjects assigned to you after allocation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {allocLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : allocations.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">No allocations yet.</p>
                <p className="text-sm text-slate-400">You will see your subjects here once assigned.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {allocations.map((alloc, idx) => (
                  <Card key={alloc._id || idx} className="border-indigo-100 bg-indigo-50/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base text-slate-800">{alloc.subject?.name || 'Subject'}</CardTitle>
                          <CardDescription className="font-mono text-xs mt-1 text-slate-500">
                            {alloc.subject?.code || 'N/A'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Allocated</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {alloc.subject?.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{alloc.subject.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {alloc.subject?.program && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                            {alloc.subject.program}
                          </Badge>
                        )}
                        {alloc.subject?.semester && (
                          <Badge variant="outline" className="border-slate-200 text-slate-600">
                            {alloc.subject.semesterNumber ? `Sem ${alloc.subject.semesterNumber}` : alloc.subject.semester}
                          </Badge>
                        )}
                        {alloc.academicYear && (
                          <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
                            AY {alloc.academicYear}
                          </Badge>
                        )}
                        {alloc.subject?.credits ? (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                            {alloc.subject.credits} cr
                          </Badge>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2 pt-4">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Available Subjects</h2>
          <p className="text-sm text-slate-500">Browse all subjects grouped by semester</p>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="border-slate-100">
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          ) : subjects.length === 0 ? (
            <CardContent className="py-16 text-center bg-slate-50/50">
              <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">No subjects available</h3>
              <p className="text-sm text-slate-500">Check back later for available subjects.</p>
            </CardContent>
          ) : (
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
                      All {selectedSemester} Subjects
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

              <div className="p-6 bg-slate-50/30">
                {getFilteredSubjects().length === 0 ? (
                  <div className="py-12 text-center">
                    <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No subjects found.</p>
                    <p className="text-sm text-slate-400 mt-1">Try selecting a different semester tab.</p>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {getFilteredSubjects().map((subject, index) => (
                      <Card
                        key={subject._id}
                        className="animate-slide-up hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-indigo-300 group flex flex-col"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <CardHeader className="pb-3 flex-grow">
                          <div className="flex items-start justify-between">
                            <div className="pr-2 text-left w-full">
                              <CardTitle className="text-[17px] leading-tight text-slate-800 group-hover:text-indigo-700 transition-colors">
                                {subject.name}
                              </CardTitle>
                              <CardDescription className="font-mono text-xs mt-1.5 font-medium text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                {subject.code}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 flex-shrink-0">
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold">{subject.credits} cr</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {subject.description && (
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px] leading-relaxed">
                              {subject.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-[11px] mt-auto">
                            {subject.program && (
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                {subject.program}
                              </Badge>
                            )}
                            {subject.semester && (
                              <Badge variant="outline" className="border-slate-200 text-slate-600">
                                {subject.semesterNumber ? `Sem ${subject.semesterNumber}` : subject.semester}
                              </Badge>
                            )}
                            {subject.professionalElective && (
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                Prof. Elective
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Tabs>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
