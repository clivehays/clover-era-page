# Supabase URL Configuration - Fix Localhost Redirects

## Problem
Password reset and verification links are redirecting to `http://localhost:3000` instead of `https://cloverera.com`

## Root Cause
The redirect URLs are configured in Supabase Dashboard settings, not in the code. Even though the code specifies the correct redirect URL, Supabase validates against its allowlist.

## Solution - Update Supabase Dashboard Settings

### Step 1: Navigate to Authentication Settings
1. Go to Supabase Dashboard: https://drugebiitlcjkknjfxeh.supabase.co
2. Click **Authentication** in the left sidebar
3. Click **URL Configuration** (or **Settings**)

### Step 2: Update Site URL
Find the **Site URL** field and change it to:
```
https://cloverera.com
```

### Step 3: Update Redirect URLs
Find the **Redirect URLs** section (may be called "Additional Redirect URLs" or "Allowed Redirect URLs").

**Remove:**
- `http://localhost:3000`
- `http://localhost:3000/**`
- Any other localhost URLs

**Add these URLs:**
```
https://cloverera.com/crm/login.html
https://cloverera.com/crm/reset-password.html
https://cloverera.com/crm/index.html
https://cloverera.com/crm/**
```

Or use a wildcard:
```
https://cloverera.com/**
```

### Step 4: Save Changes
1. Scroll to bottom of page
2. Click **Save** button
3. Wait for confirmation message

### Step 5: Test
1. Try resetting a password for a test user
2. Check that the email link goes to `https://cloverera.com` instead of `localhost`

## Additional Settings to Check

### Email Templates
While you're in the Authentication section:

1. Click **Email Templates** in the left sidebar
2. Check each template (Confirm Signup, Reset Password, etc.)
3. Make sure they don't have hardcoded localhost URLs

**Default templates use:** `{{ .ConfirmationURL }}` and `{{ .RedirectTo }}`
These variables will automatically use the Site URL and Redirect URLs you configured above.

### SMTP Settings (Optional)
If you want to customize the "from" email address:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your own email server (optional)
3. Default uses Supabase's email service

## Verification

After making these changes, test the following:

1. **Password Reset:**
   - Go to login page
   - Click "Forgot Password?"
   - Enter email
   - Check email - link should go to `https://cloverera.com/crm/reset-password.html`

2. **Email Verification:**
   - Create a new user from Admin page
   - Check verification email
   - Link should go to `https://cloverera.com/crm/login.html`

3. **Resend Verification:**
   - Click "Resend Verification" button in Admin page
   - Check email
   - Link should go to production URL

## Troubleshooting

### If links still go to localhost:

1. **Clear browser cache:** Ctrl+Shift+R (hard refresh)
2. **Check Supabase settings were saved:** Navigate away and back to verify
3. **Wait 1-2 minutes:** Settings changes may take a moment to propagate
4. **Check email client cache:** Some email clients cache redirect URLs

### If you get "Redirect URL not allowed" error:

1. Make sure you added the full URL path to Redirect URLs allowlist
2. Try adding wildcard: `https://cloverera.com/**`
3. Save and wait 1-2 minutes

### If email verification fails:

1. Check that user's email is not already verified in profiles table
2. Run this SQL to manually verify:
   ```sql
   UPDATE profiles
   SET email_confirmed_at = NOW()
   WHERE email = 'user@example.com';
   ```

## Current Code Implementation

The code already uses the correct URLs:

**admin.html:**
- `emailRedirectTo: 'https://cloverera.com/crm/login.html'` (line ~829, ~722)
- `redirectTo: 'https://cloverera.com/crm/reset-password.html'` (line ~687)

**login.html:**
- `emailRedirectTo: 'https://cloverera.com/crm/login.html'`

**reset-password.html:**
- Uses current session (no redirect needed)

The issue is purely configuration in Supabase Dashboard.

---

**After completing these steps, all password reset and verification emails should redirect to the production domain.**
