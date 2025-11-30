'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Header, Footer } from '@/components/layout';
import { useAuthStore } from '@/stores/authStore';

const sidebarItems = [
  {
    title: 'Account',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: User },
      { name: 'Profile', href: '/dashboard/profile', icon: Settings },
      { name: 'Addresses', href: '/dashboard/addresses', icon: MapPin },
    ],
  },
  {
    title: 'Orders',
    items: [
      { name: 'My Orders', href: '/dashboard/orders', icon: Package },
      { name: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
    ],
  },
  {
    title: 'Settings',
    items: [
      { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { name: 'Payment Methods', href: '/dashboard/payment-methods', icon: CreditCard },
    ],
  },
];

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuthStore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirectTo=/dashboard');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <div className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="sticky top-20">
              <div className="rounded-lg border bg-card">
                {/* User Info */}
                <div className="p-4">
                  <p className="font-medium">{profile?.full_name || 'Welcome'}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                
                <Separator />
                
                {/* Navigation */}
                <ScrollArea className="h-auto max-h-[60vh]">
                  <div className="p-2">
                    {sidebarItems.map((section) => (
                      <div key={section.title} className="mb-4">
                        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {section.title}
                        </p>
                        {section.items.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <Link key={item.name} href={item.href}>
                              <Button
                                variant={isActive ? 'secondary' : 'ghost'}
                                className="w-full justify-start mb-1"
                              >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.name}
                              </Button>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                    
                    <Separator className="my-2" />
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
