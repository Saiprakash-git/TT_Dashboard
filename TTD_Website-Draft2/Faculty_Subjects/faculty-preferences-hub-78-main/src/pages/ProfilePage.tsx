import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [designation, setDesignation] = useState(profile?.designation || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        department: department.trim() || null,
        designation: designation.trim() || null,
        phone: phone.trim() || null,
      })
      .eq('id', profile.id);

    setIsLoading(false);

    if (error) {
      toast.error(`Failed to update profile: ${error.message}`);
    } else {
      toast.success('Profile updated successfully');
      refreshProfile();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="space-y-1 mb-6">
          <h1 className="text-3xl font-serif font-semibold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle>{profile?.full_name}</CardTitle>
                <CardDescription>{profile?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Associate Professor"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" variant="accent" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
