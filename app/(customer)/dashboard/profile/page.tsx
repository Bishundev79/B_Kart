import { ProfileForm } from '@/components/dashboard';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>
      
      <ProfileForm />
    </div>
  );
}
