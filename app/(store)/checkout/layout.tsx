import Link from 'next/link';
import { Store } from 'lucide-react';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Store className="h-6 w-6" />
              <span>B_Kart</span>
            </Link>
            <span className="text-sm text-muted-foreground">
              Secure Checkout
            </span>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      {/* Minimal Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} B_Kart. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
