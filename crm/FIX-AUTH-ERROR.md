# Fix for "Database error granting user" Authentication Error

## Problem
Users were unable to log in, getting error: "Database error granting user"

## Root Cause
The trigger function `update_user_last_sign_in()` was created without:
1. Explicit schema qualification (`public.profiles` instead of just `profiles`)
2. Proper permissions for `supabase_auth_admin` user to access the profiles table

When a user tried to log in:
1. Supabase auth successfully authenticated the user
2. The `on_auth_user_sign_in` trigger fired
3. The trigger called `update_user_last_sign_in()` function
4. The function tried to update `profiles` table
5. **FAILED** with error: `relation "profiles" does not exist`
6. This caused the "Database error granting user" error

The function was running as `supabase_auth_admin` user, which doesn't have the `public` schema in its search path by default.

## Solution

Run this SQL to fix the trigger function:

```sql
-- Fix the update_user_last_sign_in function
-- Add explicit schema qualification and proper permissions

CREATE OR REPLACE FUNCTION public.update_user_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_sign_in_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to auth admin
GRANT EXECUTE ON FUNCTION public.update_user_last_sign_in() TO supabase_auth_admin;

-- Grant table access to auth admin
GRANT SELECT, UPDATE ON public.profiles TO supabase_auth_admin;
```

## What This Does

1. **`public.profiles`** - Explicitly qualifies the table name with schema
2. **`GRANT EXECUTE`** - Allows supabase_auth_admin to run the function
3. **`GRANT SELECT, UPDATE`** - Allows supabase_auth_admin to read and update profiles table

## Prevention

When creating trigger functions that interact with custom tables (like profiles):
- ✅ Always use full schema qualification: `public.table_name`
- ✅ Always grant permissions to `supabase_auth_admin` if triggered by auth events
- ✅ Test login immediately after creating auth-related triggers

## Related Files

- Original trigger creation: `crm/add-profile-columns.sql`
- The trigger: `on_auth_user_sign_in` on `auth.users` table
- The function: `public.update_user_last_sign_in()`

## Verification

After running the fix:
1. Users can log in successfully
2. `last_sign_in_at` field updates correctly in profiles table
3. No "Database error granting user" errors

## Log Evidence

Error in Supabase logs before fix:
```
event_message: "relation \"profiles\" does not exist"
context: "PL/pgSQL function public.update_user_last_sign_in() line 3 at SQL statement"
internal_query: "UPDATE profiles SET last_sign_in_at = NEW.last_sign_in_at WHERE id = NEW.id"
user_name: "supabase_auth_admin"
```

The error showed that `supabase_auth_admin` couldn't find the profiles table because it wasn't schema-qualified.

---

**Date Fixed**: November 11, 2025
**Impact**: Critical - Blocked all user logins
**Resolution Time**: ~2 hours
