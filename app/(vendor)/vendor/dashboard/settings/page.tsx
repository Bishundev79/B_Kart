import { Metadata } from 'next';
import { VendorSettingsForm } from '@/components/vendor';

export const metadata: Metadata = {
  title: 'Store Settings | Vendor Dashboard',
  description: 'Manage your store settings and preferences.',
};

export default function VendorSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
        <p className="text-muted-foreground">
          Manage your store information and preferences.
        </p>
      </div>

      <VendorSettingsForm />
    </div>
  );
}
