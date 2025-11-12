# Blog Automation Setup

This document explains how to configure automated blog post generation from Supabase to static HTML files.

## Overview

When you click "Publish" in the blog editor, the system:
1. Updates the article status to "published" in Supabase
2. Triggers a GitHub Action workflow
3. GitHub Action fetches all published articles from Supabase
4. Generates optimized HTML files with full SEO
5. Commits and pushes the files to the `/Blog/` directory
6. Your blog article is live within ~1-2 minutes!

## Setup Instructions

### Step 1: Add GitHub Secrets

You need to add two secrets to your GitHub repository:

1. **Go to GitHub Repository Settings:**
   ```
   https://github.com/clivehays/clover-era-page/settings/secrets/actions
   ```

2. **Click "New repository secret"** and add these two secrets:

   **Secret 1: `SUPABASE_URL`**
   - Name: `SUPABASE_URL`
   - Value: `https://drugebiitlcjkknjfxeh.supabase.co`

   **Secret 2: `SUPABASE_SERVICE_KEY`**
   - Name: `SUPABASE_SERVICE_KEY`
   - Value: Your Supabase **service_role** key (NOT the anon key)

   To find your service_role key:
   - Go to: https://supabase.com/dashboard/project/drugebiitlcjkknjfxeh/settings/api
   - Copy the **service_role** key (the long one that starts with `eyJ...`)
   - ⚠️ **Important:** Use the service_role key, NOT the anon key!

### Step 2: Enable GitHub Actions

1. Go to: https://github.com/clivehays/clover-era-page/actions
2. If Actions are disabled, click "Enable Actions"
3. The workflow is already configured and ready to run

### Step 3: Test the Automation

**Option 1: Manual Trigger (Recommended for first test)**
1. Go to: https://github.com/clivehays/clover-era-page/actions/workflows/generate-blog-posts.yml
2. Click "Run workflow" button (top right)
3. Click the green "Run workflow" button
4. Watch it run - should complete in ~30 seconds
5. Check the `/Blog/` directory for new HTML files

**Option 2: Publish an Article**
1. Go to: https://cloverera.com/crm/blog-editor.html
2. Create or edit an article
3. Click "Publish Article"
4. Wait ~1-2 minutes
5. Your article will be live at: https://cloverera.com/Blog/{slug}.html

## How It Works

### Workflow Triggers

The GitHub Action runs in three scenarios:

1. **Manual Trigger** - Click "Run workflow" in GitHub Actions
2. **On Publish** - When you click "Publish" in the blog editor
3. **Scheduled** - Every 5 minutes (checks for new published articles)

### What Gets Generated

For each published article in Supabase, the workflow creates:

- **File:** `/Blog/{slug}.html`
- **SEO:** Meta tags, Open Graph, Twitter Cards
- **Schema:** JSON-LD structured data for Google
- **Design:** Responsive, mobile-optimized layout
- **Features:** Read time, view count, tags, CTA section

### File Structure

```
Blog/
├── the-scapegoat-in-waiting.html
├── burnout-printer-jam-monday.html
├── workplace-quietly-cracking-under-pressure.html
└── index.html (existing)
```

## Troubleshooting

### Articles Not Generating

1. **Check GitHub Actions:**
   - Go to: https://github.com/clivehays/clover-era-page/actions
   - Look for failed workflows (red ❌)
   - Click on the failed workflow to see error logs

2. **Verify Secrets:**
   - Go to: https://github.com/clivehays/clover-era-page/settings/secrets/actions
   - Ensure both `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` exist
   - Service key should be ~800 characters long

3. **Check Article Status:**
   - Go to: https://cloverera.com/crm/blog-articles.html
   - Verify article status is "published" (not "draft")
   - Check that `published_at` date is set

### Manual Generation (Fallback)

If automation isn't working, you can generate files manually:

1. Go to: https://cloverera.com/crm/generate-static-blog.html
2. Click "Generate Static Files"
3. Download the HTML files
4. Commit them to the repository manually

## Workflow Configuration

The workflow is configured in:
```
.github/workflows/generate-blog-posts.yml
```

Generation script is:
```
.github/scripts/generate-blog-posts.js
```

## Benefits

✅ **Instant Publishing** - Click publish, live in ~1 minute
✅ **SEO Optimized** - Full meta tags and Schema.org markup
✅ **No Manual Steps** - Fully automated end-to-end
✅ **Version Control** - All posts tracked in git
✅ **Static Performance** - Fast loading, no database queries
✅ **Consistent Design** - Uses template for all articles

## Next Steps

After setup:

1. ✅ Add GitHub secrets (see Step 1)
2. ✅ Test with manual trigger (see Step 3)
3. ✅ Publish a test article
4. ✅ Verify it appears at `/Blog/{slug}.html`
5. ✅ Check SEO with Google's Rich Results Test
6. 🎉 Start publishing content!

## Support

If you encounter issues:

1. Check workflow logs in GitHub Actions
2. Verify Supabase service key has correct permissions
3. Ensure article has all required fields (title, slug, content)
4. Check that `/Blog/` directory exists in repository

---

**Pro Tip:** The workflow runs every 5 minutes automatically, so even if the manual trigger fails, your published articles will be generated within 5 minutes!
