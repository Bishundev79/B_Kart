'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Package, Truck, CheckCircle } from 'lucide-react';
import { useVendorStore } from '@/stores/vendorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  updateOrderItemStatusSchema,
  addTrackingSchema,
  type UpdateOrderItemStatusData,
  type AddTrackingData,
} from '@/lib/validations/vendor';
import type { OrderItemStatus } from '@/types/database';

interface FulfillmentFormProps {
  orderId: string;
  currentStatus: OrderItemStatus;
  hasTracking: boolean;
}

// Carriers list
const carriers = [
  { value: 'usps', label: 'USPS' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL' },
  { value: 'amazon', label: 'Amazon Logistics' },
  { value: 'ontrac', label: 'OnTrac' },
  { value: 'other', label: 'Other' },
];

// Valid next statuses for vendor
const getNextStatuses = (current: OrderItemStatus): { value: string; label: string }[] => {
  switch (current) {
    case 'pending':
    case 'confirmed':
      return [{ value: 'processing', label: 'Start Processing' }];
    case 'processing':
      return [{ value: 'shipped', label: 'Mark as Shipped' }];
    case 'shipped':
      return [{ value: 'delivered', label: 'Mark as Delivered' }];
    default:
      return [];
  }
};

export function FulfillmentForm({ orderId, currentStatus, hasTracking }: FulfillmentFormProps) {
  const { updateOrderStatus, addTracking } = useVendorStore();
  const { toast } = useToast();
  const [statusLoading, setStatusLoading] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const nextStatuses = getNextStatuses(currentStatus);
  const canUpdateStatus = nextStatuses.length > 0;
  const canAddTracking = !['cancelled', 'refunded', 'delivered'].includes(currentStatus);

  // Status form
  const statusForm = useForm<UpdateOrderItemStatusData>({
    resolver: zodResolver(updateOrderItemStatusSchema),
    defaultValues: {
      status: nextStatuses[0]?.value as 'processing' | 'shipped' | 'delivered' | undefined,
    },
  });

  // Tracking form
  const trackingForm = useForm<AddTrackingData>({
    resolver: zodResolver(addTrackingSchema),
    defaultValues: {
      carrier: '',
      tracking_number: '',
      tracking_url: '',
      status: 'in_transit',
      status_details: '',
    },
  });

  const onStatusSubmit = async (data: UpdateOrderItemStatusData) => {
    setStatusLoading(true);
    const success = await updateOrderStatus(orderId, data);
    setStatusLoading(false);

    if (success) {
      toast({
        title: 'Status Updated',
        description: `Order status updated to ${data.status}`,
      });
      // Reset form with new next status if available
      const newNextStatuses = getNextStatuses(data.status as OrderItemStatus);
      if (newNextStatuses.length > 0) {
        statusForm.reset({ status: newNextStatuses[0].value as any });
      }
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const onTrackingSubmit = async (data: AddTrackingData) => {
    setTrackingLoading(true);
    const success = await addTracking(orderId, data);
    setTrackingLoading(false);

    if (success) {
      toast({
        title: 'Tracking Added',
        description: 'Tracking information has been added to the order',
      });
      trackingForm.reset();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to add tracking information',
        variant: 'destructive',
      });
    }
  };

  // If order is cancelled, refunded, or delivered - show message
  if (['cancelled', 'refunded'].includes(currentStatus)) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">
          This order has been {currentStatus} and cannot be modified.
        </p>
      </div>
    );
  }

  if (currentStatus === 'delivered') {
    return (
      <div className="text-center py-4">
        <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
        <p className="mt-2 font-medium">Order Delivered</p>
        <p className="text-sm text-muted-foreground">
          This order has been marked as delivered.
        </p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible defaultValue="status" className="w-full">
      {/* Update Status */}
      {canUpdateStatus && (
        <AccordionItem value="status">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Update Status
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Form {...statusForm}>
              <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4">
                <FormField
                  control={statusForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {nextStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={statusLoading}>
                  {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Status
                </Button>
              </form>
            </Form>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Add Tracking */}
      {canAddTracking && (
        <AccordionItem value="tracking">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Add Tracking
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Form {...trackingForm}>
              <form onSubmit={trackingForm.handleSubmit(onTrackingSubmit)} className="space-y-4">
                <FormField
                  control={trackingForm.control}
                  name="carrier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select carrier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {carriers.map((carrier) => (
                            <SelectItem key={carrier.value} value={carrier.value}>
                              {carrier.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={trackingForm.control}
                  name="tracking_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1Z999AA10123456784" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={trackingForm.control}
                  name="tracking_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://tracking.example.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={trackingForm.control}
                  name="status_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={trackingLoading}>
                  {trackingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Tracking
                </Button>
              </form>
            </Form>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
