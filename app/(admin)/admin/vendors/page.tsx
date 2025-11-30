'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminStore } from '@/stores/adminStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Store,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Ban,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { AdminVendorListItem } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800',
};

export default function AdminVendorsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { 
    vendors, 
    vendorsLoading, 
    vendorsPagination,
    fetchVendors, 
    updateVendorStatus 
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [selectedVendor, setSelectedVendor] = useState<AdminVendorListItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (search) filters.search = search;
    if (statusFilter !== 'all') filters.status = statusFilter;
    
    fetchVendors(filters);
  }, [fetchVendors, search, statusFilter]);

  const handlePageChange = (page: number) => {
    const filters: Record<string, string> = { page: page.toString() };
    if (search) filters.search = search;
    if (statusFilter !== 'all') filters.status = statusFilter;
    fetchVendors(filters);
  };

  const openActionDialog = (vendor: AdminVendorListItem, action: 'approve' | 'reject' | 'suspend') => {
    setSelectedVendor(vendor);
    setActionType(action);
    setRejectionReason('');
    setShowActionDialog(true);
  };

  const handleAction = async () => {
    if (!selectedVendor || !actionType) return;

    try {
      await updateVendorStatus(
        selectedVendor.id, 
        actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'suspended',
        actionType === 'reject' ? rejectionReason : undefined
      );
      toast({
        title: `Vendor ${actionType}ed`,
        description: `${selectedVendor.storeName} has been ${actionType}ed`,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to ${actionType} vendor`,
        variant: 'destructive',
      });
    } finally {
      setShowActionDialog(false);
      setSelectedVendor(null);
      setActionType(null);
      setRejectionReason('');
    }
  };

  const viewDetails = (vendor: AdminVendorListItem) => {
    setSelectedVendor(vendor);
    setShowDetailsDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendors</h1>
        <p className="text-muted-foreground">Manage vendor applications and stores</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Store className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {vendors.filter(v => v.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {vendors.filter(v => v.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {vendors.filter(v => v.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Ban className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold">
                  {vendors.filter(v => v.status === 'suspended').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vendors</CardTitle>
          <CardDescription>
            {vendorsPagination.total} total vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by store name..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {vendorsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
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
                      <TableHead>Store</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No vendors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {vendor.logoUrl ? (
                                <img
                                  src={vendor.logoUrl}
                                  alt={vendor.storeName}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                  <Store className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{vendor.storeName}</div>
                                <div className="text-sm text-muted-foreground">{vendor.ownerEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[vendor.status]} variant="secondary">
                              {vendor.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{vendor.productsCount}</TableCell>
                          <TableCell>${vendor.totalRevenue.toLocaleString()}</TableCell>
                          <TableCell>
                            {vendor.rating ? (
                              <span className="flex items-center gap-1">
                                ⭐ {vendor.rating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(vendor.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewDetails(vendor)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {vendor.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => openActionDialog(vendor, 'approve')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => openActionDialog(vendor, 'reject')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {vendor.status === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => openActionDialog(vendor, 'suspend')}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                              {vendor.status === 'suspended' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => openActionDialog(vendor, 'approve')}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {vendorsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((vendorsPagination.page - 1) * vendorsPagination.limit) + 1} to{' '}
                    {Math.min(vendorsPagination.page * vendorsPagination.limit, vendorsPagination.total)} of{' '}
                    {vendorsPagination.total} vendors
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(vendorsPagination.page - 1)}
                      disabled={vendorsPagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {vendorsPagination.page} of {vendorsPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(vendorsPagination.page + 1)}
                      disabled={vendorsPagination.page === vendorsPagination.totalPages}
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

      {/* Vendor Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>
              Full information about this vendor
            </DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {selectedVendor.logoUrl ? (
                  <img
                    src={selectedVendor.logoUrl}
                    alt={selectedVendor.storeName}
                    className="h-20 w-20 rounded object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded bg-muted flex items-center justify-center">
                    <Store className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedVendor.storeName}</h3>
                  <p className="text-muted-foreground">{selectedVendor.storeDescription || 'No description'}</p>
                  <Badge className={statusColors[selectedVendor.status]} variant="secondary">
                    {selectedVendor.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">Owner Email</Label>
                  <p className="font-medium">{selectedVendor.ownerEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium">
                    {new Date(selectedVendor.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Products</Label>
                  <p className="font-medium">{selectedVendor.productsCount}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Revenue</Label>
                  <p className="font-medium">${selectedVendor.totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rating</Label>
                  <p className="font-medium">
                    {selectedVendor.rating ? `⭐ ${selectedVendor.rating.toFixed(1)}` : 'No ratings'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Commission Rate</Label>
                  <p className="font-medium">{selectedVendor.commissionRate}%</p>
                </div>
              </div>

              {selectedVendor.status === 'approved' && (
                <div className="pt-4 border-t">
                  <Button asChild variant="outline">
                    <a href={`/vendor/${selectedVendor.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Store Page
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Vendor'}
              {actionType === 'reject' && 'Reject Vendor'}
              {actionType === 'suspend' && 'Suspend Vendor'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && `Are you sure you want to approve ${selectedVendor?.storeName}?`}
              {actionType === 'reject' && `Please provide a reason for rejecting ${selectedVendor?.storeName}.`}
              {actionType === 'suspend' && `Are you sure you want to suspend ${selectedVendor?.storeName}? Their products will be hidden.`}
            </DialogDescription>
          </DialogHeader>
          
          {actionType === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason..."
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={actionType === 'reject' && !rejectionReason.trim()}
            >
              {actionType === 'approve' && 'Approve'}
              {actionType === 'reject' && 'Reject'}
              {actionType === 'suspend' && 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
