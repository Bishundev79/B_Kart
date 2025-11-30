'use client';

import { ShoppingBag, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  value: 'customer' | 'vendor';
  onChange: (value: 'customer' | 'vendor') => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange('customer')}
        className={cn(
          'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
          value === 'customer'
            ? 'border-primary bg-primary/5'
            : 'border-muted hover:border-muted-foreground/50'
        )}
      >
        <ShoppingBag
          className={cn(
            'h-8 w-8 mb-2',
            value === 'customer' ? 'text-primary' : 'text-muted-foreground'
          )}
        />
        <span
          className={cn(
            'text-sm font-medium',
            value === 'customer' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          Customer
        </span>
        <span className="text-xs text-muted-foreground mt-1">
          Shop products
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('vendor')}
        className={cn(
          'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
          value === 'vendor'
            ? 'border-primary bg-primary/5'
            : 'border-muted hover:border-muted-foreground/50'
        )}
      >
        <Store
          className={cn(
            'h-8 w-8 mb-2',
            value === 'vendor' ? 'text-primary' : 'text-muted-foreground'
          )}
        />
        <span
          className={cn(
            'text-sm font-medium',
            value === 'vendor' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          Vendor
        </span>
        <span className="text-xs text-muted-foreground mt-1">
          Sell products
        </span>
      </button>
    </div>
  );
}
