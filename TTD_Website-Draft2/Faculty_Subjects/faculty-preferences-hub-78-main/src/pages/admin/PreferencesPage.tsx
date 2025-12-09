import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminPreferencesPage() {
  const { teachers } = useTeachers();
  const { subjects } = useSubjects();

  // Filter states
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [topN, setTopN] = useState<string>('all');

  const teachersWithPrefs = teachers.filter(t => t.preference);

  // Build filtered preference rows with rank info
  const filteredPreferences = useMemo(() => {
    let results: { teacherId: string; teacherName: string; subjectId: string; subjectName: string; subjectCode: string; rank: number; submittedAt: string }[] = [];

    // Flatten all preferences into rows with rank
    teachersWithPrefs.forEach(teacher => {
      if (!teacher.preference?.subject_ids) return;
      
      teacher.preference.subject_ids.forEach((subjectId, index) => {
        const subject = subjects.find(s => s.id === subjectId);
        results.push({
          teacherId: teacher.id,
          teacherName: teacher.full_name,
          subjectId,
          subjectName: subject?.name || 'Unknown',
          subjectCode: subject?.code || '-',
          rank: index + 1,
          submittedAt: teacher.preference?.submitted_at || '',
        });
      });
    });

    // Apply teacher filter
    if (selectedTeacher !== 'all') {
      results = results.filter(r => r.teacherId === selectedTeacher);
    }

    // Apply subject filter
    if (selectedSubject !== 'all') {
      results = results.filter(r => r.subjectId === selectedSubject);
    }

    // Apply top N filter
    if (topN !== 'all') {
      const n = parseInt(topN);
      results = results.filter(r => r.rank <= n);
    }

    // Sort by teacher name, then by rank
    results.sort((a, b) => {
      if (a.teacherName !== b.teacherName) {
        return a.teacherName.localeCompare(b.teacherName);
      }
      return a.rank - b.rank;
    });

    return results;
  }, [teachersWithPrefs, subjects, selectedTeacher, selectedSubject, topN]);

  // Get unique subjects that appear in preferences for the subject filter
  const subjectsInPreferences = useMemo(() => {
    const subjectIds = new Set<string>();
    teachersWithPrefs.forEach(t => {
      t.preference?.subject_ids?.forEach(id => subjectIds.add(id));
    });
    return subjects.filter(s => subjectIds.has(s.id));
  }, [teachersWithPrefs, subjects]);

  const clearFilters = () => {
    setSelectedTeacher('all');
    setSelectedSubject('all');
    setTopN('all');
  };

  const hasActiveFilters = selectedTeacher !== 'all' || selectedSubject !== 'all' || topN !== 'all';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-serif font-semibold">Preferences Analytics</h1>
          <p className="text-muted-foreground">Filter and analyze faculty subject preferences</p>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5 text-accent" />
              Filters
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto h-8">
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Teacher Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Teacher</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Teachers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachersWithPrefs.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjectsInPreferences.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Top N Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Top N Preferences</label>
                <Select value={topN} onValueChange={setTopN}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Ranks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ranks</SelectItem>
                    <SelectItem value="1">Top 1 Only</SelectItem>
                    <SelectItem value="2">Top 2</SelectItem>
                    <SelectItem value="3">Top 3</SelectItem>
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preference Results</span>
              <Badge variant="secondary">{filteredPreferences.length} results</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPreferences.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {hasActiveFilters ? 'No preferences match the selected filters' : 'No preferences submitted yet'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPreferences.map((pref, idx) => (
                    <TableRow key={`${pref.teacherId}-${pref.subjectId}-${idx}`}>
                      <TableCell>
                        <Badge 
                          variant={pref.rank === 1 ? 'default' : pref.rank <= 3 ? 'secondary' : 'outline'}
                          className="w-8 justify-center"
                        >
                          {pref.rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{pref.teacherName}</TableCell>
                      <TableCell>{pref.subjectName}</TableCell>
                      <TableCell className="text-muted-foreground">{pref.subjectCode}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pref.submittedAt ? new Date(pref.submittedAt).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
