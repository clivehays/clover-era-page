# Retention Reality Roundtable System

Complete lead generation system for the Retention Reality Roundtable program.

## 📁 System Files

### Frontend Pages
- **`index.html`** - Landing page with dynamic cohort info
- **`apply/index.html`** - Application form with validation and auto-scoring
- **`thank-you/index.html`** - Confirmation page after submission

### Backend & Admin (in `/crm/`)
- **`roundtable-schema.sql`** - Database schema with auto-scoring
- **`roundtable-first-cohort.sql`** - First cohort setup (Dec 4, 2025)
- **`roundtable-admin.html`** - Admin dashboard for managing applications
- **`supabase-edge-function-template.ts`** - Email automation function
- **`email-automation-trigger.sql`** - Database triggers for auto-emails

### Documentation (in `/crm/`)
- **`QUICK-START-DEPLOYMENT.md`** - **START HERE** - Streamlined setup guide
- **`ROUNDTABLE-SETUP-GUIDE.md`** - Comprehensive setup documentation
- **`ROUNDTABLE-EMAIL-TEMPLATES.md`** - All 12 email templates
- **`ROUNDTABLE-IMPLEMENTATION-SUMMARY.md`** - System overview
- **`LINKEDIN-ANNOUNCEMENT-TEMPLATE.md`** - Launch post templates

## 🚀 Quick Start

### 1. Database Setup (15 min)
1. Create Supabase project
2. Run `roundtable-schema.sql`
3. Run `roundtable-first-cohort.sql`
4. Copy URL + API key

### 2. Configure Frontend (10 min)
Update Supabase credentials in:
- `roundtable/index.html` (line ~272)
- `roundtable/apply/index.html` (line ~381)
- `crm/roundtable-admin.html` (line ~424)

### 3. Email Automation (45 min)
1. Create Resend account
2. Verify domain
3. Deploy Edge Function
4. Enable database triggers

### 4. Deploy (15 min)
Upload to cloverera.com and test

**Full instructions:** See [`QUICK-START-DEPLOYMENT.md`](../crm/QUICK-START-DEPLOYMENT.md)

## 📊 Features

✅ **Automatic Scoring** - Applications scored 0-100+ based on qualification
✅ **Smart Email Automation** - 12 triggered emails throughout journey
✅ **Professional Admin Dashboard** - Filter, sort, manage applications
✅ **Mobile Responsive** - Works on all devices
✅ **Brand Consistent** - Matches Clover ERA design
✅ **Comprehensive Tracking** - Score, emails, replies, pipeline

## 🎯 First Cohort Details

- **Date:** Thursday, December 4, 2025
- **Time:** 12:00 PM EST (17:00 GMT)
- **Platform:** Microsoft Teams
- **Capacity:** 10 managers
- **Announcement:** November 27, 2024

## 📧 Email Sequence

1. Application Received (immediate)
2. Accepted/Waitlisted/Declined (on status change)
3. 2-Day Reminder (Dec 2)
4. 1-Hour Reminder (Dec 4, 11am)
5. Post-Event Recording (Dec 4, 2pm)
6. High/Medium/Low Intent Follow-ups (Dec 7)
7. Content Follow-up (Dec 11)
8. Final Nudge - High Intent Only (Dec 18)

## 🔧 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Database:** Supabase (PostgreSQL)
- **Email:** Resend via Supabase Edge Functions
- **Platform:** Microsoft Teams
- **Hosting:** Static (works anywhere)

## 📖 Documentation

- **New to the system?** Read [`QUICK-START-DEPLOYMENT.md`](../crm/QUICK-START-DEPLOYMENT.md)
- **Need detailed info?** See [`ROUNDTABLE-SETUP-GUIDE.md`](../crm/ROUNDTABLE-SETUP-GUIDE.md)
- **Preparing launch post?** Use [`LINKEDIN-ANNOUNCEMENT-TEMPLATE.md`](../crm/LINKEDIN-ANNOUNCEMENT-TEMPLATE.md)
- **Want email copy?** Check [`ROUNDTABLE-EMAIL-TEMPLATES.md`](../crm/ROUNDTABLE-EMAIL-TEMPLATES.md)

## 🎨 Customization

### Change Colors
Edit CSS variables in each HTML file:
```css
:root {
  --teal: #46AEB8;           /* Primary brand color */
  --deep-teal: #0D7C88;      /* Darker shade */
  --charcoal: #1F2937;       /* Text and buttons */
}
```

### Modify Scoring
Edit `calculate_roundtable_score()` function in `roundtable-schema.sql`

### Add Form Fields
1. Add field to `apply/index.html`
2. Add column to `roundtable_applications` table
3. Update scoring function if needed
4. Update admin dashboard display

## 🧪 Testing

### Test Application Submission
```sql
-- Run in Supabase SQL Editor
SELECT * FROM roundtable_applications ORDER BY created_at DESC LIMIT 5;
```

### Test Email Trigger
```sql
-- Change status to trigger email
UPDATE roundtable_applications
SET status = 'accepted'
WHERE id = 'application-id-here';
```

### Test Scoring
```sql
-- Recalculate scores
UPDATE roundtable_applications
SET score = calculate_roundtable_score(
  company_size, industry, resignations_12mo,
  surprise_departures, escalation_experience, ceo_intro_openness
);
```

## 📈 Success Metrics

Track these in admin dashboard:

- **Application Quality:** Average score, company size distribution
- **Conversion Funnel:** Visits → Applications → Accepted → Attended
- **Business Impact:** CEO intros initiated, Pipeline generated
- **Email Performance:** Open rates, reply rates by intent tier

## 🔒 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Public can insert applications (by design)
- ✅ Only admins can view/edit applications
- ✅ API keys are anon public (safe for frontend)
- ✅ Sensitive operations use service role key (backend only)

## 🆘 Troubleshooting

### Applications not saving
- Check browser console for errors
- Verify Supabase credentials in form
- Test RLS policies in Supabase dashboard

### Emails not sending
- Check Edge Function logs in Supabase
- Verify Resend domain is verified
- Test API key is correct

### Score not calculating
- Check trigger is enabled
- Manually recalculate with UPDATE query
- Review function logic in schema

**Full troubleshooting:** See [`QUICK-START-DEPLOYMENT.md`](../crm/QUICK-START-DEPLOYMENT.md#troubleshooting)

## 🗓️ Timeline

- **Nov 27, 2024:** Announce on LinkedIn
- **Nov 27 - Dec 2:** Accept applications (manual review)
- **Dec 2:** Registration closes
- **Dec 4, 12pm EST:** Run first cohort
- **Dec 4, 2pm:** Send post-event email
- **Dec 7:** Send 3-day follow-ups (high/med/low intent)
- **Dec 11:** Send 7-day content follow-up
- **Dec 18:** Send 14-day final nudge (high-intent only)

## 💰 Costs

- **Supabase:** Free tier (50K rows)
- **Resend:** Free tier (100 emails/day) or $20/mo for 50K/mo
- **Domain:** Already own cloverera.com
- **Teams:** Already have access

**Total:** $0-20/month

## 📞 Support

- **Supabase Issues:** [supabase.com/docs](https://supabase.com/docs)
- **Resend Issues:** [resend.com/docs](https://resend.com/docs)
- **System Questions:** Review documentation in `/crm/` folder

## ✅ Pre-Launch Checklist

Before November 27:

- [ ] Database schema deployed
- [ ] First cohort created (Dec 4)
- [ ] All HTML files have Supabase credentials
- [ ] Email automation working
- [ ] Test application submitted successfully
- [ ] Admin dashboard accessible
- [ ] Status change emails tested
- [ ] Teams meeting link tested
- [ ] LinkedIn post drafted
- [ ] Mobile responsive verified

## 🎉 Ready to Launch?

1. Complete setup: [`QUICK-START-DEPLOYMENT.md`](../crm/QUICK-START-DEPLOYMENT.md)
2. Test everything in pre-launch checklist
3. Draft LinkedIn post: [`LINKEDIN-ANNOUNCEMENT-TEMPLATE.md`](../crm/LINKEDIN-ANNOUNCEMENT-TEMPLATE.md)
4. Announce on November 27
5. Review applications within 48 hours
6. Run cohort on December 4
7. Follow up with attendees
8. Track conversions

**Good luck with your first cohort! 🍀**
