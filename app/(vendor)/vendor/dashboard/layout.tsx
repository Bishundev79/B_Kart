import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Settings,
  Store,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Header, Footer } from '@/components/layout';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  {
    title: 'Dashboard',
    href: '/vendor/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Products',
    href: '/vendor/dashboard/products',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/vendor/dashboard/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Customers',
    href: '/vendor/dashboard/customers',
    icon: Users,
  },
  {
    title: 'Payouts',
    href: '/vendor/dashboard/payouts',
    icon: DollarSign,
  },
  {
    title: 'Store Settings',
    href: '/vendor/dashboard/settings',
    icon: Settings,
  },
];

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is vendor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'vendor') {
    redirect('/');
  }

  // Check if vendor is onboarded
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, store_name, status')
    .eq('user_id', user.id)
    .single();

  if (!vendor) {
    redirect('/onboarding');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">
          <div className="sticky top-0 flex h-full flex-col">
            {/* Store Info */}
            <div className="border-b p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div className="overflow-hidden">
                  <p className="truncate font-medium">{vendor.store_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {vendor.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.title}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container py-6">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
