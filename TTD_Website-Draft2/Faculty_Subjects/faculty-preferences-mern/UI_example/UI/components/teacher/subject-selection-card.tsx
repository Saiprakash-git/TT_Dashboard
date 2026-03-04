'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Card, CardContent } from '@/components/ui/card';
import { Subject } from '@/lib/data-context';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';

interface SubjectSelectionCardProps {
  subject: Subject;
  isSelected: boolean;
  teacherId: string;
  selectionId?: string;
}

export default function SubjectSelectionCard({
  subject,
  isSelected,
  teacherId,
  selectionId,
}: SubjectSelectionCardProps) {
  const { submitSelection, updateSelection, selections } = useData();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleSelection = async () => {
    setIsToggling(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (selectionId && isSelected) {
        // Remove subject from selection
        const selection = selections.find(s => s.id === selectionId);
        if (selection) {
          const updatedSubjects = selection.selectedSubjects.filter(id => id !== subject.id);
          updateSelection(selectionId, {
            selectedSubjects: updatedSubjects,
          });
        }
      } else if (selectionId && !isSelected) {
        // Add subject to existing selection
        const selection = selections.find(s => s.id === selectionId);
        if (selection) {
          const updatedSubjects = [...selection.selectedSubjects, subject.id];
          updateSelection(selectionId, {
            selectedSubjects: updatedSubjects,
          });
        }
      } else if (!selectionId && !isSelected) {
        // Create new selection with this subject
        submitSelection({
          teacherId,
          semesterId: 'semester-1',
          selectedSubjects: [subject.id],
          preferences: [subject.id],
          status: 'pending',
        });
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card className={`border-2 transition-all cursor-pointer ${
      isSelected
        ? 'border-primary bg-primary/5'
        : 'border-border hover:border-primary/50'
    }`}>
      <CardContent className="pt-6 pb-6">
        <button
          onClick={handleToggleSelection}
          disabled={isToggling}
          className="w-full text-left space-y-4"
        >
          {/* Header with selection toggle */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{subject.name}</h3>
                  <p className="text-sm text-primary font-medium mt-0.5">{subject.code}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground">{subject.description}</p>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-sm font-medium text-foreground">{subject.department}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Semester</p>
              <p className="text-sm font-medium text-foreground">Sem {subject.semester}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Credits</p>
              <p className="text-sm font-medium text-foreground">{subject.credits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Capacity</p>
              <p className="text-sm font-medium text-foreground">{subject.maxCapacity}</p>
            </div>
          </div>

          {/* Selection Status */}
          {isSelected && (
            <div className="pt-2 border-t border-border/50">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                ✓ Selected
              </span>
            </div>
          )}
        </button>
      </CardContent>
    </Card>
  );
}
