# Authentication Testing Guide

## Quick Start Testing

### Prerequisites
1. Supabase project configured
2. Google OAuth configured in Supabase
3. Environment variables set in `.env.local`
4. Database trigger updated (run migration: `db/migrations/001_update_handle_new_user_trigger.sql`)

---

## Test Scenarios

### 1. Email/Password Signup - Customer

**Steps:**
1. Navigate to `/signup`
2. Fill in form:
   - Email: `test-customer@example.com`
   - Password: `TestPass123`
   - Confirm Password: `TestPass123`
   - Full Name: `Test Customer`
   - Role: Select "Customer"
   - Accept Terms: Check
3. Click "Sign Up"

**Expected Result:**
- ✅ Account created
- ✅ Profile created with customer role
- ✅ If email confirmation disabled: Redirected to `/account`
- ✅ If email confirmation enabled: Message to check email

**Debug:**
```sql
-- Check profile was created
SELECT * FROM profiles WHERE full_name = 'Test Customer';
```

---

### 2. Email/Password Signup - Vendor

**Steps:**
1. Navigate to `/signup`
2. Fill in form with vendor role selected
3. Click "Sign Up"

**Expected Result:**
- ✅ Account created
- ✅ Profile created with vendor role
- ✅ Redirected to `/onboarding` (vendor onboarding page)

**Debug:**
```sql
-- Check profile was created with vendor role
SELECT * FROM profiles WHERE role = 'vendor' ORDER BY created_at DESC LIMIT 1;
```

---

### 3. Google OAuth - New User

**Steps:**
1. Navigate to `/login`
2. Click "Continue with Google"
3. Authorize with Google account
4. Should redirect back to app

**Expected Result:**
- ✅ OAuth completes successfully
- ✅ Profile created with Google name and picture
- ✅ Redirected to `/select-role`
- ✅ Select role page shows customer vs vendor options
- ✅ After selecting role, redirected appropriately

**Debug:**
```sql
-- Check profile has Google metadata
SELECT 
  id, 
  full_name, 
  avatar_url, 
  role 
FROM profiles 
WHERE avatar_url LIKE '%googleusercontent.com%'
ORDER BY created_at DESC 
LIMIT 1;
```

**Check Logs:**
Open browser console and filter for:
- `[OAuth Callback]`
- `[Auth Store]`

---

### 4. Google OAuth - Existing User

**Steps:**
1. Use same Google account as test #3
2. Click "Continue with Google"

**Expected Result:**
- ✅ Recognized as existing user
- ✅ No role selection page
- ✅ Redirected based on role:
  - Customer → `/account`
  - Vendor → `/vendor/dashboard` or `/onboarding`

---

### 5. Email/Password Login

**Steps:**
1. Navigate to `/login`
2. Enter credentials from test #1 or #2
3. Click "Sign In"

**Expected Result:**
- ✅ Login successful
- ✅ Profile loaded
- ✅ Redirected to appropriate page

**Common Errors:**
- "Invalid email or password" - Wrong credentials
- "Please confirm your email" - Email not confirmed

---

### 6. Session Persistence

**Steps:**
1. Sign in (any method)
2. Verify logged in (check navbar, can access `/account`)
3. **Close browser completely**
4. Reopen browser
5. Navigate to site

**Expected Result:**
- ✅ Still logged in
- ✅ Profile loaded
- ✅ Can access protected routes

**Debug:**
Open browser console and look for:
```
[Auth Store] Initializing auth state...
[Auth Store] Session found for user: <uuid>
[Auth Store] Profile loaded: customer
```

---

### 7. Role-Based Access Control

**Test A: Customer accessing vendor routes**
1. Sign in as customer
2. Try to navigate to `/vendor/dashboard`

**Expected:** Redirected to `/` (home)

**Test B: Vendor accessing admin routes**
1. Sign in as vendor
2. Try to navigate to `/admin/dashboard`

**Expected:** Redirected to `/` (home)

**Test C: Vendor accessing vendor routes**
1. Sign in as vendor
2. Navigate to `/vendor/dashboard`

**Expected:** 
- If onboarding incomplete: Redirected to `/onboarding`
- If onboarding complete: Access granted

---

### 8. Logout

**Steps:**
1. Sign in (any method)
2. Click logout button
3. Check you're logged out

**Expected Result:**
- ✅ Session cleared
- ✅ Redirected to home
- ✅ Cannot access protected routes
- ✅ Navbar shows "Sign In" / "Sign Up"

---

## Error Testing

### Test Error Handling

**Test 1: Invalid Email**
- Try signup with email: `notanemail`
- Expected: "Please enter a valid email address"

**Test 2: Weak Password**
- Try signup with password: `123`
- Expected: "Password must be at least 6 characters long"

**Test 3: Duplicate Account**
- Try signup with existing email
- Expected: "An account with this email already exists"

**Test 4: Wrong Login**
- Try login with wrong password
- Expected: "Invalid email or password"

**Test 5: OAuth Error**
- Deny Google OAuth authorization
- Expected: Redirected to login with error message

---

## Database Verification

### Check Profiles Were Created

```sql
-- View all profiles
SELECT 
  id,
  full_name,
  role,
  avatar_url,
  created_at
FROM profiles
ORDER BY created_at DESC;
```

### Check User Metadata

```sql
-- View user metadata (including OAuth data)
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

### Check Trigger Exists

```sql
-- Verify trigger is active
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

---

## Debugging Tools

### Browser Console Logs

All auth operations log with prefixes:
- `[OAuth Callback]` - OAuth callback process
- `[Auth Store]` - Client-side auth operations
- `[Signup API]` - Server-side signup
- `[Middleware]` - Route protection
- `[Select Role]` - Role selection

### Enable Detailed Logs

1. Open browser DevTools (F12)
2. Go to Console tab
3. Filter by prefix (e.g., type `[OAuth` to see OAuth logs)
4. Check for errors (red text)

### Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to "Authentication" → "Users"
3. View created users
4. Check "User Metadata" for each user
5. Go to "Table Editor" → "profiles"
6. Verify profiles exist for each user

### Server Logs

If running locally:
```bash
npm run dev
```

Look for console logs with prefixes above.

---

## Common Issues & Solutions

### Issue: Profile not created after signup

**Solution:**
1. Check trigger exists (SQL query above)
2. Run migration: `db/migrations/001_update_handle_new_user_trigger.sql`
3. Check Supabase logs for trigger errors
4. Manual fallback should create profile anyway

### Issue: OAuth redirects to login with error

**Solution:**
1. Check Google Cloud Console:
   - Authorized redirect URIs include `{YOUR_APP_URL}/api/auth/callback`
2. Check Supabase Dashboard:
   - OAuth providers configured
   - Redirect URL correct
3. Check browser console for error details
4. Look for `[OAuth Callback]` logs

### Issue: Session not persisting

**Solution:**
1. Check cookies in browser (DevTools → Application → Cookies)
2. Look for Supabase auth cookies
3. Check `[Auth Store] Initializing...` logs
4. Verify `NEXT_PUBLIC_APP_URL` matches your domain

### Issue: Middleware blocking access

**Solution:**
1. Check profile.role in database
2. Look for `[Middleware]` logs in server console
3. Verify RLS policies allow reading profiles
4. Check if profile exists for user

### Issue: Google metadata not captured

**Solution:**
1. Check `raw_user_meta_data` in auth.users table
2. Verify trigger is using updated version
3. Run migration if needed
4. Check fallback in callback handler created profile

---

## Performance Testing

### Test Concurrent Signups

```bash
# Use artillery or similar tool
# Test 10 concurrent signups
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"TestPass123\",\"full_name\":\"Test User $i\",\"role\":\"customer\",\"confirmPassword\":\"TestPass123\",\"terms\":true}" &
done
wait
```

**Expected:** All 10 profiles created successfully

---

## Next Steps After Testing

1. ✅ Verify all test scenarios pass
2. ✅ Check database has correct data
3. ✅ Review logs for any warnings
4. ✅ Test in production-like environment
5. ✅ Enable email confirmation for production
6. ✅ Set up error monitoring (Sentry, LogRocket, etc.)
7. ✅ Document any edge cases found

---

## Success Criteria

- [ ] Email/password signup works for customer
- [ ] Email/password signup works for vendor
- [ ] Google OAuth creates profile correctly
- [ ] Google OAuth extracts name and picture
- [ ] Role selection page works
- [ ] Email/password login works
- [ ] Session persists across page reloads
- [ ] Role-based access control works
- [ ] Error messages are user-friendly
- [ ] All logs are clean (no errors)
- [ ] Database trigger creates profiles
- [ ] Fallback profile creation works
- [ ] Logout clears session

If all criteria are met, authentication system is working correctly! 🎉
