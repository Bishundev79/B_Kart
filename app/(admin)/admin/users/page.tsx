'use client';

import { useEffect, useState } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MoreVertical, UserCircle, Shield, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminUserListItem } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  vendor: 'bg-purple-100 text-purple-800',
  customer: 'bg-blue-100 text-blue-800',
};

const roleIcons = {
  admin: Shield,
  vendor: Store,
  customer: UserCircle,
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { 
    users, 
    usersLoading, 
    usersPagination,
    fetchUsers, 
    updateUserRole 
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [newRole, setNewRole] = useState<'customer' | 'vendor' | 'admin' | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (search) filters.search = search;
    if (roleFilter !== 'all') filters.role = roleFilter;
    
    fetchUsers(filters);
  }, [fetchUsers, search, roleFilter]);

  const handlePageChange = (page: number) => {
    const filters: Record<string, string> = { page: page.toString() };
    if (search) filters.search = search;
    if (roleFilter !== 'all') filters.role = roleFilter;
    fetchUsers(filters);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await updateUserRole(selectedUser.id, newRole);
      toast({
        title: 'Role updated',
        description: `${selectedUser.email}'s role has been changed to ${newRole}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setShowRoleDialog(false);
      setSelectedUser(null);
      setNewRole(null);
    }
  };

  const openRoleDialog = (user: AdminUserListItem, role: 'customer' | 'vendor' | 'admin') => {
    setSelectedUser(user);
    setNewRole(role);
    setShowRoleDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage platform users and their roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {usersPagination.total} total users on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {usersLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
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
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Spent</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => {
                        const RoleIcon = roleIcons[user.role];
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={user.avatarUrl || undefined} />
                                  <AvatarFallback>
                                    {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.fullName || 'No name'}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={roleColors[user.role]} variant="secondary">
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.ordersCount}</TableCell>
                            <TableCell>${user.totalSpent.toFixed(2)}</TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openRoleDialog(user, 'customer')}
                                    disabled={user.role === 'customer'}
                                  >
                                    <UserCircle className="h-4 w-4 mr-2" />
                                    Set as Customer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openRoleDialog(user, 'vendor')}
                                    disabled={user.role === 'vendor'}
                                  >
                                    <Store className="h-4 w-4 mr-2" />
                                    Set as Vendor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openRoleDialog(user, 'admin')}
                                    disabled={user.role === 'admin'}
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Set as Admin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {usersPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((usersPagination.page - 1) * usersPagination.limit) + 1} to{' '}
                    {Math.min(usersPagination.page * usersPagination.limit, usersPagination.total)} of{' '}
                    {usersPagination.total} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(usersPagination.page - 1)}
                      disabled={usersPagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {usersPagination.page} of {usersPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(usersPagination.page + 1)}
                      disabled={usersPagination.page === usersPagination.totalPages}
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

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {selectedUser?.email}&apos;s role from{' '}
              <strong>{selectedUser?.role}</strong> to <strong>{newRole}</strong>?
              {newRole === 'admin' && (
                <span className="block mt-2 text-destructive">
                  Warning: This will give the user full administrative access.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
