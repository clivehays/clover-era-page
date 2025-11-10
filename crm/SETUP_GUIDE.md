# Clover ERA CRM Setup Guide

Complete step-by-step guide to set up your Supabase-powered CRM system.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Database Setup](#database-setup)
4. [Configure CRM Pages](#configure-crm-pages)
5. [Create First User](#create-first-user)
6. [Testing](#testing)
7. [Going Live](#going-live)

---

## Prerequisites

Before you begin, make sure you have:
- ✅ A free Supabase account ([sign up here](https://supabase.com))
- ✅ Access to this GitHub repository
- ✅ Basic familiarity with SQL (optional, but helpful)

**Estimated Setup Time:** 15-20 minutes

---

## 1. Supabase Setup

### Step 1.1: Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Fill in project details:
   - **Name:** `Clover-ERA-CRM`
   - **Database Password:** Choose a strong password (SAVE THIS!)
   - **Region:** Select closest to your location (e.g., `US East (North Virginia)`)
   - **Pricing Plan:** Free tier is sufficient to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### Step 1.2: Get Your API Credentials

Once your project is ready:

1. Go to **Settings** (⚙️ icon in sidebar) → **API**
2. You'll need two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

**IMPORTANT:** Keep these credentials secure. You'll need them in Step 4.

---

## 2. Database Setup

### Step 2.1: Open SQL Editor

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"** button

### Step 2.2: Run the Schema Script

1. Open the file: `crm/supabase-schema.sql` from this repository
2. Copy **ALL** the SQL code (Ctrl+A, Ctrl+C)
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for execution to complete (~5-10 seconds)

You should see:
```
Success. No rows returned
```

### Step 2.3: Verify Database Tables

1. Go to **Table Editor** in the sidebar
2. You should see these tables:
   - `companies`
   - `contacts`
   - `opportunities`
   - `activities`
   - `products`
   - `opportunity_products`
   - `files`

**Note:** The script includes one sample opportunity so you can test the interface immediately.

---

## 3. Configure CRM Pages

### Step 3.1: Update Supabase Credentials

You need to add your Supabase credentials to two files:

#### File 1: `crm/index.html`

1. Open `crm/index.html`
2. Find lines 222-223 (search for `YOUR_SUPABASE_URL_HERE`):

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
```

3. Replace with your actual values:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

#### File 2: `crm/login.html`

1. Open `crm/login.html`
2. Find lines 123-124 (same search):

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
```

3. Replace with the **same** values you used above

### Step 3.2: Commit Changes

```bash
cd C:\Users\Administrator\clover-era-page
git add crm/
git commit -m "Configure Supabase CRM with credentials"
git push
```

Wait 1-2 minutes for Vercel to deploy the changes.

---

## 4. Create First User

### Step 4.1: Create User in Supabase Auth

1. Go to **Authentication** in Supabase sidebar
2. Click **"Add user"** dropdown → **"Create new user"**
3. Fill in:
   - **Email:** Your work email (e.g., `you@cloverera.com`)
   - **Password:** Choose a strong password
   - **Auto Confirm User:** ✅ Check this box
4. Click **"Create user"**

### Step 4.2: Test Login

1. Visit: `https://yoursite.vercel.app/crm/login.html`
2. Enter the email and password you just created
3. Click **"Sign In"**
4. You should be redirected to the CRM dashboard

**Success!** You should see:
- Metrics at the top showing sample data
- Pipeline with one sample opportunity
- Recent activities table

---

## 5. Testing

### Test 1: View Sample Opportunity

1. In the pipeline, click on the sample opportunity card: **"Acme Technology - Manager Enablement Pilot"**
2. You should be redirected to opportunity detail page
3. **Note:** The detail page (`opportunity.html`) will be created next - for now you'll get a 404

### Test 2: Add a New Company

Use the Supabase Table Editor to add data:

1. Go to **Table Editor** → **companies**
2. Click **"Insert row"**
3. Fill in:
   - `name`: Your test company name
   - `employee_count`: 150
   - `industry`: Technology
   - `status`: prospect
4. Click **"Save"**

### Test 3: Add a New Opportunity

1. Go to **Table Editor** → **opportunities**
2. Click **"Insert row"**
3. Fill in:
   - `company_id`: Select the company you just created
   - `title`: "Test Opportunity - Pilot Program"
   - `stage`: qualified
   - `value`: 35400
   - `managers_count`: 10
   - `probability`: 50
4. Click **"Save"**
5. Refresh your CRM dashboard - you should see the new opportunity!

---

## 6. Going Live

### Add More Users

Repeat Step 4.1 for each team member who needs CRM access:
- Sales team members
- Account managers
- Executives who need visibility

### Security Best Practices

1. **Use strong passwords** for all user accounts
2. **Enable 2FA** in Supabase:
   - Go to **Settings** → **Security**
   - Enable Two-Factor Authentication
3. **Regularly backup** your database:
   - Go to **Database** → **Backups**
   - Free tier includes daily backups (7-day retention)

### Upgrade When Needed

Free tier limits:
- ✅ 500MB database (thousands of records)
- ✅ 2GB file storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

Upgrade to Pro ($25/month) when you:
- Exceed 500MB database size
- Need daily backups beyond 7 days
- Want additional team members in Supabase dashboard
- Need custom domain for database

---

## 7. What's Next?

### Immediate Next Steps

1. **Create more CRM pages:**
   - `crm/opportunity.html` - Opportunity detail view
   - `crm/companies.html` - Companies list and search
   - `crm/activities.html` - Activity log and task management

2. **Add forms for data entry:**
   - New opportunity modal
   - Quick add activity button
   - Company/contact creation forms

3. **Integrate with partner system:**
   - Auto-create opportunities from partner registrations
   - Link partner deals to CRM opportunities

### Advanced Features (Future)

- **Email integration:** Log emails automatically
- **Calendar sync:** Sync meetings to Google Calendar
- **Reporting:** Custom reports and dashboards
- **Mobile app:** Progressive Web App (PWA) for mobile access
- **Webhooks:** Notify Slack when deals close
- **AI insights:** Predict deal outcomes, suggest next steps

---

## 📞 Need Help?

### Common Issues

**Issue:** "Failed to connect to Supabase"
- **Solution:** Double-check your Supabase URL and anon key in both HTML files

**Issue:** "Can't log in - Invalid credentials"
- **Solution:** Make sure you checked "Auto Confirm User" when creating the user

**Issue:** "No data showing in dashboard"
- **Solution:** Run the schema script again - it includes sample data

**Issue:** "Database error when viewing pipeline"
- **Solution:** Check Supabase logs: **Logs** → **Postgres Logs**

### Get Support

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **GitHub Issues:** Create an issue in this repository

---

## 🎉 Congratulations!

You now have a fully functional CRM system powered by Supabase. Start adding your real opportunities and watch your pipeline grow!

**Pro Tip:** Export your data regularly using Supabase's export feature:
- Go to **Table Editor** → Select table → **Export as CSV**
