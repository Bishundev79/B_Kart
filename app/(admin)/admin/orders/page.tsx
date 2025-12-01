'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminStore } from '@/stores/adminStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AdminOrderListItem } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: RefreshCw,
};

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { 
    orders, 
    ordersLoading, 
    ordersPagination,
    fetchOrders, 
    updateOrderStatus 
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderListItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (search) filters.search = search;
    if (statusFilter !== 'all') filters.status = statusFilter;
    
    fetchOrders(filters);
  }, [fetchOrders, search, statusFilter]);

  const handlePageChange = (page: number) => {
    const filters: Record<string, string> = { page: page.toString() };
    if (search) filters.search = search;
    if (statusFilter !== 'all') filters.status = statusFilter;
    fetchOrders(filters);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: 'Order updated',
        description: `Order status changed to ${newStatus}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const viewDetails = (order: AdminOrderListItem) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'pending':
        return ['processing', 'cancelled'];
      case 'processing':
        return ['shipped', 'cancelled'];
      case 'shipped':
        return ['delivered'];
      case 'delivered':
        return ['refunded'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View and manage platform orders</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Object.entries(statusColors).map(([status, color]) => {
          const Icon = statusIcons[status];
          const count = orders.filter(o => o.status === status).length;
          return (
            <Card key={status} className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter(status)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('-800', '-100')}`}>
                    <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-').replace('-100', '-600')}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            {ordersPagination.total} total orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => {
                        const StatusIcon = statusIcons[order.status] || ShoppingCart;
                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              <span className="font-mono text-sm">{order.orderNumber}</span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.customerName}</div>
                                <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>{order.itemsCount} items</TableCell>
                            <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[order.status]} variant="secondary">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => viewDetails(order)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {getNextStatuses(order.status).length > 0 && (
                                  <Select
                                    value=""
                                    onValueChange={(value) => handleStatusChange(order.id, value)}
                                    disabled={updatingStatus}
                                  >
                                    <SelectTrigger className="w-28 h-8">
                                      <SelectValue placeholder="Update" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getNextStatuses(order.status).map((status) => (
                                        <SelectItem key={status} value={status}>
                                          {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {ordersPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((ordersPagination.page - 1) * ordersPagination.limit) + 1} to{' '}
                    {Math.min(ordersPagination.page * ordersPagination.limit, ordersPagination.total)} of{' '}
                    {ordersPagination.total} orders
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(ordersPagination.page - 1)}
                      disabled={ordersPagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {ordersPagination.page} of {ordersPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(ordersPagination.page + 1)}
                      disabled={ordersPagination.page === ordersPagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedOrder.status]} variant="secondary">
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment</Label>
                  <Badge variant={selectedOrder.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground">Order Summary</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Items ({selectedOrder.itemsCount})</span>
                    <span>${(selectedOrder.total - (selectedOrder.shippingCost || 0)).toFixed(2)}</span>
                  </div>
                  {selectedOrder.shippingCost && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span>${selectedOrder.shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground">Vendor</Label>
                <p className="font-medium">{selectedOrder.vendorName}</p>
              </div>

              {selectedOrder.shippingAddress && (
                <div className="pt-4 border-t">
                  <Label className="text-muted-foreground">Shipping Address</Label>
                  <p className="mt-1 whitespace-pre-line">
                    {typeof selectedOrder.shippingAddress === 'string' 
                      ? selectedOrder.shippingAddress 
                      : JSON.stringify(selectedOrder.shippingAddress, null, 2)}
                  </p>
                </div>
              )}

              {getNextStatuses(selectedOrder.status).length > 0 && (
                <div className="pt-4 border-t flex gap-2">
                  {getNextStatuses(selectedOrder.status).map((status) => (
                    <Button
                      key={status}
                      variant={status === 'cancelled' ? 'destructive' : 'default'}
                      onClick={() => {
                        handleStatusChange(selectedOrder.id, status);
                        setShowDetailsDialog(false);
                      }}
                      disabled={updatingStatus}
                    >
                      Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
