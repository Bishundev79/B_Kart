import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vendorSettingsSchema } from '@/lib/validations/vendor';
import type { VendorSettings } from '@/types/vendor';

// GET /api/vendor/settings - Get vendor settings
export async function GET() {
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

    // Get vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select(`
        id,
        store_name,
        store_slug,
        store_description,
        store_logo,
        store_banner,
        business_email,
        business_phone,
        business_address,
        commission_rate,
        status
      `)
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 403 }
      );
    }

    const settings: VendorSettings = {
      id: vendor.id,
      store_name: vendor.store_name,
      store_slug: vendor.store_slug,
      store_description: vendor.store_description,
      store_logo: vendor.store_logo,
      store_banner: vendor.store_banner,
      business_email: vendor.business_email,
      business_phone: vendor.business_phone,
      business_address: vendor.business_address,
      commission_rate: vendor.commission_rate,
      status: vendor.status,
    };

    return NextResponse.json({ vendor: settings });
  } catch (error) {
    console.error('Vendor settings GET error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/vendor/settings - Update vendor settings
export async function PATCH(request: NextRequest) {
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
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const result = vendorSettingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const updateData = result.data;

    // Update vendor
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update({
        store_name: updateData.store_name,
        store_description: updateData.store_description || null,
        store_logo: updateData.store_logo || null,
        store_banner: updateData.store_banner || null,
        business_email: updateData.business_email || null,
        business_phone: updateData.business_phone || null,
        business_address: updateData.business_address || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendor.id)
      .select(`
        id,
        store_name,
        store_slug,
        store_description,
        store_logo,
        store_banner,
        business_email,
        business_phone,
        business_address,
        commission_rate,
        status
      `)
      .single();

    if (updateError) {
      console.error('Error updating vendor settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    const settings: VendorSettings = {
      id: updatedVendor.id,
      store_name: updatedVendor.store_name,
      store_slug: updatedVendor.store_slug,
      store_description: updatedVendor.store_description,
      store_logo: updatedVendor.store_logo,
      store_banner: updatedVendor.store_banner,
      business_email: updatedVendor.business_email,
      business_phone: updatedVendor.business_phone,
      business_address: updatedVendor.business_address,
      commission_rate: updatedVendor.commission_rate,
      status: updatedVendor.status,
    };

    return NextResponse.json({
      vendor: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Vendor settings PATCH error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
