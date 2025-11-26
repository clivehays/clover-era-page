# Retention Reality Roundtable - Complete Setup Guide

This guide will walk you through setting up the complete Roundtable system from database to deployment.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Frontend Configuration](#frontend-configuration)
5. [Email Automation Setup](#email-automation-setup)
6. [Admin Access Configuration](#admin-access-configuration)
7. [Testing Checklist](#testing-checklist)
8. [Deployment](#deployment)
9. [Maintenance & Monitoring](#maintenance--monitoring)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    cloverera.com/roundtable                 │
│                      (Landing Page)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                cloverera.com/roundtable/apply               │
│                   (Application Form)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                       │
│   - roundtable_applications (with auto-scoring)             │
│   - roundtable_cohorts                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┬──────────────┐
         ▼                               ▼              ▼
┌─────────────────┐         ┌─────────────────┐  ┌──────────┐
│  Admin Dashboard│         │ Email Automation│  │  Webhooks│
│   (CRM Portal)  │         │  (Your choice)  │  │ (Optional)
└─────────────────┘         └─────────────────┘  └──────────┘
```

---

## Prerequisites

Before starting, make sure you have:

- [ ] Supabase account (free tier works fine)
- [ ] Access to cloverera.com hosting/deployment
- [ ] Email service account (Resend, SendGrid, or ConvertKit)
- [ ] Zoom account for meeting links
- [ ] Text editor

---

## Database Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project:
   - **Name:** clover-era-roundtable
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
3. Wait 2-3 minutes for project to provision

### Step 2: Run Database Migration

1. In your Supabase project, go to **SQL Editor**
2. Open the file: `crm/roundtable-schema.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify success - should see "Success. No rows returned"

### Step 3: Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see two new tables:
   - `roundtable_applications`
   - `roundtable_cohorts`
3. Check the `roundtable_cohorts` table - should have 1 sample row

### Step 4: Get API Credentials

1. Go to **Settings** > **API** in Supabase
2. Copy these values (you'll need them):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Frontend Configuration

### Step 1: Update Supabase Credentials

You need to update the Supabase credentials in **3 files**:

#### File 1: Landing Page
**Path:** `roundtable/index.html`

Find these lines (around line 272):
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your actual values:
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...your-key-here';
```

#### File 2: Application Form
**Path:** `roundtable/apply/index.html`

Find these lines (around line 381):
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your actual values.

#### File 3: Admin Dashboard
**Path:** `crm/roundtable-admin.html`

Find these lines (around line 424):
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your actual values.

### Step 2: Update Brand Links

In **landing page** (`roundtable/index.html`):
- Line 302: Update footer link if needed
- Verify all relative paths work with your site structure

In **thank you page** (`roundtable/thank-you/index.html`):
- Line 125: Update "Return to Clover ERA" link if needed
- Line 113: Verify email address is correct (clive@cloverera.com)

### Step 3: Test Locally (Optional but Recommended)

If you have a local server:
```bash
cd clover-era-page
python -m http.server 8000
# Then visit: http://localhost:8000/roundtable/
```

Or use VS Code Live Server extension.

---

## Email Automation Setup

You have multiple options for email automation. Choose one:

### Option A: Supabase Edge Functions + Resend (Recommended)

**Pros:** Free tier generous, full control, fastest
**Cons:** Requires some coding

**Setup:**

1. **Create Resend Account**
   - Go to [resend.com](https://resend.com)
   - Sign up (free for 100 emails/day)
   - Verify your domain (cloverera.com)
   - Get API key from dashboard

2. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   supabase login
   supabase init
   ```

3. **Create Edge Function**
   ```bash
   supabase functions new roundtable-emails
   ```

4. **Add Email Function Code**
   Create file: `supabase/functions/roundtable-emails/index.ts`

   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

   serve(async (req) => {
     const { type, application_id, status } = await req.json()

     // Get application data
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL')!,
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
     )

     const { data: app } = await supabase
       .from('roundtable_applications')
       .select('*')
       .eq('id', application_id)
       .single()

     // Send email based on type
     let emailTemplate = getEmailTemplate(type, app)

     const response = await fetch('https://api.resend.com/emails', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${RESEND_API_KEY}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         from: 'Clive Hays <clive@cloverera.com>',
         to: app.email,
         subject: emailTemplate.subject,
         text: emailTemplate.body
       })
     })

     // Track email sent
     await supabase
       .from('roundtable_applications')
       .update({
         emails_sent: [...app.emails_sent, {
           type,
           sent_at: new Date().toISOString()
         }]
       })
       .eq('id', application_id)

     return new Response(JSON.stringify({ success: true }), {
       headers: { 'Content-Type': 'application/json' }
     })
   })
   ```

5. **Deploy Function**
   ```bash
   supabase functions deploy roundtable-emails --no-verify-jwt
   ```

6. **Set Secrets**
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_key_here
   ```

7. **Create Database Trigger**
   In Supabase SQL Editor, run:
   ```sql
   -- See ROUNDTABLE-EMAIL-TEMPLATES.md for trigger code
   ```

### Option B: ConvertKit (Easier, Paid)

**Pros:** No coding, visual automation, reliable
**Cons:** $29/month, less customizable

**Setup:**

1. **Create ConvertKit Account**
   - Go to [convertkit.com](https://convertkit.com)
   - Sign up for Creator plan ($29/mo)

2. **Create Custom Fields**
   - Go to **Settings** > **Custom Fields**
   - Create fields matching your database columns:
     - `full_name`
     - `company_name`
     - `title`
     - `application_status`
     - `cohort_date`
     - `cohort_time`
     - `zoom_link`

3. **Create Tags**
   - `roundtable-pending`
   - `roundtable-accepted`
   - `roundtable-waitlisted`
   - `roundtable-declined`
   - `roundtable-attended`
   - `roundtable-high-intent`
   - `roundtable-medium-intent`
   - `roundtable-low-intent`

4. **Import Email Templates**
   - Create each email from `ROUNDTABLE-EMAIL-TEMPLATES.md`
   - Use ConvertKit's email builder
   - Add personalization tokens

5. **Create Automations**
   - **Automation 1:** Application Received
     - Trigger: Subscribed with tag `roundtable-pending`
     - Action: Send "Application Received" email immediately

   - **Automation 2:** Accepted
     - Trigger: Tag added `roundtable-accepted`
     - Action: Send "You're In" email immediately

   - **Automation 3:** 2-Day Reminder
     - Trigger: Tag `roundtable-accepted` + 2 days before `cohort_date`
     - Action: Send reminder email

   - Continue for all emails...

6. **Connect Supabase to ConvertKit**
   - Use Zapier or Make.com:
     - Trigger: New row in `roundtable_applications`
     - Action: Add subscriber to ConvertKit with appropriate tag

### Option C: Make.com / Zapier Bridge

**Pros:** Visual workflow, connects anything
**Cons:** ~$15-30/month, usage limits

**Setup:**

1. Create account on [make.com](https://make.com) or [zapier.com](https://zapier.com)

2. **Scenario 1: New Application**
   - Trigger: Supabase - Watch Rows
   - Filter: New rows only
   - Action: Send email via Gmail/SendGrid/Resend
   - Action: Update Supabase row with email tracking

3. **Scenario 2: Status Change**
   - Trigger: Supabase - Watch Rows
   - Filter: Status changed
   - Router: Branch by status (accepted/waitlisted/declined)
   - Action: Send appropriate email
   - Action: Update email tracking

4. **Scenario 3: Scheduled Reminders**
   - Trigger: Schedule (run daily)
   - Action: Get cohorts happening in 2 days
   - Action: Get accepted applications for those cohorts
   - Iterator: For each application
   - Action: Send reminder email

---

## Admin Access Configuration

### Step 1: Set Up Admin Authentication

Your CRM already has auth set up. To access Roundtable admin:

1. Go to `crm/roundtable-admin.html` in your browser
2. You'll need to be logged in to your CRM first
3. Navigate to: `https://cloverera.com/crm/roundtable-admin.html`

### Step 2: Update CRM Navigation

Add Roundtable link to your main CRM navigation.

In `crm/index.html` (or wherever your CRM nav is), add:
```html
<a href="roundtable-admin.html">Roundtable</a>
```

### Step 3: Restrict Public Access

Make sure `/crm/` directory is password protected or requires login.

Add to `.htaccess` if using Apache:
```apache
<FilesMatch "^roundtable-admin\.html$">
  Require valid-user
</FilesMatch>
```

Or use Supabase RLS policies (already included in schema).

---

## Testing Checklist

Before going live, test everything:

### Database Tests

- [ ] Can insert a test application
- [ ] Score calculates automatically
- [ ] Can update application status
- [ ] Can create a cohort
- [ ] Foreign key relationship works (cohort_id)

### Frontend Tests

#### Landing Page
- [ ] Page loads without errors (check browser console)
- [ ] Cohort date/time displays correctly
- [ ] "Apply Now" buttons link to form
- [ ] Page is responsive on mobile
- [ ] All sections render properly

#### Application Form
- [ ] All fields display correctly
- [ ] Required validation works
- [ ] LinkedIn URL validation works
- [ ] Character counter works for challenge field
- [ ] Conditional fields show/hide (industry other, referral source other)
- [ ] Form submits successfully
- [ ] Application appears in database
- [ ] Score calculates correctly (check database)
- [ ] Redirects to thank you page after submit

#### Thank You Page
- [ ] Page displays after successful submission
- [ ] Email link works
- [ ] Return button works

#### Admin Dashboard
- [ ] Login required to access
- [ ] Applications table loads
- [ ] Stats calculate correctly
- [ ] Filters work (status, size, score, search)
- [ ] Can view application details in modal
- [ ] Can update application status
- [ ] Status updates reflect immediately
- [ ] Cohorts tab loads
- [ ] Can view cohort details

### Email Tests

- [ ] Application received email sends immediately
- [ ] Accepted email sends when status changed
- [ ] Waitlisted email sends when status changed
- [ ] Declined email sends when status changed
- [ ] Emails contain correct personalization
- [ ] Emails track in database (emails_sent field)
- [ ] Reply-to address is correct
- [ ] Emails pass spam filters (test with mail-tester.com)

### End-to-End Test

Complete this full workflow:

1. Submit application via form
2. Verify application in database with correct score
3. Check immediate email received
4. Log into admin dashboard
5. Find and view application
6. Accept application
7. Verify acceptance email sent
8. Check calendar invite attached (if implemented)
9. Verify application shows as "accepted" in dashboard

---

## Deployment

### Option 1: Deploy to Existing Site (Recommended)

If cloverera.com is already hosted:

1. **Upload Files**
   - Upload entire `roundtable/` folder to your web root
   - Upload `crm/roundtable-admin.html` to CRM folder
   - Upload `crm/roundtable-schema.sql` for reference

2. **Verify URLs Work**
   - Test: `https://cloverera.com/roundtable/`
   - Test: `https://cloverera.com/roundtable/apply/`
   - Test: `https://cloverera.com/roundtable/thank-you/`
   - Test: `https://cloverera.com/crm/roundtable-admin.html` (requires login)

3. **Update Sitemap**
   Add to your sitemap.xml:
   ```xml
   <url>
     <loc>https://cloverera.com/roundtable/</loc>
     <changefreq>monthly</changefreq>
     <priority>0.8</priority>
   </url>
   ```

### Option 2: Deploy via Git

If using GitHub Pages or similar:

```bash
cd clover-era-page
git add roundtable/
git add crm/roundtable-admin.html
git add crm/roundtable-schema.sql
git add crm/ROUNDTABLE-*.md
git commit -m "Add Retention Reality Roundtable system"
git push origin main
```

### Option 3: Deploy to Netlify/Vercel

1. Connect your repo to Netlify or Vercel
2. Set build command: `(none)`
3. Set publish directory: `./`
4. Deploy

---

## Maintenance & Monitoring

### Weekly Tasks

- [ ] Review new applications (should be notified via email)
- [ ] Accept/waitlist/decline pending applications
- [ ] Check email delivery logs
- [ ] Respond to applicant replies
- [ ] Update next cohort date if needed

### Before Each Cohort (1 week prior)

- [ ] Verify all accepted attendees received confirmation
- [ ] Test Zoom link works
- [ ] Prepare recording setup
- [ ] Review attendee list and prepare personalization notes
- [ ] Send manual reminder if needed

### After Each Cohort (same day)

- [ ] Mark attendees as `attended = true` in database
- [ ] Tag high/medium/low intent based on participation
- [ ] Upload recording to storage
- [ ] Update cohort record with recording link
- [ ] Add notes about each attendee for follow-up personalization

### Monthly Tasks

- [ ] Review email open rates and adjust copy if needed
- [ ] Check database backup (Supabase does this automatically)
- [ ] Review conversion metrics (applications → CEO intros)
- [ ] Update FAQ if common questions emerge
- [ ] Create new cohort for next month

### Monitoring

Set up alerts for:

1. **Application Volume**
   - Alert if > 20 applications in 24 hours (might indicate spam)
   - Alert if 0 applications in 7 days (marketing issue)

2. **Email Failures**
   - Monitor email bounce rate
   - Check spam complaints
   - Watch for delivery failures

3. **System Errors**
   - Monitor browser console for JavaScript errors
   - Check Supabase logs for database errors
   - Watch email automation logs

### Scaling Considerations

As your roundtable grows:

1. **Database Performance**
   - Current setup handles 10,000+ applications easily
   - Add indexes if queries slow down

2. **Email Volume**
   - Free Resend tier: 100/day
   - Upgrade to paid plan if needed ($20/mo for 50k/mo)

3. **Storage**
   - Store recordings in Supabase Storage or YouTube (unlisted)
   - Recordings can be large - plan for 1-2 GB per cohort

4. **Admin Time**
   - Consider batch reviewing applications (once daily)
   - Create templates for personalized follow-ups
   - Use AI to draft personalized sections (then edit heavily)

---

## Troubleshooting

### "Applications not showing in database"

**Check:**
1. Open browser console (F12) - any errors?
2. Is Supabase URL correct in form?
3. Are RLS policies enabled? (They should allow public inserts)
4. Try inserting via Supabase dashboard directly

**Fix:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM roundtable_applications ORDER BY created_at DESC LIMIT 5;
-- If empty, RLS might be blocking inserts
```

### "Score not calculating"

**Check:**
1. Look at application record - is score = 0?
2. Check trigger is enabled

**Fix:**
```sql
-- Manually calculate score for existing records
UPDATE roundtable_applications
SET score = calculate_roundtable_score(
  company_size,
  industry,
  resignations_12mo,
  surprise_departures,
  escalation_experience,
  ceo_intro_openness
)
WHERE score = 0;
```

### "Emails not sending"

**Check:**
1. Is email automation connected?
2. Check email service logs (Resend/ConvertKit dashboard)
3. Look for bounces or spam complaints
4. Verify sender domain is verified

**Fix:**
- Test with a personal email first
- Check spam folder
- Verify SPF/DKIM records for domain

### "Admin dashboard won't load"

**Check:**
1. Are you logged in to CRM?
2. Is Supabase URL correct?
3. Browser console errors?

**Fix:**
- Clear browser cache
- Check authentication
- Verify RLS policies allow reads for authenticated users

---

## Questions for Clive Before Launch

Before launching this system, get answers to these:

1. **First Cohort Details**
   - What date for first roundtable?
   - What time and timezone?
   - Do you have Zoom link ready?

2. **Email Setup**
   - Which email automation option do you prefer?
   - Do you want help setting it up?
   - Should emails come from clive@cloverera.com or different address?

3. **Auto-Accept or Manual Review?**
   - Should high-score applications (60+) auto-accept?
   - Or do you want to manually review all applications?

4. **Marketing**
   - When do you want to announce this?
   - LinkedIn post ready?
   - Any other promotion channels?

5. **Capacity**
   - How many cohorts do you want to run per quarter?
   - What's your max number of cohorts you can facilitate per month?

6. **Follow-up Process**
   - Who drafts the personalized follow-up emails (high-intent)?
   - Do you want a template or write from scratch each time?
   - Should system create drafts for you to edit?

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Resend Docs:** https://resend.com/docs
- **ConvertKit Support:** https://help.convertkit.com
- **Make.com Academy:** https://www.make.com/en/academy

**Need help?** Check the files:
- `ROUNDTABLE-EMAIL-TEMPLATES.md` - All email copy
- `roundtable-schema.sql` - Database structure
- This guide!

---

## Launch Checklist

Final checks before going live:

- [ ] Database schema deployed and tested
- [ ] All 3 HTML files have correct Supabase credentials
- [ ] Application form tested end-to-end
- [ ] First cohort created in database
- [ ] Email automation connected and tested
- [ ] Admin dashboard accessible and functional
- [ ] Test application submitted and reviewed
- [ ] All emails tested and received
- [ ] Landing page reviewed for typos
- [ ] Mobile responsive tested
- [ ] Analytics tracking added (if desired)
- [ ] Sitemap updated
- [ ] Internal team notified
- [ ] Launch post drafted
- [ ] Zoom meeting scheduled

**Ready to launch?** Deploy and announce!

Good luck with your Retention Reality Roundtable! 🍀
