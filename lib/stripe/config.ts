import Stripe from 'stripe';

// Server-side Stripe instance
// Only use this in API routes and server components

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

// Helper to format amount for Stripe (converts dollars to cents)
export function formatAmountForStripe(amount: number, currency: string = 'USD'): number {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}

// Helper to format amount from Stripe (converts cents to dollars)
export function formatAmountFromStripe(amount: number, currency: string = 'USD'): number {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  
  return zeroDecimalCurrency ? amount : amount / 100;
}

// Minimum charge amount in cents (Stripe requirement)
export const MIN_AMOUNT = 50; // $0.50 USD
export const MAX_AMOUNT = 999999; // $9,999.99 USD

// Supported currencies
export const SUPPORTED_CURRENCIES = ['usd'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Default currency
export const DEFAULT_CURRENCY: SupportedCurrency = 'usd';
