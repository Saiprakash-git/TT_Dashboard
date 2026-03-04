import { Card, CardContent } from '@/components/ui/card';
import { Allocation } from '@/lib/data-context';
import { ClipboardList, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AllocationStatsProps {
  totalSelections: number;
  pendingSelections: number;
  submittedSelections: number;
  allocations: Allocation[];
}

export default function AllocationStats({
  totalSelections,
  pendingSelections,
  submittedSelections,
  allocations,
}: AllocationStatsProps) {
  const allocatedCount = allocations.filter(a => a.status === 'allocated').length;
  const pendingAllocations = allocations.filter(a => a.status === 'pending').length;

  const stats = [
    {
      icon: ClipboardList,
      label: 'Total Selections',
      value: totalSelections,
      color: 'text-blue-600',
    },
    {
      icon: Clock,
      label: 'Pending Selections',
      value: pendingSelections,
      color: 'text-orange-600',
    },
    {
      icon: CheckCircle,
      label: 'Submitted Selections',
      value: submittedSelections,
      color: 'text-green-600',
    },
    {
      icon: AlertCircle,
      label: 'Allocated Subjects',
      value: allocatedCount,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-primary mt-2">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
