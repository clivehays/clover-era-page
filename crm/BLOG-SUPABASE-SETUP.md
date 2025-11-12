# Blog CMS Setup for Supabase

## Current Situation

Your Clover ERA CRM uses:
- ✅ **Static HTML files** (not Node.js/Express)
- ✅ **Supabase** for database and authentication
- ✅ **GitHub Pages** (or similar) for hosting

The blog files I created were designed for a Node.js backend, but your site uses Supabase directly from the browser.

## What Needs to Happen

### Step 1: Run Database Migrations in Supabase

The blog tables need to be created in your Supabase database.

**Go to:** https://drugebiitlcjkknjfxeh.supabase.co/project/_/sql/new

**Run these migrations in order:**

1. **First migration** - Copy and paste: [migrations/010_create_blog_articles.sql](migrations/010_create_blog_articles.sql)
2. **Second migration** - Copy and paste: [migrations/011_create_blog_article_revisions.sql](migrations/011_create_blog_article_revisions.sql)
3. **Third migration** - Copy and paste: [migrations/012_create_blog_article_analytics.sql](migrations/012_create_blog_article_analytics.sql)

Click **"Run"** for each migration.

### Step 2: Configure Blog Pages with Supabase Credentials

I've created a Supabase-compatible blog dashboard:

**File:** [crm/blog-articles.html](blog-articles.html)

**Update lines 342-343** with your actual credentials:

```javascript
// Find this:
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Replace with:
const SUPABASE_URL = 'https://drugebiitlcjkknjfxeh.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_ANON_KEY_HERE'; // Get from Supabase dashboard
```

**To get your ANON_KEY:**
1. Go to: https://drugebiitlcjkknjfxeh.supabase.co/project/_/settings/api
2. Copy the **anon/public** key
3. Paste it in the file

### Step 3: Add Blog Link to Navigation

Update your existing CRM pages to include blog link:

**Files to update:**
- `crm/index.html` (line ~65)
- `crm/companies.html` (line ~65)
- `crm/activities.html` (line ~65)

**Add this line** to the nav-links:

```html
<div class="nav-links">
    <a href="index.html">Dashboard</a>
    <a href="companies.html">Companies</a>
    <a href="activities.html">Activities</a>
    <a href="blog-articles.html">📝 Blog</a>  <!-- ADD THIS -->
    <a href="#" onclick="logout()">Logout</a>
</div>
```

### Step 4: Access Your Blog Dashboard

Once steps 1-3 are complete:

**Blog Dashboard:**
`https://cloverera.com/crm/blog-articles.html`

---

## What I Still Need to Create

Since you're using Supabase (not Node.js), I need to create:

1. ✅ **blog-articles.html** - Dashboard page (DONE)
2. ❌ **blog-editor.html** - Editor with TinyMCE (NEEDS UPDATE)
3. ❌ **Supabase Edge Functions** - For static HTML generation (OPTIONAL)

## Two Approaches

### Approach A: Client-Side Only (Simpler)

**What you get:**
- ✅ Create/edit articles in Supabase
- ✅ View articles in CRM
- ❌ No automatic static HTML generation
- ❌ Manual publish process

**Workflow:**
1. Create article in `blog-articles.html`
2. Mark as "published" in Supabase
3. Manually create HTML file in `/blog/` directory

**Good for:** Quick start, testing

### Approach B: Edge Functions (Complete)

**What you get:**
- ✅ Create/edit articles with TinyMCE
- ✅ Auto-generate static HTML on publish
- ✅ Full workflow automation
- ✅ SEO/GEO optimization

**Requires:**
- Supabase Edge Function deployment
- GitHub Actions for HTML generation
- A bit more setup (30 min)

**Good for:** Production use

---

## Recommendation: Start with Approach A

**Why:**
1. Get blog working TODAY (10 min setup)
2. Test the database structure
3. Create your first few articles
4. Upgrade to Approach B later when you need automation

---

## Quick Start (10 minutes)

### 1. Run Migrations (5 min)

Visit: https://drugebiitlcjkknjfxeh.supabase.co/project/_/sql/new

Copy/paste each SQL file:
- `migrations/010_create_blog_articles.sql`
- `migrations/011_create_blog_article_revisions.sql`
- `migrations/012_create_blog_article_analytics.sql`

Click "Run" for each.

### 2. Get Anon Key (1 min)

Visit: https://drugebiitlcjkknjfxeh.supabase.co/project/_/settings/api

Copy the **anon** key.

### 3. Update blog-articles.html (2 min)

Open: `crm/blog-articles.html`

Line 343, paste your anon key:
```javascript
const SUPABASE_ANON_KEY = 'paste-your-key-here';
```

### 4. Add Nav Link (2 min)

Edit `crm/index.html`, find nav-links section (~line 65), add:
```html
<a href="blog-articles.html">📝 Blog</a>
```

### 5. Test

Visit: `https://cloverera.com/crm/blog-articles.html`

Should see:
- ✅ Empty articles table
- ✅ Stats showing 0/0/0/0
- ✅ "New Article" button

---

## Next Steps After Quick Start

Once basic dashboard is working, I'll create:

1. **blog-editor.html** (Supabase version)
   - TinyMCE editor
   - Auto-save to Supabase
   - SEO/GEO fields

2. **Edge Function for HTML generation**
   - Triggers on article publish
   - Generates static HTML
   - Deploys to /blog/ directory

3. **Public blog landing page**
   - Already created: `blog-index.html`
   - Just needs to fetch from Supabase

---

## Troubleshooting

### "Relation blog_articles does not exist"

**Fix:** Run the migrations in Supabase SQL editor

### "Invalid API key"

**Fix:** Double-check you copied the **anon** key (not the service_role key)

### "Page not loading"

**Fix:** Check browser console (F12) for errors

### "RLS policy error"

**Fix:** Supabase RLS (Row Level Security) may block access. Run:

```sql
-- Allow authenticated users to read/write blog articles
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage articles"
ON blog_articles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## Architecture Comparison

### Current CRM (What You Have)

```
Browser
  ↓
HTML Files (index.html, companies.html)
  ↓
Supabase JS SDK
  ↓
Supabase Database (PostgreSQL)
```

### Blog (What We're Adding)

```
Browser
  ↓
HTML Files (blog-articles.html, blog-editor.html)
  ↓
Supabase JS SDK
  ↓
Supabase Database (blog_articles table)
  ↓ (optional)
Edge Function (generate static HTML)
  ↓
/blog/{slug}.html files
```

---

## Files Created

### Working Files

- ✅ `crm/blog-articles.html` - Dashboard (Supabase version)
- ✅ `crm/migrations/010_create_blog_articles.sql`
- ✅ `crm/migrations/011_create_blog_article_revisions.sql`
- ✅ `crm/migrations/012_create_blog_article_analytics.sql`
- ✅ `blog-index.html` - Public landing page

### Files That Need Supabase Conversion

- ⚠️ `crm/public/blog-editor.html` - Designed for Node.js API
- ⚠️ `crm/public/blog-dashboard.html` - Designed for Node.js API
- ⚠️ `crm/api/blog-articles.js` - Node.js API (not needed)
- ⚠️ `crm/middleware/auth.js` - Node.js auth (use Supabase RLS)
- ⚠️ `crm/services/static-generator.js` - Node.js service (convert to Edge Function)

---

## Summary

**You can use the blog TODAY by:**

1. Running 3 SQL migrations in Supabase (5 min)
2. Updating blog-articles.html with your anon key (2 min)
3. Adding nav link to existing pages (2 min)

**Total time:** 10 minutes

**Then you'll have:**
- ✅ Blog article database
- ✅ Dashboard to manage articles
- ✅ Create/edit/delete functionality

**Missing (can add later):**
- Rich text editor (TinyMCE integration)
- Automatic HTML generation
- Public blog search

**Want me to create the Supabase-compatible editor next?**

Let me know and I'll build `blog-editor.html` that works with your Supabase setup!
