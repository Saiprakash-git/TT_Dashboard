import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';
import api from '../utils/api';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    
    try {
      const result = await updateProfile({
        fullName: fullName.trim(),
        department: department.trim() || null,
        designation: designation.trim() || null,
        phone: phone.trim() || null,
      });

      if (!result?.success) {
        throw new Error(result?.error || 'Update failed');
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
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
                <CardTitle>{user?.fullName}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
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
                    value={user?.email || ''}
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
                      <Loader2 className="animate-spin w-4 h-4" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-medium mb-4">Change Password</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="secondary"
                  disabled={changingPassword || !currentPassword || !newPassword}
                  onClick={async () => {
                    try {
                      setChangingPassword(true);
                      const res = await api.put('/auth/change-password', { currentPassword, newPassword });
                      toast.success(res.data?.message || 'Password updated successfully');
                      setCurrentPassword('');
                      setNewPassword('');
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to update password');
                    } finally {
                      setChangingPassword(false);
                    }
                  }}
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
