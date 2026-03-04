import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  description: string;
}

export default function StatsCard({ icon: Icon, label, value, description }: StatsCardProps) {
  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold text-primary mt-2">{value}</p>
            </div>
            <Icon className="w-8 h-8 text-accent" />
          </div>
          <p className="text-xs text-muted-foreground pt-2">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
