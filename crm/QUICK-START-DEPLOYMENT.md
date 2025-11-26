# Quick Start Deployment Guide

This is a streamlined deployment guide for your specific configuration.

## Your Configuration

- **First Cohort:** Thursday, December 4, 2025 at 12:00 PM EST (17:00 GMT)
- **Platform:** Microsoft Teams
- **Meeting Link:** [Your Teams link configured]
- **Email:** Supabase Edge Functions + Resend
- **Review:** Manual (no auto-accept)
- **Announcement:** Wednesday, November 27, 2024

---

## Step 1: Supabase Setup (15 minutes)

### 1.1 Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name:** clover-era-roundtable
   - **Database Password:** _(generate and save securely)_
   - **Region:** US East (closest to you)
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

### 1.2 Run Database Schema

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Open file: `crm/roundtable-schema.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click **RUN** (or Cmd/Ctrl + Enter)
7. Should see: "Success. No rows returned"

### 1.3 Create First Cohort

1. Stay in SQL Editor
2. Click "New query"
3. Open file: `crm/roundtable-first-cohort.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click **RUN**
7. Should see: "First Cohort Created!" with your details

### 1.4 Get API Credentials

1. Go to **Settings** > **API** (left sidebar)
2. Copy these values (you'll need them):
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJ...` (long string)
3. Save these somewhere safe

---

## Step 2: Configure Frontend (10 minutes)

You need to update Supabase credentials in **3 files**.

### 2.1 Landing Page

**File:** `roundtable/index.html`

1. Open the file
2. Find line ~272 (search for `YOUR_SUPABASE_URL`)
3. Replace:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   With:
   ```javascript
   const SUPABASE_URL = 'https://xxxxx.supabase.co'; // Your Project URL
   const SUPABASE_ANON_KEY = 'eyJ...'; // Your anon public key
   ```
4. Save file

### 2.2 Application Form

**File:** `roundtable/apply/index.html`

1. Open the file
2. Find line ~381 (search for `YOUR_SUPABASE_URL`)
3. Replace with your actual credentials (same as above)
4. Save file

### 2.3 Admin Dashboard

**File:** `crm/roundtable-admin.html`

1. Open the file
2. Find line ~424 (search for `YOUR_SUPABASE_URL`)
3. Replace with your actual credentials (same as above)
4. Save file

---

## Step 3: Email Automation Setup (45-60 minutes)

### 3.1 Create Resend Account

1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up with your email
3. Verify your email address

### 3.2 Add Domain

1. In Resend dashboard, go to **Domains**
2. Click "Add Domain"
3. Enter: `cloverera.com`
4. Follow instructions to add DNS records:
   - Add SPF record: `v=spf1 include:_spf.resend.com ~all`
   - Add DKIM records (provided by Resend)
5. Wait 5-10 minutes for DNS propagation
6. Click "Verify" in Resend

### 3.3 Get Resend API Key

1. In Resend, go to **API Keys**
2. Click "Create API Key"
3. Name: "Roundtable Emails"
4. Copy the key (starts with `re_...`)
5. Save it securely - you won't see it again

### 3.4 Install Supabase CLI

Open terminal/command prompt:

```bash
npm install -g supabase
```

Or if you don't have npm:
- **macOS:** `brew install supabase/tap/supabase`
- **Windows:** Download from [Supabase GitHub releases](https://github.com/supabase/cli/releases)

### 3.5 Login to Supabase CLI

```bash
supabase login
```

Follow the prompts to authenticate.

### 3.6 Link to Your Project

```bash
cd C:\Users\Administrator\clover-era-page
supabase init
supabase link --project-ref YOUR_PROJECT_REF
```

Get `YOUR_PROJECT_REF` from Supabase dashboard URL:
- URL looks like: `https://supabase.com/dashboard/project/xxxxx`
- The `xxxxx` is your project ref

### 3.7 Create Edge Function

```bash
supabase functions new roundtable-emails
```

This creates: `supabase/functions/roundtable-emails/index.ts`

### 3.8 Add Function Code

1. Open `supabase/functions/roundtable-emails/index.ts`
2. Delete any existing code
3. Copy contents from `crm/supabase-edge-function-template.ts`
4. Paste into `index.ts`
5. Save file

### 3.9 Set Secrets

```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
```

Replace `re_your_key_here` with your actual Resend API key.

### 3.10 Deploy Function

```bash
supabase functions deploy roundtable-emails --no-verify-jwt
```

You should see:
```
Deployed Function roundtable-emails
URL: https://xxxxx.supabase.co/functions/v1/roundtable-emails
```

**Copy this URL!** You need it for the next step.

### 3.11 Enable Database Triggers

1. Go back to Supabase dashboard > **SQL Editor**
2. Open file: `crm/email-automation-trigger.sql`
3. Find line 21: `v_edge_function_url TEXT := 'YOUR_EDGE_FUNCTION_URL';`
4. Replace `YOUR_EDGE_FUNCTION_URL` with the function URL from step 3.10
5. Find line 62: Same replacement
6. Copy entire file contents
7. Paste into SQL Editor
8. Click **RUN**
9. Should see: "Success. No rows returned"

### 3.12 Test Email System

In Supabase SQL Editor, run:

```sql
-- Insert a test application
INSERT INTO roundtable_applications (
  full_name,
  email,
  linkedin_url,
  company_name,
  title,
  direct_reports,
  company_size,
  industry,
  resignations_12mo,
  surprise_departures,
  escalation_experience,
  current_challenge,
  ceo_intro_openness,
  referral_source,
  available_for_date
) VALUES (
  'Test Manager',
  'your-email@example.com',  -- USE YOUR EMAIL HERE
  'https://linkedin.com/in/test',
  'Test Company',
  'Engineering Manager',
  '6-10',
  '200-500',
  'SaaS / Software',
  '3-5',
  'A few caught me off guard',
  ARRAY['They say they''ll look into it but nothing changes'],
  'We have high turnover but leadership doesn''t seem concerned. Multiple key engineers have left in the past 6 months.',
  'Yes, I''d want them to hear this',
  'Testing',
  true
);
```

**Check your email!** You should receive "Application received" email within 30 seconds.

If it works, delete the test:
```sql
DELETE FROM roundtable_applications WHERE email = 'your-email@example.com';
```

---

## Step 4: Deploy to cloverera.com (15 minutes)

### 4.1 Upload Files

Upload these directories/files to your web server:

```
cloverera.com/
├── roundtable/
│   ├── index.html
│   ├── apply/
│   │   └── index.html
│   └── thank-you/
│       └── index.html
└── crm/
    └── roundtable-admin.html
```

### 4.2 Test URLs

Visit and verify each page loads:

1. `https://cloverera.com/roundtable/` - Should show landing page
2. `https://cloverera.com/roundtable/apply/` - Should show application form
3. `https://cloverera.com/roundtable/thank-you/` - Should show thank you page
4. `https://cloverera.com/crm/roundtable-admin.html` - Should require login

### 4.3 Submit Test Application

1. Go to `https://cloverera.com/roundtable/apply/`
2. Fill out form with your email
3. Submit
4. Check:
   - Redirects to thank you page
   - Email received
   - Application appears in database
   - Score calculated

### 4.4 Test Admin Dashboard

1. Login to your CRM
2. Go to `https://cloverera.com/crm/roundtable-admin.html`
3. Check:
   - Applications load
   - Stats display correctly
   - Can view application details
   - Can change status (test accept → should trigger email)

---

## Step 5: Pre-Launch Checklist

Before announcing on November 27:

- [ ] Supabase database running
- [ ] First cohort created (Dec 4, 12pm EST)
- [ ] All 3 frontend pages have correct Supabase credentials
- [ ] Test application submitted successfully
- [ ] Email automation working (test received email)
- [ ] Admin dashboard accessible
- [ ] Can accept/waitlist/decline applications
- [ ] Status change emails sending
- [ ] Mobile responsive tested
- [ ] Teams meeting link tested

---

## Step 6: Launch Day (November 27)

### Morning of Launch

1. **Final Test**
   - Submit one more test application
   - Accept it
   - Verify all emails send

2. **Prepare LinkedIn Post**
   - Draft in advance
   - Include link: `https://cloverera.com/roundtable/`
   - Mention: Free, application-based, 10 spots, Dec 4
   - Use your authentic voice (not AI-sounding)

3. **Monitor for First Applications**
   - Check Supabase dashboard regularly
   - Or set up Slack webhook for new applications

### Post-Launch Monitoring

**First 24 hours:**
- Check applications every 4-6 hours
- Respond to any questions via email
- Monitor for any system errors

**First week:**
- Review applications within 48 hours (as promised)
- Accept top 10 based on score + fit
- Waitlist others
- Send personalized notes if needed

---

## Ongoing Workflow

### When New Application Arrives

1. Get email notification (auto-sent)
2. Login to admin dashboard
3. View application details
4. Check:
   - Score (60+ = high priority)
   - Company size (200-500 ideal)
   - Current challenge (is it real/specific?)
   - LinkedIn profile (verify legitimacy)
5. Make decision:
   - **Accept:** Click "Accept" → auto-sends confirmation
   - **Waitlist:** Click "Waitlist" → auto-sends waitlist email
   - **Decline:** Click "Decline" → auto-sends decline email

### 2 Days Before Cohort (Dec 2)

1. Verify all accepted attendees
2. Send 2-day reminder (this will auto-send via scheduled function)
3. Prepare for session:
   - Test Teams link
   - Review attendee backgrounds
   - Prepare personalization notes

### Day of Cohort (Dec 4)

1. 1-hour reminder auto-sends
2. Join Teams 5 minutes early
3. Start recording
4. Run session (60 minutes)
5. Take notes on each manager:
   - High/medium/low intent
   - Specific challenges mentioned
   - Spoke 2+ times?

### After Cohort (Same Day)

1. Upload recording somewhere accessible
2. Update cohort record with recording link
3. Mark who attended in admin dashboard
4. Tag intent levels (high/medium/low)
5. Add notes about personalization for follow-ups
6. Post-event email auto-sends 2 hours after

### 3 Days After Cohort (Dec 7)

1. Review high-intent attendees
2. Draft personalized follow-ups (reference their specific challenge)
3. Send high/medium/low intent emails
4. Track replies

---

## Troubleshooting

### "Application form not submitting"

**Check:**
1. Browser console (F12) - any errors?
2. Supabase credentials correct in `apply/index.html`?
3. Network tab - is request to Supabase failing?

**Fix:**
- Double-check Supabase URL and API key
- Ensure RLS policies allow public inserts (they should)

### "Emails not sending"

**Check:**
1. Edge Function deployed? `supabase functions list`
2. Secrets set? `supabase secrets list`
3. Resend domain verified?
4. Check Edge Function logs: Supabase Dashboard > Edge Functions > Logs

**Fix:**
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for delivery errors
- Test manually: Run SQL in Supabase to trigger status change

### "Admin dashboard not loading"

**Check:**
1. Logged into CRM?
2. Supabase credentials correct?
3. Browser console errors?

**Fix:**
- Verify authentication
- Check Supabase URL/key in `roundtable-admin.html`
- Clear browser cache

### "Score not calculating"

**Check:**
- View application in Supabase Table Editor
- Is score = 0?

**Fix:**
```sql
-- Recalculate scores
UPDATE roundtable_applications
SET score = calculate_roundtable_score(
  company_size, industry, resignations_12mo,
  surprise_departures, escalation_experience, ceo_intro_openness
)
WHERE score = 0;
```

---

## Support Resources

**Supabase:**
- Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Edge Functions: [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)

**Resend:**
- Docs: [https://resend.com/docs](https://resend.com/docs)
- Support: [support@resend.com](mailto:support@resend.com)

**Your Files:**
- Full setup guide: `ROUNDTABLE-SETUP-GUIDE.md`
- Email templates: `ROUNDTABLE-EMAIL-TEMPLATES.md`
- Implementation summary: `ROUNDTABLE-IMPLEMENTATION-SUMMARY.md`

---

## Quick Reference

**Important URLs:**
- Landing page: `https://cloverera.com/roundtable/`
- Application form: `https://cloverera.com/roundtable/apply/`
- Admin dashboard: `https://cloverera.com/crm/roundtable-admin.html`
- Supabase dashboard: `https://supabase.com/dashboard`
- Resend dashboard: `https://resend.com/emails`

**First Cohort:**
- Date: Thursday, December 4, 2025
- Time: 12:00 PM EST (17:00 GMT)
- Platform: Microsoft Teams
- Spots: 10

**Timeline:**
- Nov 27: Announce on LinkedIn
- Nov 27 - Dec 2: Accept applications
- Dec 2: Registration closes
- Dec 4: Run first cohort
- Dec 7: Send 3-day follow-ups
- Dec 11: Send 7-day content follow-up
- Dec 18: Send 14-day final nudge (high-intent only)

---

**Ready to launch? Follow these steps in order and you'll be live before November 27!**

Questions? Re-read the relevant section or check the full `ROUNDTABLE-SETUP-GUIDE.md`.

Good luck! 🍀
