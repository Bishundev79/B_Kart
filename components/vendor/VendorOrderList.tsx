'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Eye,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
} from 'lucide-react';
import { useVendorStore } from '@/stores/vendorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { VendorOrderFilters } from '@/types/vendor';
import type { OrderItemStatus } from '@/types/database';

const statusConfig: Record<OrderItemStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  confirmed: { label: 'Confirmed', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'default' },
  shipped: { label: 'Shipped', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'destructive' },
};

export function VendorOrderList() {
  const {
    orders,
    ordersLoading,
    ordersPagination,
    ordersStats,
    fetchOrders,
    error,
  } = useVendorStore();

  const [filters, setFilters] = useState<VendorOrderFilters>({
    status: 'all',
    search: '',
    page: 1,
    perPage: 20,
  });

  useEffect(() => {
    fetchOrders(filters);
  }, [filters, fetchOrders]);

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status as VendorOrderFilters['status'],
      page: 1,
    }));
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Stats Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.status === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('all')}
        >
          All Orders
          <Badge variant="secondary" className="ml-2">
            {Object.values(ordersStats).reduce((a, b) => a + b, 0)}
          </Badge>
        </Button>
        <Button
          variant={filters.status === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('pending')}
        >
          Pending
          <Badge variant="secondary" className="ml-2">
            {ordersStats.pending}
          </Badge>
        </Button>
        <Button
          variant={filters.status === 'processing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('processing')}
        >
          Processing
          <Badge variant="secondary" className="ml-2">
            {ordersStats.processing}
          </Badge>
        </Button>
        <Button
          variant={filters.status === 'shipped' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('shipped')}
        >
          Shipped
          <Badge variant="secondary" className="ml-2">
            {ordersStats.shipped}
          </Badge>
        </Button>
        <Button
          variant={filters.status === 'delivered' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('delivered')}
        >
          Delivered
          <Badge variant="secondary" className="ml-2">
            {ordersStats.delivered}
          </Badge>
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search by order number..."
            className="pl-10"
            defaultValue={filters.search}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.order_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {order.product_image ? (
                        <Image
                          src={order.product_image}
                          alt={order.product_name}
                          width={32}
                          height={32}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="truncate max-w-[150px]">
                        {order.product_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="truncate max-w-[120px]">
                      {order.customer_name || order.customer_email}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{order.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[order.status]?.variant || 'outline'}>
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(order.order_created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/vendor/dashboard/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View order</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {ordersPagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(ordersPagination.page - 1) * ordersPagination.perPage + 1} to{' '}
            {Math.min(ordersPagination.page * ordersPagination.perPage, ordersPagination.total)} of{' '}
            {ordersPagination.total} orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(ordersPagination.page - 1)}
              disabled={ordersPagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {ordersPagination.page} of {ordersPagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(ordersPagination.page + 1)}
              disabled={ordersPagination.page >= ordersPagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
