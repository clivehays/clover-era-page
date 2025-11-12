# Blog CMS Phase 1 - Implementation Guide

## Overview

Phase 1 establishes the foundation for the Clover ERA Blog CMS with database schema, RESTful API, and static HTML generation capabilities. This phase focuses on backend infrastructure and core functionality.

**Duration:** 2 weeks
**Status:** ✅ Database & API Complete - Ready for Integration

---

## What Was Built

### 1. Database Schema (PostgreSQL)

Three interconnected tables with full-text search, triggers, and analytics:

#### **blog_articles** - Main content table
- ✅ Content fields (title, slug, excerpt, content, featured_image)
- ✅ SEO fields (meta_title, meta_description, meta_keywords, canonical_url)
- ✅ GEO fields (target_audience, key_topics, related_articles, faq_items)
- ✅ Status workflow (draft → pending_review → scheduled → published → archived)
- ✅ Full-text search index (PostgreSQL gin)
- ✅ Auto-slug generation from title
- ✅ Auto-calculate read time from content
- ✅ Timestamps and view tracking

#### **blog_article_revisions** - Version control
- ✅ Auto-create revision on article update
- ✅ Track who made changes and when
- ✅ Functions to restore previous versions
- ✅ Compare revisions side-by-side

#### **blog_article_analytics** - Detailed tracking
- ✅ Daily aggregated metrics (page views, unique visitors)
- ✅ Traffic source breakdown (direct, organic, social, referral, email)
- ✅ **AI/GEO traffic tracking** (ChatGPT, Perplexity, Gemini)
- ✅ Device breakdown (desktop, mobile, tablet)
- ✅ Conversion tracking (CTA clicks, trial signups, contact forms)
- ✅ Geographic data (top countries)
- ✅ Performance views for reporting

**Files Created:**
- `/crm/migrations/010_create_blog_articles.sql`
- `/crm/migrations/011_create_blog_article_revisions.sql`
- `/crm/migrations/012_create_blog_article_analytics.sql`

---

### 2. RESTful API Endpoints

Complete CRUD operations with role-based authorization:

#### **Article Management**
- `GET /api/blog/articles` - List articles (with filtering, search, pagination)
- `GET /api/blog/articles/:id` - Get single article
- `POST /api/blog/articles` - Create new article
- `PUT /api/blog/articles/:id` - Update article
- `DELETE /api/blog/articles/:id` - Delete article (admin/editor only)

#### **Publishing Workflow**
- `POST /api/blog/articles/:id/publish` - Publish article + generate static HTML
- `POST /api/blog/articles/:id/unpublish` - Unpublish (archive) article

#### **Analytics & Organization**
- `GET /api/blog/articles/:id/analytics` - Get article analytics
- `GET /api/blog/categories` - List all categories with counts
- `GET /api/blog/tags` - List all tags with counts

**File Created:**
- `/crm/api/blog-articles.js`

---

### 3. Authorization Middleware

Comprehensive role-based access control:

#### **Roles & Permissions**
- **Admin** - Full access to all features
- **Editor** - Can publish, edit all articles
- **Author** - Can create drafts, edit own drafts
- **Partner/Manager** - No blog access (CRM only)

#### **Middleware Functions**
- `authenticate()` - JWT token verification
- `authorize([roles])` - Role-based access control
- `requireBlogAccess()` - Check blog permissions
- `requirePublishPermission()` - Admin/editor only
- `requireOwnershipOrAdmin()` - Own content or admin
- `rateLimit()` - Prevent API abuse

**File Created:**
- `/crm/middleware/auth.js`

---

### 4. Static HTML Generator

SEO and GEO optimized HTML generation:

#### **Features**
- ✅ Schema.org BlogPosting markup
- ✅ Open Graph tags (Facebook, LinkedIn)
- ✅ Twitter Card tags
- ✅ **GEO optimization** for AI engines (ChatGPT, Perplexity, Gemini)
- ✅ FAQ section with Schema.org markup
- ✅ Related articles section
- ✅ Mobile-responsive design
- ✅ Performance optimized (static files)

#### **Generated on Publish**
When an article is published via `POST /api/blog/articles/:id/publish`, a static HTML file is automatically generated at `/blog/{slug}.html`.

**File Created:**
- `/crm/services/static-generator.js`

---

## Installation & Setup

### Prerequisites

```bash
# Ensure you have:
- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Existing Clover ERA CRM database
```

### Step 1: Run Database Migrations

```bash
# Connect to your PostgreSQL database
psql -U your_username -d clover_era_db

# Run migrations in order
\i crm/migrations/010_create_blog_articles.sql
\i crm/migrations/011_create_blog_article_revisions.sql
\i crm/migrations/012_create_blog_article_analytics.sql

# Verify tables were created
\dt blog*
```

### Step 2: Install Node.js Dependencies

```bash
cd crm
npm install express express-validator jsonwebtoken pg
```

### Step 3: Configure Environment Variables

Create/update `.env` file:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/clover_era_db

# JWT Authentication
JWT_SECRET=your-secure-random-secret-key-here

# Blog Output Directory
BLOG_OUTPUT_DIR=../blog

# API Settings
PORT=3000
NODE_ENV=production
```

### Step 4: Integrate API Routes

Add to your main Express app (`crm/server.js` or similar):

```javascript
const express = require('express');
const blogArticlesRouter = require('./api/blog-articles');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Blog API routes
app.use('/api/blog', blogArticlesRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
```

### Step 5: Create Blog Output Directory

```bash
# From project root
mkdir -p blog
```

---

## API Usage Examples

### Authentication

All API requests require a JWT token in the Authorization header:

```bash
curl -X GET https://api.cloverera.com/api/blog/articles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create a Draft Article

```bash
curl -X POST https://api.cloverera.com/api/blog/articles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "5 Signs Your Team is Experiencing Burnout",
    "excerpt": "Learn to recognize early warning signs of employee burnout before it affects productivity.",
    "content": "<p>Employee burnout is a serious issue...</p>",
    "category": "Employee Engagement",
    "tags": ["burnout", "employee wellness", "mental health"],
    "meta_description": "Discover 5 key signs of employee burnout and how to address them proactively.",
    "target_audience": "HR managers and team leaders concerned about employee wellness",
    "key_topics": ["burnout prevention", "employee engagement", "workplace wellness"],
    "faq_items": [
      {
        "question": "What causes employee burnout?",
        "answer": "Burnout is caused by chronic workplace stress, lack of work-life balance, and insufficient support."
      }
    ]
  }'
```

### Publish an Article

```bash
curl -X POST https://api.cloverera.com/api/blog/articles/{article-id}/publish \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response includes generated HTML path
{
  "message": "Article published successfully",
  "article": { ... },
  "html_path": "/blog/5-signs-your-team-is-experiencing-burnout.html"
}
```

### Search Articles

```bash
# Full-text search
curl -X GET "https://api.cloverera.com/api/blog/articles?search=burnout&status=published" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by category
curl -X GET "https://api.cloverera.com/api/blog/articles?category=Employee+Engagement" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Article Analytics

```bash
curl -X GET "https://api.cloverera.com/api/blog/articles/{article-id}/analytics?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response includes AI traffic breakdown
{
  "summary": {
    "total_views": 1250,
    "unique_visitors": 890,
    "avg_time_seconds": 180,
    "total_conversions": 45,
    "top_source": "organic",
    "top_device": "mobile"
  },
  "daily": [
    {
      "date": "2025-11-12",
      "page_views": 45,
      "total_ai": 12  // ChatGPT + Perplexity + Gemini
    }
  ]
}
```

---

## Database Schema Reference

### Key Tables

```sql
-- Check article count by status
SELECT status, COUNT(*) FROM blog_articles GROUP BY status;

-- Get top performing articles (last 30 days)
SELECT * FROM blog_article_performance_30d LIMIT 10;

-- Get articles with highest AI traffic
SELECT * FROM blog_top_ai_traffic LIMIT 10;

-- Restore article to previous revision
SELECT restore_article_revision(
    'article-uuid',
    3,  -- revision number
    'user-uuid'  -- who is restoring
);

-- Record a page view
SELECT record_article_view(
    'article-uuid',
    'organic',  -- source: direct, organic, social, referral, email, ai
    'mobile',   -- device: desktop, mobile, tablet
    'https://chat.openai.com'  -- referrer (auto-detects AI sources)
);
```

---

## Security Features

### ✅ Implemented

1. **JWT Authentication** - All endpoints require valid token
2. **Role-Based Authorization** - Different permissions per user type
3. **SQL Injection Prevention** - Parameterized queries
4. **XSS Prevention** - HTML escaping in static generator
5. **Rate Limiting** - Prevent API abuse (in-memory, use Redis for production)
6. **CORS Protection** - Configure allowed origins
7. **Input Validation** - express-validator on all inputs

### 🔒 Recommended Additions

1. **HTTPS Only** - Force SSL in production
2. **API Rate Limiting** - Use Redis for distributed rate limiting
3. **Content Security Policy** - Add CSP headers to generated HTML
4. **Database Encryption** - Encrypt sensitive fields at rest
5. **Audit Logging** - Track all article modifications

---

## Performance Optimizations

### ✅ Implemented

1. **Database Indexes**
   - Full-text search (gin)
   - Status filtering
   - Published date sorting
   - Author, category, tags lookups

2. **Static HTML Generation**
   - No database queries on page load
   - CDN-ready static files
   - Optimal Time to First Byte (TTFB)

3. **Pagination**
   - Default 20 articles per page
   - Max 100 per request

### 📊 Expected Performance

- **API Response Time:** <100ms (indexed queries)
- **Static HTML Load:** <500ms (first visit)
- **Search Performance:** <200ms (full-text search)
- **Publish Time:** <2 seconds (including HTML generation)

---

## Testing Checklist

### Database Tests

- [ ] Run all three migration scripts
- [ ] Verify triggers work (slug generation, read time calculation)
- [ ] Test full-text search with sample data
- [ ] Verify revision creation on update
- [ ] Test analytics recording function

### API Tests

- [ ] Create draft article (author role)
- [ ] Update article (owner)
- [ ] Publish article (editor/admin role)
- [ ] Search articles (full-text)
- [ ] Get analytics data
- [ ] Test unauthorized access (wrong role)
- [ ] Test rate limiting (50+ rapid requests)

### HTML Generation Tests

- [ ] Publish article and verify HTML file created
- [ ] Check Schema.org markup validity (use Google Rich Results Test)
- [ ] Verify Open Graph tags (use Facebook Debugger)
- [ ] Test mobile responsiveness
- [ ] Validate FAQ schema markup

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:** Tables already exist. Either:
- Drop tables and re-run: `DROP TABLE blog_articles CASCADE;`
- Or skip to next migration

### Issue: JWT token "Authentication required" error

**Solution:** Check:
1. Token is in `Authorization: Bearer {token}` format
2. JWT_SECRET matches token signing key
3. Token hasn't expired

### Issue: HTML generation fails

**Solution:** Check:
1. Output directory exists and is writable
2. Template path is correct
3. Article has all required fields (title, content, slug)

### Issue: Full-text search returns no results

**Solution:**
1. Verify search index exists: `\d blog_articles`
2. Check query syntax: Use `plainto_tsquery()` not raw SQL
3. Ensure content exists in searchable fields

---

## Next Steps: Phase 2

Once Phase 1 is tested and working:

### Phase 2 Goals (Weeks 3-4)
1. **Rich Text Editor Integration** (TinyMCE)
   - Image upload functionality
   - Auto-save drafts
   - Preview mode

2. **Blog Landing Page**
   - Client-side search (Fuse.js)
   - Category filtering
   - Tag cloud
   - Featured articles

3. **CRM Dashboard Integration**
   - Blog management panel in CRM
   - Quick stats dashboard
   - Recent articles widget

---

## Support & Documentation

### Developer Resources

- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Express.js Guide:** https://expressjs.com/
- **Schema.org Reference:** https://schema.org/BlogPosting
- **GEO Best Practices:** [Blog CMS Rollout Plan - Phase 4]

### Internal Documentation

- Full rollout plan: `/crm/BLOG-CMS-ROLLOUT-PLAN.md`
- Partner portal integration: `/crm/PARTNER-PORTAL-INTEGRATION.md`

### Get Help

For implementation questions:
1. Check this guide first
2. Review database comments: `\d+ blog_articles`
3. Check API endpoint comments in `/crm/api/blog-articles.js`
4. Review error logs in server console

---

## File Structure Summary

```
clover-era-page/
├── blog/                          # Generated static HTML files
│   └── {slug}.html               # Auto-generated on publish
├── crm/
│   ├── migrations/
│   │   ├── 010_create_blog_articles.sql
│   │   ├── 011_create_blog_article_revisions.sql
│   │   └── 012_create_blog_article_analytics.sql
│   ├── api/
│   │   └── blog-articles.js      # RESTful API endpoints
│   ├── middleware/
│   │   └── auth.js               # Authentication & authorization
│   ├── services/
│   │   └── static-generator.js   # HTML generation service
│   ├── db/
│   │   └── connection.js         # PostgreSQL connection (assumed)
│   └── PHASE-1-IMPLEMENTATION-GUIDE.md  # This file
```

---

## Success Criteria

Phase 1 is complete when:

- ✅ All three database migrations run successfully
- ✅ API endpoints respond correctly for all roles
- ✅ Publishing an article generates valid HTML
- ✅ Full-text search returns relevant results
- ✅ Analytics tracking records page views
- ✅ Authorization prevents unauthorized access
- ✅ Schema.org markup validates in Google Rich Results Test

---

**Phase 1 Status:** ✅ **READY FOR INTEGRATION**

All core infrastructure is complete. Proceed with integration testing, then move to Phase 2 for frontend development.
