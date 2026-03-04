'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SelectionsReview from '@/components/admin/selections-review';
import AllocationsTable from '@/components/admin/allocations-table';
import AllocationStats from '@/components/admin/allocation-stats';

export default function AllocationsPage() {
  const { selections, allocations, teachers, subjects } = useData();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-white p-6">
        <h1 className="text-3xl font-bold text-primary">Allocations & Selections</h1>
        <p className="text-muted-foreground mt-1">Review teacher selections and manage allocations</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Stats */}
          <AllocationStats
            totalSelections={selections.length}
            pendingSelections={selections.filter(s => s.status === 'pending').length}
            submittedSelections={selections.filter(s => s.status === 'submitted').length}
            allocations={allocations}
          />

          {/* Tabs */}
          <Card className="border border-border shadow-sm">
            <Tabs defaultValue="selections" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-white p-0">
                <TabsTrigger
                  value="selections"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Teacher Selections ({selections.length})
                </TabsTrigger>
                <TabsTrigger
                  value="allocations"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Final Allocations ({allocations.length})
                </TabsTrigger>
              </TabsList>

              <CardContent className="p-0">
                <TabsContent value="selections" className="m-0">
                  <SelectionsReview selections={selections} teachers={teachers} subjects={subjects} />
                </TabsContent>

                <TabsContent value="allocations" className="m-0">
                  <AllocationsTable allocations={allocations} teachers={teachers} subjects={subjects} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
