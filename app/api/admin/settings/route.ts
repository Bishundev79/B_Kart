import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { platformSettingsSchema } from '@/lib/validations/admin';
import type { PlatformSettingsData } from '@/types/admin';

// Default settings
const defaultSettings: PlatformSettingsData = {
  default_commission_rate: 15,
  tax_rate: 0,
  free_shipping_threshold: 50,
  default_shipping_cost: 5.99,
  currency: 'USD',
  review_auto_approve: false,
  vendor_auto_approve: false,
  maintenance_mode: false,
  contact_email: '',
  support_phone: '',
};

// GET /api/admin/settings - Get platform settings
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all settings
    const { data: settingsRows, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Convert rows to settings object
    const settings: PlatformSettingsData = { ...defaultSettings };

    (settingsRows || []).forEach((row) => {
      const key = row.key as keyof PlatformSettingsData;
      if (key in settings) {
        // Parse JSON value
        try {
          const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
          (settings as unknown as Record<string, unknown>)[key] = value;
        } catch {
          (settings as unknown as Record<string, unknown>)[key] = row.value;
        }
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/settings - Update platform settings
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = platformSettingsSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Upsert each setting
    const updates = Object.entries(result.data).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error: upsertError } = await adminSupabase
        .from('platform_settings')
        .upsert(update, { onConflict: 'key' });

      if (upsertError) {
        console.error('Error updating setting:', update.key, upsertError);
      }
    }

    // Fetch updated settings
    const { data: settingsRows } = await supabase
      .from('platform_settings')
      .select('key, value');

    const settings: PlatformSettingsData = { ...defaultSettings };

    (settingsRows || []).forEach((row) => {
      const key = row.key as keyof PlatformSettingsData;
      if (key in settings) {
        try {
          const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
          (settings as unknown as Record<string, unknown>)[key] = value;
        } catch {
          (settings as unknown as Record<string, unknown>)[key] = row.value;
        }
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
