'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useVendorStore } from '@/stores/vendorStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { PayoutStatus } from '@/types/database';

const statusConfig: Record<PayoutStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  processing: { label: 'Processing', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export function PayoutHistory() {
  const {
    payouts,
    payoutSummary,
    payoutsLoading,
    payoutsPagination,
    payoutConnect,
    payoutActionLoading,
    fetchPayouts,
    initiatePayoutOnboarding,
    error,
  } = useVendorStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handlePageChange = (page: number) => {
    fetchPayouts(page);
  };

  const handleConnectClick = async () => {
    const url = await initiatePayoutOnboarding();
    if (url) {
      window.location.href = url;
      return;
    }

    toast({
      title: 'Unable to reach Stripe',
      description: 'Please try again in a moment.',
      variant: 'destructive',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const connectNeedsAttention =
    !payoutConnect?.stripeAccountId || !payoutConnect?.onboardingComplete;
  const requirements = payoutConnect?.requirementsDue ?? [];

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">
              {connectNeedsAttention ? 'Finish Stripe onboarding' : 'Stripe Connect is ready'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {connectNeedsAttention
                ? 'Set up your Stripe Express account to receive payouts directly to your bank account.'
                : 'Review transfers, tax information, and payouts from your Stripe dashboard.'}
            </p>
          </div>
          <Badge variant={connectNeedsAttention ? 'destructive' : 'secondary'}>
            {connectNeedsAttention ? 'Action required' : 'Connected'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectNeedsAttention && requirements.length > 0 && (
            <div className="rounded-md border border-dashed p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Pending requirements
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {requirements.map((req) => (
                  <li key={req}>{req.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleConnectClick} disabled={payoutActionLoading}>
              {payoutActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {connectNeedsAttention ? 'Complete Stripe Setup' : 'Open Stripe Dashboard'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Powered by Stripe Connect. You will be redirected to a secure Stripe page.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(payoutSummary?.pendingAmount || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Available for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(payoutSummary?.processingAmount || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Being transferred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(payoutSummary?.paidThisMonth || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Received this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(payoutSummary?.totalPaid || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No payouts yet</p>
                      <p className="text-sm text-muted-foreground">
                        Payouts are processed after orders are delivered
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => {
                  const grossAmount = payout.amount + payout.commission_amount;
                  return (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(payout.period_start), 'MMM d')} -{' '}
                          {format(new Date(payout.period_end), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{payout.items_count}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(grossAmount)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        -{formatCurrency(payout.commission_amount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payout.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[payout.status]?.variant || 'outline'}>
                          {statusConfig[payout.status]?.label || payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payout.processed_at
                          ? format(new Date(payout.processed_at), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {payoutsPagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(payoutsPagination.page - 1) * payoutsPagination.perPage + 1} to{' '}
                {Math.min(
                  payoutsPagination.page * payoutsPagination.perPage,
                  payoutsPagination.total
                )}{' '}
                of {payoutsPagination.total} payouts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(payoutsPagination.page - 1)}
                  disabled={payoutsPagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {payoutsPagination.page} of {payoutsPagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(payoutsPagination.page + 1)}
                  disabled={payoutsPagination.page >= payoutsPagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
