# Manager Roundtable - Quick Start Guide

Get your roundtable system up and running in 30 minutes!

## Prerequisites Checklist

Before you begin, create accounts and gather credentials for:

- [ ] Supabase account
- [ ] SendGrid account
- [ ] Zoom account (with Server-to-Server OAuth app)
- [ ] Vercel account (already set up)

---

## 5-Step Setup

### Step 1: Set Up Database (10 minutes)

1. Log in to [Supabase](https://supabase.com)
2. Go to SQL Editor
3. Copy/paste contents of `database/schema.sql`
4. Click "Run"
5. Copy/paste contents of `database/sample-roundtables.sql`
6. Click "Run" to create sample sessions
7. Note your credentials:
   - `SUPABASE_URL` (Project Settings > API > Project URL)
   - `SUPABASE_SERVICE_KEY` (Project Settings > API > service_role key)

### Step 2: Set Up Email (5 minutes)

1. Log in to [SendGrid](https://sendgrid.com)
2. Verify sender email: `contact@cloverera.com`
3. Go to Settings > API Keys
4. Create new API key with "Full Access"
5. Copy and save as `SENDGRID_API_KEY`

### Step 3: Set Up Zoom (5 minutes)

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Click "Develop" > "Build App"
3. Choose "Server-to-Server OAuth"
4. Fill in app details:
   - App name: "Clover ERA Roundtables"
   - Company: "Clover ERA"
5. Add scopes:
   - `meeting:write:admin`
   - `meeting:read:admin`
6. Copy credentials:
   - `ZOOM_ACCOUNT_ID`
   - `ZOOM_CLIENT_ID`
   - `ZOOM_CLIENT_SECRET`

### Step 4: Configure Environment (5 minutes)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your clover-era-page project
3. Go to Settings > Environment Variables
4. Add all 6 variables:

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
SENDGRID_API_KEY
ZOOM_ACCOUNT_ID
ZOOM_CLIENT_ID
ZOOM_CLIENT_SECRET
```

### Step 5: Deploy (5 minutes)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Commit and push:
   ```bash
   git add .
   git commit -m "Add Manager Roundtable system"
   git push origin main
   ```

3. Vercel will auto-deploy (or use `vercel --prod`)

---

## Test Your Setup

### Test 1: View Landing Page

Visit: `https://cloverera.com/manager-roundtable.html`

You should see upcoming roundtables listed.

### Test 2: Complete a Registration

1. Click "Register Now" on any session
2. Fill out the form
3. Submit
4. Check your email for confirmation with calendar invite

### Test 3: Access Admin Dashboard

Visit: `https://cloverera.com/admin/roundtable-dashboard.html`

You should see:
- Session statistics
- List of upcoming roundtables
- Registration counts

**Note:** Add authentication to this page before sharing publicly!

---

## Your First LinkedIn Post

Once set up, share your roundtable on LinkedIn:

```
🎯 Free Manager Roundtable: The 30-Day Warning System

Have you ever been blindsided by a resignation?

I'm hosting a 30-min peer roundtable on Tuesday at noon ET for managers who want to spot the warning signs 30 days before someone quits.

✓ 6 managers max
✓ Zero sales pitch
✓ Practical tactics you can use immediately
✓ Neuroscience-backed insights

Register: https://cloverera.com/manager-roundtable.html

#management #leadership #employeeretention
```

---

## Creating More Sessions

### Via Admin Dashboard

1. Go to `/admin/roundtable-dashboard.html`
2. Click "Create New Session"
3. Select topic, date, time
4. Save

### Via SQL (Batch Create)

Edit `database/sample-roundtables.sql` with your dates and run in Supabase.

### Recommended Schedule

Run 2 sessions per week:
- **Tuesday 12pm ET** - Topic A
- **Thursday 12pm ET** - Topic B

Rotate through the 4 topics every 2 weeks.

---

## Monitoring Registration Flow

### Check Recent Registrations

In Supabase SQL Editor:

```sql
SELECT
    r.name,
    r.email,
    r.company,
    r.role,
    rt.topic,
    rt.scheduled_at,
    r.is_waitlist,
    r.confirmation_sent,
    r.registered_at
FROM registrations r
JOIN roundtables rt ON r.roundtable_id = rt.id
ORDER BY r.registered_at DESC
LIMIT 10;
```

### Check Session Fill Rates

```sql
SELECT
    topic,
    scheduled_at,
    registered_count,
    max_participants,
    ROUND(registered_count::numeric / max_participants * 100, 0) as fill_rate_pct
FROM upcoming_roundtables
ORDER BY scheduled_at;
```

---

## Common Issues & Fixes

### "No sessions available"

**Problem:** Landing page shows no sessions
**Fix:** Run `database/sample-roundtables.sql` to create sample sessions

### Email not received

**Problem:** Confirmation email not arriving
**Fix:**
1. Check spam folder
2. Verify SendGrid API key is correct
3. Check Vercel function logs for errors
4. Verify sender email is verified in SendGrid

### Zoom link missing

**Problem:** Email received but no Zoom link
**Fix:**
1. Check Zoom credentials in Vercel env vars
2. Verify Zoom OAuth app has correct scopes
3. Manually add Zoom link in admin dashboard
4. Check Vercel function logs for Zoom API errors

---

## Next Steps

1. **Test End-to-End**: Register for a real session and attend
2. **Add LinkedIn Link**: Share on LinkedIn to drive registrations
3. **Monitor Registrations**: Check daily in admin dashboard
4. **Send Reminders**: Set up automated 24h reminder emails
5. **Collect Feedback**: Survey attendees after sessions
6. **Iterate**: Adjust topics and timing based on what fills fastest

---

## Support Resources

- **Full Documentation**: See `ROUNDTABLE-SETUP.md`
- **Database Schema**: See `database/schema.sql`
- **Sample Data**: See `database/sample-roundtables.sql`
- **Email**: contact@cloverera.com
- **Phone**: (212) 918-4448

---

## Key URLs

- **Landing Page**: `/manager-roundtable.html`
- **Admin Dashboard**: `/admin/roundtable-dashboard.html`
- **Supabase Dashboard**: https://supabase.com/dashboard
- **SendGrid Dashboard**: https://app.sendgrid.com
- **Zoom App Dashboard**: https://marketplace.zoom.us/user/build
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## Success Metrics to Track

After your first month, measure:

1. **Conversion Rate**: LinkedIn clicks → Registrations
2. **Fill Rate**: % of sessions that fill to capacity
3. **Show-Up Rate**: % of registered who actually attend
4. **Waitlist Demand**: How many people join waitlists
5. **Demo Bookings**: % who book ERA demo after attending

Target benchmarks:
- Fill rate: 80%+ (5-6 people per session)
- Show-up rate: 70%+ (4-5 people attend)
- Demo conversion: 30%+ (2+ book demos)

---

Ready to launch? Start with Step 1! 🚀
