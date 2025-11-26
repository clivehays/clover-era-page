# Manager Roundtable System - Setup Guide

This guide will help you set up and deploy the Manager Roundtable registration system for Clover ERA.

## System Overview

The Manager Roundtable system consists of:

1. **Landing Page** (`manager-roundtable.html`) - Public page showing upcoming sessions
2. **Registration Form** (`manager-roundtable-register.html`) - Captures participant details
3. **Confirmation Page** (`manager-roundtable-confirmation.html`) - Shows registration success
4. **Admin Dashboard** (`admin/roundtable-dashboard.html`) - Manage sessions and view registrations
5. **Backend APIs** (Vercel serverless functions) - Handle registration logic
6. **Database** (Supabase) - Stores roundtables and registrations
7. **Email System** (SendGrid) - Sends confirmations and calendar invites
8. **Video Conferencing** (Zoom) - Automatic meeting creation

## Prerequisites

You'll need accounts and credentials for:

- **Supabase** (database)
- **SendGrid** (email delivery)
- **Zoom** (video meetings)
- **Vercel** (already set up for deployment)

---

## Step 1: Database Setup (Supabase)

### 1.1 Create Tables

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Execute the SQL to create tables, functions, views, and policies

### 1.2 Get Supabase Credentials

You'll need:
- **SUPABASE_URL**: Your project URL (e.g., `https://xxxxx.supabase.co`)
- **SUPABASE_SERVICE_KEY**: Service role key (not the anon key - this bypasses RLS)

Find these in: Project Settings > API > Project URL and service_role key

---

## Step 2: SendGrid Setup

### 2.1 Create SendGrid Account

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify your sender email address (`contact@cloverera.com`)
3. Set up domain authentication for better deliverability (optional but recommended)

### 2.2 Create API Key

1. Go to Settings > API Keys
2. Create a new API key with "Full Access" permissions
3. Copy the key (you won't be able to see it again)
4. Save as **SENDGRID_API_KEY**

---

## Step 3: Zoom Setup

### 3.1 Create Zoom Server-to-Server OAuth App

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Click "Develop" > "Build App"
3. Choose "Server-to-Server OAuth"
4. Fill in app information:
   - App Name: "Clover ERA Roundtables"
   - Company Name: "Clover ERA"
   - Developer Email: `contact@cloverera.com`

### 3.2 Get Credentials

After creating the app, you'll get:
- **ZOOM_ACCOUNT_ID**: Your Zoom account ID
- **ZOOM_CLIENT_ID**: OAuth client ID
- **ZOOM_CLIENT_SECRET**: OAuth client secret

### 3.3 Add Scopes

Add these scopes to your app:
- `meeting:write:admin` - Create meetings
- `meeting:read:admin` - Read meeting details

---

## Step 4: Environment Variables

### 4.1 Add to Vercel

Go to your Vercel project settings and add these environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

SENDGRID_API_KEY=SG.xxxxx

ZOOM_ACCOUNT_ID=your-account-id
ZOOM_CLIENT_ID=your-client-id
ZOOM_CLIENT_SECRET=your-client-secret
```

### 4.2 Local Development (.env)

For local testing, create a `.env` file in the root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

SENDGRID_API_KEY=SG.xxxxx

ZOOM_ACCOUNT_ID=your-account-id
ZOOM_CLIENT_ID=your-client-id
ZOOM_CLIENT_SECRET=your-client-secret
```

**Important:** Add `.env` to `.gitignore` to never commit secrets!

---

## Step 5: Install Dependencies

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Database client
- `@sendgrid/mail` - Email sending

---

## Step 6: Deploy to Vercel

The project is already configured for Vercel deployment.

### 6.1 Deploy

```bash
# If using Vercel CLI
vercel --prod

# Or push to main branch (if auto-deployment is enabled)
git add .
git commit -m "Add Manager Roundtable system"
git push origin main
```

### 6.2 Verify Deployment

After deployment:
1. Visit `https://cloverera.com/manager-roundtable.html`
2. You should see the landing page (may be empty if no sessions scheduled)

---

## Step 7: Create Your First Roundtable Session

### Option A: Via Admin Dashboard

1. Go to `https://cloverera.com/admin/roundtable-dashboard.html`
2. Click "Create New Session"
3. Fill in:
   - Topic (select from dropdown)
   - Date and time
   - Max participants (default 6)
4. Click "Save Roundtable"

**Note:** You may want to add authentication to the admin dashboard in production.

### Option B: Direct Database Insert

Using Supabase SQL Editor:

```sql
INSERT INTO roundtables (topic, description, scheduled_at, max_participants)
VALUES (
    'The 30-Day Warning System',
    'Learn to spot the warning signs 30 days before someone quits',
    '2025-01-20 12:00:00-05', -- Eastern Time
    6
);
```

---

## Step 8: Testing the Complete Flow

### 8.1 Test Registration

1. Visit the landing page
2. Click "Register Now" on a session
3. Fill out the registration form
4. Submit and verify you see the confirmation page

### 8.2 Check Email Delivery

You should receive:
- Confirmation email with calendar invite attached
- Email should have Zoom meeting link (if Zoom is configured)

### 8.3 Check Database

In Supabase, verify:

```sql
-- Check roundtables
SELECT * FROM roundtables;

-- Check registrations
SELECT * FROM registrations;

-- Check view with counts
SELECT * FROM upcoming_roundtables;
```

### 8.4 Test Waitlist

1. Register 6 people for a session (the max)
2. Register a 7th person
3. Verify they're marked as waitlist
4. Check they receive the waitlist email (different from confirmation)

---

## Features Implemented

✅ **Landing page** showing next 6-8 sessions
✅ **Topic rotation** (4 core topics)
✅ **Registration form** with validation
✅ **Email confirmation** with calendar invite (.ics file)
✅ **Automatic Zoom meeting** creation
✅ **Waitlist functionality** when sessions are full
✅ **2-hour registration cutoff** before sessions
✅ **Admin dashboard** to manage everything
✅ **Responsive design** matching Clover ERA branding

---

## Admin Dashboard Features

Access at: `/admin/roundtable-dashboard.html`

- View all upcoming and past sessions
- See registration counts and waitlist numbers
- Create new roundtable sessions
- Edit or cancel sessions
- View detailed registration lists
- Export registrations to CSV
- Track performance metrics

---

## Automated Email Triggers

The system sends emails automatically:

1. **Confirmation Email** - Immediately after registration
   - Includes calendar invite
   - Includes Zoom link
   - Different template for waitlist

2. **Reminder Email** - 24 hours before session
   - Can be triggered via cron job or scheduled function

3. **Waitlist Promotion Email** - When a spot opens
   - Sent to next person on waitlist
   - Includes updated calendar invite

---

## Setting Up Email Reminders (Optional)

To send reminder emails 24 hours before each session, you can:

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/send-reminders.yml`:

```yaml
name: Send Roundtable Reminders

on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch: # Manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/send-reminders.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
```

### Option B: Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "0 */6 * * *"
  }]
}
```

---

## Customization

### Topic Descriptions

Edit topic descriptions in `manager-roundtable.html` around line 330:

```javascript
const topicDescriptions = {
    'The 30-Day Warning System': 'Your description here',
    // ...
};
```

### Email Templates

Edit email HTML in `utils/email.js`:
- `generateConfirmationEmailHTML()` - Registration confirmation
- `generateWaitlistEmailHTML()` - Waitlist notification
- `generateReminderEmailHTML()` - 24-hour reminder
- `generatePromotionEmailHTML()` - Waitlist promotion

### Styling

All pages use Clover ERA design system with CSS variables:
- Primary Teal: `#46AEB8`
- Deep Teal: `#0D7C88`
- Charcoal: `#1F2937`

Edit inline `<style>` tags in each HTML file to customize.

---

## Monitoring and Analytics

### Database Queries for Insights

```sql
-- Total registrations by topic
SELECT
    r.topic,
    COUNT(reg.id) as total_registrations
FROM roundtables r
LEFT JOIN registrations reg ON r.id = reg.roundtable_id
GROUP BY r.topic;

-- Conversion rate (registered vs waitlisted)
SELECT
    COUNT(CASE WHEN is_waitlist = false THEN 1 END) as confirmed,
    COUNT(CASE WHEN is_waitlist = true THEN 1 END) as waitlisted,
    ROUND(
        COUNT(CASE WHEN is_waitlist = false THEN 1 END)::numeric /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) as confirmation_rate
FROM registrations;

-- Attendance tracking (after sessions)
SELECT
    r.topic,
    r.scheduled_at,
    COUNT(CASE WHEN reg.status = 'attended' THEN 1 END) as attended,
    COUNT(CASE WHEN reg.status = 'no_show' THEN 1 END) as no_show
FROM roundtables r
LEFT JOIN registrations reg ON r.id = reg.roundtable_id
WHERE r.status = 'completed'
GROUP BY r.id, r.topic, r.scheduled_at
ORDER BY r.scheduled_at DESC;
```

---

## Troubleshooting

### Emails Not Sending

1. Check SendGrid dashboard for bounces/blocks
2. Verify API key is correct
3. Check sender email is verified in SendGrid
4. Look at Vercel function logs for errors

### Zoom Meetings Not Creating

1. Verify all Zoom credentials are set
2. Check OAuth app has correct scopes
3. Test Zoom API independently
4. Meetings can be added manually in admin dashboard

### Database Errors

1. Check Supabase is reachable
2. Verify service role key (not anon key) is used
3. Check RLS policies allow operations
4. Review Supabase logs for detailed errors

### Registration Form Issues

1. Check browser console for JavaScript errors
2. Verify API endpoints are deployed
3. Test API routes directly using Postman/curl
4. Check CORS headers in API responses

---

## Security Considerations

1. **Admin Dashboard**: Add authentication before production use
2. **API Rate Limiting**: Consider adding rate limits to prevent abuse
3. **Input Validation**: All inputs are validated on both client and server
4. **SQL Injection**: Using Supabase parameterized queries prevents SQL injection
5. **XSS**: All user inputs are escaped before displaying
6. **Environment Variables**: Never commit secrets to git

---

## Next Steps

### Recommended Enhancements

1. **Authentication**: Add password protection to admin dashboard
2. **Analytics**: Track conversion rates and attendance
3. **Notifications**: SMS reminders via Twilio
4. **Calendar Integration**: Direct Google Calendar/Outlook integration
5. **Post-Session Survey**: Collect feedback after each roundtable
6. **LinkedIn Integration**: Share upcoming sessions on LinkedIn automatically
7. **CRM Integration**: Sync registrations to your CRM

---

## Support

For questions or issues:
- Email: contact@cloverera.com
- Phone: (212) 918-4448

## Documentation

- [Supabase Docs](https://supabase.com/docs)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- [Zoom API Docs](https://marketplace.zoom.us/docs/api-reference/)
- [Vercel Docs](https://vercel.com/docs)

---

## File Structure

```
clover-era-page/
├── manager-roundtable.html              # Landing page
├── manager-roundtable-register.html     # Registration form
├── manager-roundtable-confirmation.html # Confirmation page
├── admin/
│   └── roundtable-dashboard.html        # Admin dashboard
├── api/
│   └── roundtables/
│       ├── upcoming.js                  # Get upcoming sessions
│       ├── [id].js                      # Get specific session
│       ├── register.js                  # Registration handler
│       └── registration/
│           └── [id].js                  # Get registration details
├── database/
│   └── schema.sql                       # Database schema
├── utils/
│   ├── email.js                         # Email templates and sending
│   ├── calendar.js                      # iCal generation
│   └── zoom.js                          # Zoom API integration
├── package.json                         # Dependencies
└── ROUNDTABLE-SETUP.md                  # This file
```

---

## License

© 2025 Clover ERA - All Rights Reserved
