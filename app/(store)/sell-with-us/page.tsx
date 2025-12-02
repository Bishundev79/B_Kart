import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header, Footer } from '@/components/layout';
import { Check, Store, DollarSign, TrendingUp, Users, Package, CreditCard, BarChart3, Headphones } from 'lucide-react';

export default function SellWithUsPage() {
  const benefits = [
    {
      icon: Store,
      title: 'Your Own Storefront',
      description: 'Create a branded store with custom products and listings',
    },
    {
      icon: DollarSign,
      title: 'Earn Money',
      description: 'Set your own prices and earn from every sale',
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      description: 'Track sales, views, and customer behavior with powerful analytics',
    },
    {
      icon: Users,
      title: 'Reach Customers',
      description: 'Access our growing customer base and expand your reach',
    },
    {
      icon: Package,
      title: 'Easy Product Management',
      description: 'Add, edit, and organize your products with our simple tools',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Get paid on time with our integrated payment system',
    },
    {
      icon: BarChart3,
      title: 'Sales Dashboard',
      description: 'Monitor your performance with real-time sales data',
    },
    {
      icon: Headphones,
      title: 'Seller Support',
      description: 'Dedicated support team to help you succeed',
    },
  ];

  const features = [
    'Easy product listing and management',
    'Integrated payment processing',
    'Order management dashboard',
    'Customer reviews and ratings',
    'Marketing tools and promotions',
    'Seller support and resources',
    'Mobile-friendly seller dashboard',
    'Real-time analytics and reporting',
  ];

  const steps = [
    {
      number: '1',
      title: 'Create an Account',
      description: 'Sign up for free and choose to become a seller',
    },
    {
      number: '2',
      title: 'Set Up Your Store',
      description: 'Complete your store profile and add your first products',
    },
    {
      number: '3',
      title: 'Start Selling',
      description: 'List your products and start receiving orders',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-20">
          <div className="container max-w-6xl">
            <div className="text-center space-y-6">
              <h1 className="text-5xl font-bold tracking-tight">
                Start Selling on B_Kart
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of sellers and grow your business with our powerful e-commerce platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    <Store className="mr-2 h-5 w-5" />
                    Start Selling Now
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">
                    Already a Member? Sign In
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No fees to get started. You only pay when you make a sale.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Sell on B_Kart?</h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to succeed as an online seller
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <benefit.icon className="h-10 w-10 mb-2 text-primary" />
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-muted/50">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Get started in three simple steps
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What You'll Get</h2>
              <p className="text-lg text-muted-foreground">
                Powerful tools to help you grow your business
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container max-w-4xl text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Start Your Selling Journey?</h2>
            <p className="text-xl text-primary-foreground/80">
              Join B_Kart today and reach thousands of customers
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">
                <Store className="mr-2 h-5 w-5" />
                Get Started for Free
              </Link>
            </Button>
            <p className="text-sm text-primary-foreground/60">
              Already have an account?{' '}
              <Link href="/login" className="underline hover:text-primary-foreground">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
