# Admin User Management Setup

## What Was Added

A complete admin user management system has been added to the Clover ERA CRM with the following features:

### New Files Created
- **[crm/admin.html](crm/admin.html)** - Admin user management page with:
  - User list with roles, opportunity counts, and last sign-in dates
  - Role management (Admin, Manager, Sales Rep)
  - User statistics dashboard
  - User invite modal (note: requires Supabase service role for full functionality)

### Files Modified
- **[crm/index.html](crm/index.html)** - Added admin link to navigation (visible only to admins)
- **[crm/companies.html](crm/companies.html)** - Added admin link to navigation (visible only to admins)
- **[crm/activities.html](crm/activities.html)** - Added admin link to navigation (visible only to admins)

## Setup Instructions

### 1. Run the User Support SQL Migration (If Not Already Done)

In Supabase SQL Editor, run:
```sql
-- File: crm/add-user-support.sql
-- This creates the profiles table and adds owner_id columns
```

The warning about "destructive operations" is expected because it drops and recreates a trigger.

### 2. Make Your First User an Admin

After running the SQL migration, you need to promote your first user to admin:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace the email with your email):
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 3. Access the Admin Page

1. Log in to the CRM at `/crm/login.html`
2. If you're an admin, you'll see an "Admin" link in the navigation
3. Click "Admin" to access the user management page

## Features

### Admin Page Features
- **User Statistics**: Total users, active users, admin count, sales rep count
- **User List**: View all users with their roles, opportunity counts, and last sign-in dates
- **Role Management**: Change user roles directly from the admin page
- **User Invite**: Invite new users (requires service role configuration)

### Role-Based Access Control
- Admin link is only visible to users with the `admin` role
- Non-admin users cannot access the admin page
- Role checks happen on page load

## User Roles

- **admin**: Full access to all features including user management
- **manager**: Can view all team opportunities (future: additional manager features)
- **sales_rep**: Default role for new users

## Adding New Users

### Method 1: Supabase Dashboard (Recommended for Now)
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and send invite
4. The user will receive an email with a signup link
5. A profile will be automatically created via trigger
6. Set their role in the Admin page

### Method 2: Admin Page Invite (Requires Service Role)
The invite functionality in the admin page requires Supabase service role key. For production:
1. Create a Supabase Edge Function with service role access
2. Update the invite functionality to call that function

## Testing Checklist

- [ ] SQL migration runs successfully
- [ ] First user promoted to admin
- [ ] Admin can see "Admin" link in navigation
- [ ] Non-admin users cannot see "Admin" link
- [ ] Admin page loads and shows all users
- [ ] User stats are accurate
- [ ] Role changes work correctly
- [ ] Non-admin users are redirected if they try to access admin page directly

## Security Notes

- Row Level Security (RLS) is enabled on the profiles table
- All users can view profiles (to see team members)
- Users can only update their own profile
- Admin role checks happen client-side (should add server-side checks for production)
