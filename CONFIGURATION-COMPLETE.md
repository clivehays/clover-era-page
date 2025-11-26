# Roundtable Configuration - COMPLETED ✅

## Configuration Status

All 3 HTML files have been successfully configured with your Supabase credentials.

---

## ✅ Files Configured

### 1. Landing Page
**File:** `roundtable/index.html`
- ✅ Supabase URL: `https://dvvsphsvcpxkplumutyc.supabase.co`
- ✅ Supabase Anon Key: Configured (line 402)
- ✅ Location: Lines 401-402

### 2. Application Form
**File:** `roundtable/apply/index.html`
- ✅ Supabase URL: `https://dvvsphsvcpxkplumutyc.supabase.co`
- ✅ Supabase Anon Key: Configured (line 502)
- ✅ Location: Lines 501-502

### 3. Admin Dashboard
**File:** `crm/roundtable-admin.html`
- ✅ Supabase URL: `https://dvvsphsvcpxkplumutyc.supabase.co`
- ✅ Supabase Anon Key: Configured (line 586)
- ✅ Location: Lines 585-586

---

## 🎯 Your Supabase Details

**Project URL:** `https://dvvsphsvcpxkplumutyc.supabase.co`
**Project Ref:** `dvvsphsvcpxkplumutyc`
**Anon Key:** `eyJhbGc...` (configured in all files)

---

## 📋 Next Steps

Now that configuration is complete, follow these steps in order:

### Step 1: Run Database Migrations ⏭️ NEXT
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/dvvsphsvcpxkplumutyc)
2. Click **SQL Editor** in left sidebar
3. Run these files in order:

#### a) Main Schema (Required)
```sql
-- Copy entire contents of: crm/roundtable-schema.sql
-- Paste in SQL Editor and click RUN
```
This creates:
- Tables: `roundtable_cohorts`, `roundtable_applications`
- Scoring function
- RLS policies
- Indexes

#### b) First Cohort (Required)
```sql
-- Copy entire contents of: crm/roundtable-first-cohort.sql
-- Paste in SQL Editor and click RUN
```
This creates:
- December 4, 2025 cohort
- 12:00 PM EST
- Teams meeting link
- 10 spots

---

### Step 2: Test Database Connection (5 min)
1. Open `roundtable/index.html` in browser
2. Check browser console (F12)
3. Should see cohort date load (December 4)
4. If it says "Loading..." check console for errors

---

### Step 3: Test Application Submission (10 min)
1. Go to `roundtable/apply/` page
2. Fill out form with test data
3. Submit application
4. Check Supabase dashboard:
   - Go to **Table Editor**
   - Select `roundtable_applications`
   - Verify test application appears
   - Check score calculated automatically

---

### Step 4: Test Admin Dashboard (5 min)
1. Login to your CRM
2. Go to `crm/roundtable-admin.html`
3. Check:
   - Applications load
   - Stats display
   - Can view application details
   - Can change status (but don't send emails yet)

---

### Step 5: Email Automation Setup (45 min)
Follow the guide in: `crm/QUICK-START-DEPLOYMENT.md`

Section: "Step 3: Email Automation Setup"

Quick overview:
1. Create Resend account
2. Verify cloverera.com domain
3. Deploy Supabase Edge Function
4. Enable database triggers

---

## 🔍 Verification Checklist

Before proceeding to email setup:

- [x] All 3 HTML files have Supabase credentials
- [ ] Database schema deployed (`roundtable-schema.sql`)
- [ ] First cohort created (`roundtable-first-cohort.sql`)
- [ ] Landing page loads cohort info
- [ ] Application form submits successfully
- [ ] Test application appears in database
- [ ] Score calculated automatically
- [ ] Admin dashboard loads applications

---

## 🚨 If Something's Not Working

### Landing page shows "Loading..." for date/time
**Problem:** Can't connect to Supabase or no cohort found

**Check:**
1. Browser console (F12) for errors
2. Supabase credentials correct in `index.html`
3. Database schema ran successfully
4. First cohort created successfully

**Fix:**
- Verify Supabase URL and key
- Re-run `roundtable-first-cohort.sql`
- Check Network tab in browser console

### Application form won't submit
**Problem:** Can't insert to database

**Check:**
1. Browser console (F12) for errors
2. Supabase credentials correct in `apply/index.html`
3. RLS policy allows public inserts
4. Network tab shows 200 response

**Fix:**
- Double-check Supabase URL and key
- Verify RLS policies in Supabase dashboard
- Check if table was created successfully

### Admin dashboard shows no applications
**Problem:** Can't read from database

**Check:**
1. Browser console (F12) for errors
2. Supabase credentials correct in `roundtable-admin.html`
3. RLS policy allows reads (for authenticated users)
4. Test application exists in database

**Fix:**
- Verify you're logged into CRM
- Check Supabase credentials
- View table directly in Supabase Table Editor

---

## 📞 Support

**Quick Start Guide:** `crm/QUICK-START-DEPLOYMENT.md`
**Full Setup Guide:** `crm/ROUNDTABLE-SETUP-GUIDE.md`
**Email Templates:** `crm/ROUNDTABLE-EMAIL-TEMPLATES.md`

**Supabase Project:** [https://supabase.com/dashboard/project/dvvsphsvcpxkplumutyc](https://supabase.com/dashboard/project/dvvsphsvcpxkplumutyc)

---

## ⏱️ Time to Launch

From where you are now:

- ✅ Configuration: **COMPLETE**
- ⏭️ Database setup: **15 minutes**
- ⏭️ Testing: **20 minutes**
- ⏭️ Email automation: **45 minutes**
- ⏭️ Deploy to live site: **15 minutes**

**Total remaining:** ~2 hours to fully operational system

---

## 🎉 You're Making Progress!

Configuration is complete. The system is ready to connect to your database.

**Next:** Run the database migrations (Step 1 above)

**Follow:** `crm/QUICK-START-DEPLOYMENT.md` for detailed walkthrough

**Launch:** November 27, 2024 (3 days from now)

You've got this! 🍀
