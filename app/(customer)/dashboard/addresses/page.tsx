import { AddressList } from '@/components/dashboard';

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Addresses</h2>
        <p className="text-muted-foreground">
          Manage your shipping and billing addresses.
        </p>
      </div>
      
      <AddressList />
    </div>
  );
}
