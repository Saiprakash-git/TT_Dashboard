import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function RecentActivityCard() {
  const activities = [
    {
      id: 1,
      type: 'selection',
      teacher: 'Prof. Sarah Chen',
      action: 'submitted subject selections',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'teacher_added',
      teacher: 'Dr. James Wilson',
      action: 'has been registered',
      time: '1 day ago'
    },
    {
      id: 3,
      type: 'allocation',
      teacher: 'Prof. Maria Garcia',
      action: 'has been assigned subjects',
      time: '3 days ago'
    },
    {
      id: 4,
      type: 'selection',
      teacher: 'Dr. Robert Kumar',
      action: 'submitted subject selections',
      time: '5 days ago'
    },
  ];

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest actions in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 py-3 border-b border-border last:border-0 last:pb-0">
              <div className="flex-shrink-0 mt-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activity.teacher} <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
