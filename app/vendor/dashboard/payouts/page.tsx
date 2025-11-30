import { Metadata } from 'next';
import { PayoutHistory } from '@/components/vendor';

export const metadata: Metadata = {
  title: 'Payouts | Vendor Dashboard',
  description: 'View your payout history and earnings.',
};

export default function VendorPayoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
        <p className="text-muted-foreground">
          Track your earnings and payout history.
        </p>
      </div>

      <PayoutHistory />
    </div>
  );
}
