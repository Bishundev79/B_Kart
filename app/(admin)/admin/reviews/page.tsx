'use client';

import { useEffect, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Eye,
  ExternalLink,
  Flag,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { AdminReviewListItem } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  flagged: 'bg-orange-100 text-orange-800',
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  flagged: Flag,
};

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { 
    reviews, 
    reviewsLoading, 
    reviewsPagination,
    fetchReviews, 
    updateReviewStatus 
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [selectedReview, setSelectedReview] = useState<AdminReviewListItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (search) filters.search = search;
    if (statusFilter !== 'all') filters.status = statusFilter;
    
    fetchReviews(filters);
  }, [fetchReviews, search, statusFilter]);

  const handlePageChange = (page: number) => {
    const filters: Record<string, string> = { page: page.toString() };
    if (search) filters.search = search;
    if (statusFilter !== 'all') filters.status = statusFilter;
    fetchReviews(filters);
  };

  const handleStatusChange = async (reviewId: string, newStatus: 'approved' | 'rejected' | 'flagged') => {
    setUpdatingStatus(true);
    try {
      await updateReviewStatus(reviewId, newStatus);
      toast({
        title: 'Review updated',
        description: `Review status changed to ${newStatus}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update review status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const viewDetails = (review: AdminReviewListItem) => {
    setSelectedReview(review);
    setShowDetailsDialog(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Moderate product reviews</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {reviews.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {reviews.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {reviews.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('flagged')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flag className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flagged</p>
                <p className="text-2xl font-bold">
                  {reviews.filter(r => r.status === 'flagged').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>
            {reviewsPagination.total} total reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
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
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full" />
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
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No reviews found
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviews.map((review) => {
                        const StatusIcon = statusIcons[review.status as keyof typeof statusIcons] || Clock;
                        return (
                          <TableRow key={review.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={review.userAvatarUrl || undefined} />
                                  <AvatarFallback>
                                    {review.userName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{review.userName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Link 
                                href={`/products/${review.productSlug}`}
                                className="hover:underline"
                                target="_blank"
                              >
                                {review.productName}
                              </Link>
                            </TableCell>
                            <TableCell>{renderStars(review.rating)}</TableCell>
                            <TableCell className="max-w-xs">
                              <p className="truncate">{review.comment || 'No comment'}</p>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[review.status as keyof typeof statusColors]} variant="secondary">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {review.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => viewDetails(review)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {review.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleStatusChange(review.id, 'approved')}
                                      disabled={updatingStatus}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleStatusChange(review.id, 'rejected')}
                                      disabled={updatingStatus}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {review.status !== 'flagged' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    onClick={() => handleStatusChange(review.id, 'flagged')}
                                    disabled={updatingStatus}
                                  >
                                    <Flag className="h-4 w-4" />
                                  </Button>
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
              {reviewsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((reviewsPagination.page - 1) * reviewsPagination.limit) + 1} to{' '}
                    {Math.min(reviewsPagination.page * reviewsPagination.limit, reviewsPagination.total)} of{' '}
                    {reviewsPagination.total} reviews
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(reviewsPagination.page - 1)}
                      disabled={reviewsPagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {reviewsPagination.page} of {reviewsPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(reviewsPagination.page + 1)}
                      disabled={reviewsPagination.page === reviewsPagination.totalPages}
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

      {/* Review Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              Full review information
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={selectedReview.userAvatarUrl || undefined} />
                  <AvatarFallback>
                    {selectedReview.userName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{selectedReview.userName}</h4>
                    <Badge className={statusColors[selectedReview.status as keyof typeof statusColors]} variant="secondary">
                      {selectedReview.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Link 
                    href={`/products/${selectedReview.productSlug}`}
                    className="font-medium hover:underline flex items-center gap-1"
                    target="_blank"
                  >
                    {selectedReview.productName}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  {renderStars(selectedReview.rating)}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Review Comment</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedReview.comment || 'No comment provided'}
                </p>
              </div>

              {selectedReview.verifiedPurchase && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Verified Purchase</span>
                </div>
              )}

              <DialogFooter className="pt-4 border-t">
                {selectedReview.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleStatusChange(selectedReview.id, 'rejected');
                        setShowDetailsDialog(false);
                      }}
                      disabled={updatingStatus}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        handleStatusChange(selectedReview.id, 'approved');
                        setShowDetailsDialog(false);
                      }}
                      disabled={updatingStatus}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                {selectedReview.status !== 'flagged' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleStatusChange(selectedReview.id, 'flagged');
                      setShowDetailsDialog(false);
                    }}
                    disabled={updatingStatus}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Review
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
