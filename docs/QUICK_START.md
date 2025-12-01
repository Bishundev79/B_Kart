# Quick Start Guide - Auth Refactor Implementation

## 🚀 Getting Started

This guide will help you implement and test the authentication refactor in your B_Kart application.

---

## Step 1: Verify Environment Variables

Check your `.env.local` file has these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Step 2: Update Database Trigger

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard
2. Click "SQL Editor"
3. Copy contents of `db/migrations/001_update_handle_new_user_trigger.sql`
4. Paste and run
5. Verify output shows trigger created

**Option B: Using Supabase CLI**

```bash
supabase db push
```

**Verify trigger:**
```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

Expected: 1 row with `enabled = 'O'`

---

## Step 3: Configure Google OAuth

### In Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" → "Credentials"
4. Find your OAuth 2.0 Client ID
5. Add Authorized Redirect URIs:
   ```
   http://localhost:3000/api/auth/callback
   https://yourdomain.com/api/auth/callback
   ```
6. Save changes

### In Supabase Dashboard:

1. Go to "Authentication" → "Providers"
2. Enable Google provider
3. Enter your Google Client ID and Secret
4. Verify Site URL: `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
5. Verify Redirect URLs: `http://localhost:3000/api/auth/callback`
6. Save

---

## Step 4: Test Email Confirmation Settings

**For Development (Recommended):**
1. Supabase Dashboard → "Authentication" → "Settings"
2. Disable "Enable email confirmations"
3. This allows instant signup without email verification

**For Production:**
1. Enable "Enable email confirmations"
2. Configure email templates
3. Set "Confirm email" redirect to: `{YOUR_APP_URL}/api/auth/callback`

---

## Step 5: Start Development Server

```bash
npm run dev
```

Server should start on `http://localhost:3000`

---

## Step 6: Quick Testing

### Test 1: Email Signup (1 minute)

1. Navigate to: `http://localhost:3000/signup`
2. Fill in:
   - Email: `test@example.com`
   - Password: `TestPass123`
   - Full Name: `Test User`
   - Role: Customer
   - Accept terms
3. Click "Sign Up"

**Expected:**
- Success message or redirect to `/account`
- Check database: Profile created with customer role

### Test 2: Google OAuth (2 minutes)

1. Navigate to: `http://localhost:3000/login`
2. Click "Continue with Google"
3. Sign in with Google account
4. Should redirect to `/select-role`
5. Choose "Customer" or "Vendor"
6. Should redirect to appropriate page

**Expected:**
- Profile created with Google name and picture
- Role assigned based on selection

### Test 3: Session Persistence (30 seconds)

1. Sign in with either method
2. Refresh the page
3. You should still be logged in

**Expected:**
- Session persists
- No redirect to login

---

## Step 7: Check Logs

Open browser DevTools (F12) and check Console for:

```
[Auth Store] Initializing auth state...
[Auth Store] Session found for user: <uuid>
[Auth Store] Profile loaded: customer
```

If you see these logs, authentication is working! ✅

---

## Troubleshooting

### Issue: "Profile not created"

**Check:**
1. Run database migration (Step 2)
2. Check Supabase logs for trigger errors
3. Manual fallback should create profile anyway

**Quick Fix:**
```sql
-- Manually create profile if needed
INSERT INTO profiles (id, full_name, role)
VALUES ('user-uuid-here', 'Full Name', 'customer');
```

### Issue: "OAuth redirect error"

**Check:**
1. Google Cloud Console redirect URIs
2. Supabase OAuth settings
3. Environment variable `NEXT_PUBLIC_APP_URL`

**Fix:**
- Ensure redirect URI exactly matches: `{APP_URL}/api/auth/callback`
- No trailing slashes
- Use exact domain (http vs https)

### Issue: "Session not persisting"

**Check:**
1. Browser cookies (DevTools → Application → Cookies)
2. Should see Supabase auth cookies
3. Check domain matches `NEXT_PUBLIC_APP_URL`

**Fix:**
- Clear cookies and try again
- Check `NEXT_PUBLIC_APP_URL` is correct
- In production, ensure domain is correct

### Issue: "Cannot access protected routes"

**Check:**
1. Profile exists in database
2. Profile has correct role
3. Middleware logs show auth check

**Fix:**
```sql
-- Update role if needed
UPDATE profiles SET role = 'vendor' WHERE id = 'user-uuid-here';
```

---

## Step 8: Database Verification

Run these queries in Supabase SQL Editor:

### Check all profiles:
```sql
SELECT 
  id,
  full_name,
  role,
  avatar_url,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
```

### Check user metadata:
```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as name,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

### Check OAuth users:
```sql
SELECT 
  u.email,
  p.full_name,
  p.avatar_url,
  p.role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.avatar_url IS NOT NULL
ORDER BY u.created_at DESC;
```

---

## Step 9: Production Deployment

Before deploying to production:

### ✅ Checklist:

- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Add production URL to Google OAuth redirect URIs
- [ ] Update Supabase redirect URLs
- [ ] Enable email confirmation
- [ ] Configure email templates
- [ ] Test all flows in production environment
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Review RLS policies
- [ ] Test with real user accounts
- [ ] Monitor logs for errors

### Deploy:

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

---

## Step 10: Monitor and Iterate

### After deployment:

1. **Monitor Logs:**
   - Check for `[OAuth Callback]` errors
   - Check for `[Signup API]` errors
   - Check for `[Middleware]` warnings

2. **Check Metrics:**
   - Signup success rate
   - OAuth completion rate
   - Session persistence rate
   - Error frequency

3. **User Feedback:**
   - Collect feedback on auth flow
   - Monitor support tickets
   - Track user confusion points

---

## Next Features to Implement

1. **Password Reset:** Complete forgot password flow
2. **Email Verification:** Resend confirmation email
3. **Profile Completion:** Prompt for additional info
4. **Two-Factor Auth:** Add 2FA support
5. **Social Login:** Add GitHub, Facebook
6. **Account Deletion:** Allow users to delete account

---

## Getting Help

### Documentation:
- Full technical docs: `docs/AUTH_REFACTOR.md`
- Testing guide: `docs/TESTING_AUTH.md`
- This quick start: `docs/QUICK_START.md`

### Logs to Check:
- Browser Console: Filter by `[Auth` or `[OAuth`
- Server Console: Check for errors during signup/login
- Supabase Logs: Check for trigger errors

### Common Patterns:
All auth operations follow this pattern:
1. Validate input
2. Attempt operation
3. Log result
4. Handle errors
5. Return user-friendly message

---

## Success! 🎉

If you can:
- ✅ Sign up with email/password
- ✅ Sign in with Google
- ✅ Select role after OAuth
- ✅ Session persists on refresh
- ✅ Access control works
- ✅ Error messages are clear

Then your authentication system is working correctly!

---

**Need more help?** Check the detailed documentation in:
- `docs/AUTH_REFACTOR.md` - Complete technical details
- `docs/TESTING_AUTH.md` - All test scenarios
- `AUTH_REFACTOR_SUMMARY.md` - Overview of changes

**Questions?** Review the code comments for detailed explanations of each function.
