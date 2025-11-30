'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProductStore } from '@/stores/productStore';
import {
  createProductVariantSchema,
  type CreateProductVariantData,
} from '@/lib/validations/product';
import type { ProductVariant } from '@/types/database';

interface VariantManagerProps {
  productId: string;
  variants: ProductVariant[];
  onVariantsChange: () => void;
}

export function VariantManager({
  productId,
  variants,
  onVariantsChange,
}: VariantManagerProps) {
  const { toast } = useToast();
  const { addProductVariant, updateProductVariant, deleteProductVariant } =
    useProductStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<CreateProductVariantData>({
    resolver: zodResolver(createProductVariantSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: undefined,
      quantity: 0,
      options: {},
    },
  });

  const handleOpenDialog = (variant?: ProductVariant) => {
    if (variant) {
      setEditingVariant(variant);
      form.reset({
        name: variant.name,
        sku: variant.sku || '',
        price: variant.price || undefined,
        quantity: variant.quantity,
        options: (variant.options as Record<string, string>) || {},
      });
    } else {
      setEditingVariant(null);
      form.reset({
        name: '',
        sku: '',
        price: undefined,
        quantity: 0,
        options: {},
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVariant(null);
    form.reset();
  };

  const onSubmit = async (data: CreateProductVariantData) => {
    setLoading(true);

    try {
      let result;
      if (editingVariant) {
        result = await updateProductVariant(productId, editingVariant.id, data);
      } else {
        result = await addProductVariant(productId, data);
      }

      if (result.success) {
        toast({
          title: editingVariant ? 'Variant updated' : 'Variant added',
          description: editingVariant
            ? 'The variant has been updated successfully.'
            : 'The variant has been added successfully.',
        });
        handleCloseDialog();
        onVariantsChange();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Something went wrong.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    const result = await deleteProductVariant(productId, deleteId);
    setDeleting(false);
    setDeleteId(null);

    if (result.success) {
      toast({
        title: 'Variant deleted',
        description: 'The variant has been removed.',
      });
      onVariantsChange();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete variant.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>
            Add variants for different sizes, colors, or other options.
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">No variants yet.</p>
            <p className="text-sm text-muted-foreground">
              Add variants if your product comes in different sizes, colors, etc.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.name}</TableCell>
                  <TableCell>{variant.sku || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {variant.options &&
                        Object.entries(variant.options as Record<string, string>).map(
                          ([key, value]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {key}: {value}
                            </Badge>
                          )
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {variant.price ? `$${variant.price.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        variant.quantity === 0 ? 'text-destructive' : ''
                      }
                    >
                      {variant.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(variant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(variant.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add/Edit Variant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? 'Edit Variant' : 'Add Variant'}
            </DialogTitle>
            <DialogDescription>
              {editingVariant
                ? 'Update the variant details below.'
                : 'Enter the details for the new variant.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Small, Red, 128GB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Variant SKU" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Override</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Leave empty to use product price"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Simple Options Input */}
              <VariantOptionsInput
                options={(form.watch('options') as Record<string, string>) || {}}
                onChange={(options) => form.setValue('options', options)}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingVariant ? 'Update' : 'Add'} Variant
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the variant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

interface VariantOptionsInputProps {
  options: Record<string, string>;
  onChange: (options: Record<string, string>) => void;
}

function VariantOptionsInput({ options, onChange }: VariantOptionsInputProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      onChange({ ...options, [newKey.trim()]: newValue.trim() });
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemove = (key: string) => {
    const { [key]: _, ...rest } = options;
    onChange(rest);
  };

  return (
    <div className="space-y-3">
      <FormLabel>Options (e.g., Size: Large, Color: Red)</FormLabel>
      <div className="flex gap-2">
        <Input
          placeholder="Option name"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1"
        />
        <Button type="button" variant="secondary" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {Object.keys(options).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(options).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="gap-1 pr-1">
              {key}: {value}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(key)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
