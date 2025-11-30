import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vendorPayoutFiltersSchema } from '@/lib/validations/vendor';
import type { VendorPayoutsResponse, VendorPayoutItem, VendorPayoutSummary } from '@/types/vendor';

// GET /api/vendor/payouts - Get vendor's payouts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, balance')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const filterResult = vendorPayoutFiltersSchema.safeParse({
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || 1,
      perPage: searchParams.get('perPage') || 20,
    });

    if (!filterResult.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters' },
        { status: 400 }
      );
    }

    const { status, page, perPage } = filterResult.data;

    // Build query
    let query = supabase
      .from('vendor_payouts')
      .select('*', { count: 'exact' })
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: payoutsData, error, count } = await query;

    if (error) {
      console.error('Error fetching payouts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payouts' },
        { status: 500 }
      );
    }

    const payouts: VendorPayoutItem[] = (payoutsData || []).map((p: any) => ({
      id: p.id,
      vendor_id: p.vendor_id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      stripe_transfer_id: p.stripe_transfer_id,
      stripe_payout_id: p.stripe_payout_id,
      period_start: p.period_start,
      period_end: p.period_end,
      items_count: p.items_count,
      commission_amount: p.commission_amount,
      notes: p.notes,
      processed_at: p.processed_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    // Calculate summary
    const { data: summaryData } = await supabase
      .from('vendor_payouts')
      .select('status, amount')
      .eq('vendor_id', vendor.id);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: monthPayouts } = await supabase
      .from('vendor_payouts')
      .select('amount')
      .eq('vendor_id', vendor.id)
      .eq('status', 'completed')
      .gte('processed_at', startOfMonth.toISOString());

    const summary: VendorPayoutSummary = {
      pendingAmount: (summaryData || [])
        .filter((p: any) => p.status === 'pending')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      processingAmount: (summaryData || [])
        .filter((p: any) => p.status === 'processing')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      paidThisMonth: (monthPayouts || []).reduce((sum: number, p: any) => sum + p.amount, 0),
      totalPaid: (summaryData || [])
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
    };

    // Add pending earnings from delivered orders not yet in a payout
    // This is an approximation - the actual pending would need complex calculation
    summary.pendingAmount += vendor.balance || 0;

    const response: VendorPayoutsResponse = {
      payouts,
      summary,
      pagination: {
        page,
        perPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / perPage),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Vendor payouts API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
