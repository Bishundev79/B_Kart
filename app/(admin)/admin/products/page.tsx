'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { AdminProductListItem } from '@/types/admin';
import type { ProductStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<ProductStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  out_of_stock: 'bg-orange-100 text-orange-800',
  archived: 'bg-red-100 text-red-800',
};

export default function AdminProductsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { 
    products, 
    productsLoading, 
    productsPagination,
    fetchProducts, 
    updateProductStatus 
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [selectedProduct, setSelectedProduct] = useState<AdminProductListItem | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'active' | 'inactive' | 'archived' | null>(null);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (search) filters.search = search;
    if (statusFilter !== 'all') filters.status = statusFilter;
    
    fetchProducts(filters);
  }, [fetchProducts, search, statusFilter]);

  const handlePageChange = (page: number) => {
    const filters: Record<string, string> = { page: page.toString() };
    if (search) filters.search = search;
    if (statusFilter !== 'all') filters.status = statusFilter;
    fetchProducts(filters);
  };

  const openActionDialog = (product: AdminProductListItem, action: 'active' | 'inactive' | 'archived') => {
    setSelectedProduct(product);
    setActionType(action);
    setShowActionDialog(true);
  };

  const handleAction = async () => {
    if (!selectedProduct || !actionType) return;

    try {
      await updateProductStatus(selectedProduct.id, actionType);
      toast({
        title: 'Product updated',
        description: `${selectedProduct.name} status changed to ${actionType}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update product status',
        variant: 'destructive',
      });
    } finally {
      setShowActionDialog(false);
      setSelectedProduct(null);
      setActionType(null);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'active': return 'Activate';
      case 'inactive': return 'Deactivate';
      case 'archived': return 'Archive';
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground">Manage and moderate platform products</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <EyeOff className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'inactive').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'draft').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'archived').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {productsPagination.total} total products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product name..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {productsLoading ? (
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
                      <TableHead>Product</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.categoryName}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{product.vendorName}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[product.status]} variant="secondary">
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={product.stock < 10 ? 'text-red-600 font-medium' : ''}>
                              {product.stock}
                            </span>
                          </TableCell>
                          <TableCell>{product.salesCount}</TableCell>
                          <TableCell>
                            {product.rating ? (
                              <span className="flex items-center gap-1">
                                ⭐ {product.rating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/products/${product.slug}`} target="_blank">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Product
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openActionDialog(product, 'active')}
                                  disabled={product.status === 'active'}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openActionDialog(product, 'inactive')}
                                  disabled={product.status === 'inactive'}
                                >
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openActionDialog(product, 'archived')}
                                  disabled={product.status === 'archived'}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {productsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((productsPagination.page - 1) * productsPagination.limit) + 1} to{' '}
                    {Math.min(productsPagination.page * productsPagination.limit, productsPagination.total)} of{' '}
                    {productsPagination.total} products
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(productsPagination.page - 1)}
                      disabled={productsPagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {productsPagination.page} of {productsPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(productsPagination.page + 1)}
                      disabled={productsPagination.page === productsPagination.totalPages}
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

      {/* Action Confirmation Dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionType && getActionLabel(actionType)} Product</AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'active' && `This will make "${selectedProduct?.name}" visible to customers.`}
              {actionType === 'inactive' && `This will hide "${selectedProduct?.name}" from customers.`}
              {actionType === 'archived' && `This will archive "${selectedProduct?.name}". It will no longer be visible or purchasable.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === 'archived' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {actionType && getActionLabel(actionType)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
