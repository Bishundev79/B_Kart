import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, full_name, role } = validationResult.data;

    const supabase = await createClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });

    if (error) {
      console.error('Signup error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return NextResponse.json({
        message: 'Please check your email to confirm your account',
        requiresConfirmation: true,
      });
    }

    return NextResponse.json({
      message: 'Account created successfully',
      user: data.user,
    });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
