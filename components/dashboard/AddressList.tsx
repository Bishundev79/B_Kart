'use client';

import { useEffect, useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { useProfileStore } from '@/stores/profileStore';
import { AddressForm } from './AddressForm';
import type { Address } from '@/types/database';

export function AddressList() {
  const { toast } = useToast();
  const {
    addresses,
    addressesLoading,
    fetchAddresses,
    deleteAddress,
    setDefaultAddress,
  } = useProfileStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(undefined);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    const result = await deleteAddress(deletingId);
    setDeletingId(null);

    if (result.success) {
      toast({
        title: 'Address deleted',
        description: 'The address has been removed from your account.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete address.',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (id: string, type: 'billing' | 'shipping') => {
    setSettingDefault(id);
    const result = await setDefaultAddress(id, type);
    setSettingDefault(null);

    if (result.success) {
      toast({
        title: 'Default address updated',
        description: 'This address is now your default.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to set default address.',
        variant: 'destructive',
      });
    }
  };

  const shippingAddresses = addresses.filter((a) => a.type === 'shipping');
  const billingAddresses = addresses.filter((a) => a.type === 'billing');

  const renderAddressCard = (address: Address) => (
    <Card key={address.id} className="relative">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{address.full_name}</p>
              {address.is_default && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="mr-1 h-3 w-3" />
                  Default
                </Badge>
              )}
            </div>
            {address.phone && (
              <p className="text-sm text-muted-foreground">{address.phone}</p>
            )}
            <p className="text-sm">{address.address_line1}</p>
            {address.address_line2 && (
              <p className="text-sm">{address.address_line2}</p>
            )}
            <p className="text-sm">
              {address.city}
              {address.state && `, ${address.state}`} {address.postal_code}
            </p>
            <p className="text-sm">{address.country}</p>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(address)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeletingId(address.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {!address.is_default && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => handleSetDefault(address.id, address.type)}
            disabled={settingDefault === address.id}
          >
            {settingDefault === address.id ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <Star className="mr-2 h-3 w-3" />
            )}
            Set as Default
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (addressesLoading && addresses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Shipping Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Addresses
            </CardTitle>
            <CardDescription>
              Manage where your orders will be delivered.
            </CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          {shippingAddresses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No shipping addresses saved. Add one to get started.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {shippingAddresses.map(renderAddressCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Billing Addresses
          </CardTitle>
          <CardDescription>
            Manage your billing addresses for payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingAddresses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No billing addresses saved. Add one for faster checkout.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {billingAddresses.map(renderAddressCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Form Dialog */}
      <AddressForm
        address={editingAddress}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => setEditingAddress(undefined)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AddressList;
