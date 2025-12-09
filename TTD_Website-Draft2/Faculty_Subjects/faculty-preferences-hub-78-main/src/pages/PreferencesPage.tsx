import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import { usePreferences } from '@/hooks/usePreferences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Subject } from '@/types';

function SortableSubject({ subject, index }: { subject: Subject; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subject.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 bg-card border rounded-lg transition-shadow",
        isDragging && "shadow-lg ring-2 ring-accent z-10"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
        {index + 1}
      </span>
      <div className="flex-1">
        <p className="font-medium">{subject.name}</p>
        <p className="text-sm text-muted-foreground">{subject.code}</p>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const { preference, savePreference } = usePreferences(user?.id);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize order from saved preference or all subjects
  useState(() => {
    if (preference?.subject_ids?.length) {
      setOrderedIds(preference.subject_ids);
    } else if (subjects.length) {
      setOrderedIds(subjects.map(s => s.id));
    }
  });

  // Update when subjects load
  if (orderedIds.length === 0 && subjects.length > 0) {
    const initialIds = preference?.subject_ids?.length 
      ? preference.subject_ids 
      : subjects.map(s => s.id);
    setOrderedIds(initialIds);
  }

  const orderedSubjects = orderedIds
    .map(id => subjects.find(s => s.id === id))
    .filter((s): s is Subject => !!s);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedIds.indexOf(active.id as string);
      const newIndex = orderedIds.indexOf(over.id as string);
      setOrderedIds(arrayMove(orderedIds, oldIndex, newIndex));
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await savePreference.mutateAsync({ teacherId: user.id, subjectIds: orderedIds });
    setIsSaving(false);
    setHasChanges(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold">My Preferences</h1>
            <p className="text-muted-foreground">Drag to reorder your subject preferences</p>
          </div>
          <Button onClick={handleSave} variant="accent" disabled={isSaving || !hasChanges}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {preference && !hasChanges && (
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Preferences saved on {new Date(preference.updated_at).toLocaleDateString()}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Ranked Subjects</CardTitle>
            <CardDescription>Higher position = higher preference</CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {orderedSubjects.map((subject, index) => (
                    <SortableSubject key={subject.id} subject={subject} index={index} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
