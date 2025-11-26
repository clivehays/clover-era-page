# Retention Reality Roundtable - Complete File Manifest

This document lists all files delivered for the Roundtable system.

## 📂 Directory Structure

```
clover-era-page/
├── roundtable/                          # Public-facing pages
│   ├── index.html                       # Landing page
│   ├── README.md                        # System overview
│   ├── apply/
│   │   └── index.html                   # Application form
│   └── thank-you/
│       └── index.html                   # Thank you page
│
├── crm/                                 # Admin & backend files
│   ├── roundtable-admin.html            # Admin dashboard
│   ├── roundtable-schema.sql            # Main database schema
│   ├── roundtable-first-cohort.sql      # First cohort setup (Dec 4)
│   ├── email-automation-trigger.sql     # Database email triggers
│   ├── supabase-edge-function-template.ts  # Email function code
│   ├── QUICK-START-DEPLOYMENT.md        # Streamlined setup guide
│   ├── ROUNDTABLE-SETUP-GUIDE.md        # Comprehensive setup
│   ├── ROUNDTABLE-EMAIL-TEMPLATES.md    # All 12 email templates
│   ├── ROUNDTABLE-IMPLEMENTATION-SUMMARY.md  # System overview
│   ├── LINKEDIN-ANNOUNCEMENT-TEMPLATE.md     # Launch posts
│   └── migration-add-pricing-tier.sql   # (Pre-existing CRM file)
│
└── ROUNDTABLE-FILE-MANIFEST.md          # This file
```

---

## 📄 File Descriptions

### Public Frontend Files

#### `roundtable/index.html` (Landing Page)
- **Purpose:** Main landing page for Retention Reality Roundtable
- **Size:** ~12 KB
- **Key Features:**
  - Hero section with value proposition
  - 8 content sections as specified in brief
  - Dynamic cohort info loaded from Supabase
  - Mobile-responsive design
  - Brand-consistent styling
- **Configuration Required:**
  - Update Supabase URL (line ~272)
  - Update Supabase API key (line ~272)
- **URL:** `https://cloverera.com/roundtable/`

#### `roundtable/apply/index.html` (Application Form)
- **Purpose:** Multi-section application form
- **Size:** ~18 KB
- **Key Features:**
  - 5 sections, 14+ fields
  - Real-time validation
  - Conditional field display
  - Character counter (500 char limit)
  - Auto-submit to Supabase
  - Automatic scoring on submission
- **Configuration Required:**
  - Update Supabase URL (line ~381)
  - Update Supabase API key (line ~381)
- **URL:** `https://cloverera.com/roundtable/apply/`

#### `roundtable/thank-you/index.html` (Confirmation)
- **Purpose:** Post-submission thank you page
- **Size:** ~4 KB
- **Key Features:**
  - Clean confirmation message
  - Clear next steps
  - Contact information
- **Configuration Required:** None
- **URL:** `https://cloverera.com/roundtable/thank-you/`

#### `roundtable/README.md` (System Documentation)
- **Purpose:** Quick reference for the entire system
- **Size:** ~8 KB
- **Key Content:**
  - File overview
  - Quick start steps
  - First cohort details
  - Tech stack summary
  - Troubleshooting basics

---

### Admin & Backend Files

#### `crm/roundtable-admin.html` (Admin Dashboard)
- **Purpose:** Application management interface
- **Size:** ~28 KB
- **Key Features:**
  - Stats dashboard (total, pending, accepted, avg score)
  - Filterable applications table
  - Application detail modal
  - One-click status updates (triggers emails)
  - Cohorts management tab
  - LinkedIn integration
- **Configuration Required:**
  - Update Supabase URL (line ~424)
  - Update Supabase API key (line ~424)
- **URL:** `https://cloverera.com/crm/roundtable-admin.html`
- **Access:** Requires CRM authentication

#### `crm/roundtable-schema.sql` (Database Schema)
- **Purpose:** Main database structure
- **Size:** ~12 KB
- **Key Features:**
  - Two tables: `roundtable_cohorts` and `roundtable_applications`
  - Automatic scoring function (0-100+ points)
  - Scoring trigger on insert/update
  - Row Level Security (RLS) policies
  - Indexes for performance
  - Sample cohort data
- **Configuration Required:** None (ready to run)
- **Run:** Supabase SQL Editor (once)

#### `crm/roundtable-first-cohort.sql` (First Cohort Setup)
- **Purpose:** Creates first cohort with your specific details
- **Size:** ~2 KB
- **Key Features:**
  - Date: December 4, 2025
  - Time: 12:00 PM EST (17:00 GMT)
  - Platform: Microsoft Teams
  - Teams link included
  - Deletes sample cohort
  - Verification query included
- **Configuration Required:** None (your details already configured)
- **Run:** Supabase SQL Editor (after schema)

#### `crm/email-automation-trigger.sql` (Email Triggers)
- **Purpose:** Database triggers for automatic emails
- **Size:** ~3 KB
- **Key Features:**
  - Triggers on new application (welcome email)
  - Triggers on status change (accepted/waitlisted/declined)
  - Calls Supabase Edge Function
  - Test function included
- **Configuration Required:**
  - Update Edge Function URL (line 21 and 62)
- **Run:** Supabase SQL Editor (after Edge Function deployed)

#### `crm/supabase-edge-function-template.ts` (Email Function)
- **Purpose:** Serverless function for sending emails
- **Size:** ~8 KB
- **Key Features:**
  - Sends emails via Resend API
  - 8 email templates included
  - Tracks sends in database
  - Error handling
  - Automatic personalization
- **Configuration Required:**
  - Deploy to Supabase Edge Functions
  - Set RESEND_API_KEY secret
- **Language:** TypeScript (Deno runtime)

---

### Documentation Files

#### `crm/QUICK-START-DEPLOYMENT.md` ⭐ **START HERE**
- **Purpose:** Streamlined deployment guide
- **Size:** ~22 KB
- **Target Audience:** You (Clive) for deployment
- **Key Sections:**
  - Step-by-step setup (4 main steps)
  - Your specific configuration details
  - Pre-launch checklist
  - Timeline (Nov 27 launch → Dec 4 cohort)
  - Troubleshooting
  - Quick reference
- **Reading Time:** 15-20 minutes
- **Follow-Along Time:** 2-3 hours

#### `crm/ROUNDTABLE-SETUP-GUIDE.md` (Comprehensive Guide)
- **Purpose:** Detailed setup documentation
- **Size:** ~35 KB
- **Target Audience:** Technical users, future reference
- **Key Sections:**
  - System architecture
  - Prerequisites
  - Database setup (detailed)
  - Frontend configuration
  - Email automation (3 options)
  - Admin access configuration
  - Testing checklist (50+ items)
  - Deployment options
  - Maintenance schedule
  - Troubleshooting
- **Reading Time:** 30-45 minutes

#### `crm/ROUNDTABLE-EMAIL-TEMPLATES.md` (Email Library)
- **Purpose:** All email templates and automation docs
- **Size:** ~18 KB
- **Target Audience:** You + email automation setup
- **Key Content:**
  - 12 complete email templates
  - Triggers for each email
  - Timing specifications
  - Email automation options (4 platforms)
  - Tracking implementation
  - Anti-LLM writing checklist
- **Email Count:** 12 templates

#### `crm/ROUNDTABLE-IMPLEMENTATION-SUMMARY.md` (System Overview)
- **Purpose:** High-level system documentation
- **Size:** ~16 KB
- **Target Audience:** Overview, future reference
- **Key Sections:**
  - What was built
  - System architecture diagram
  - Technical decisions and rationale
  - Implementation status
  - Next steps to launch
  - Success metrics
  - FAQ
  - Future enhancements
- **Reading Time:** 20-30 minutes

#### `crm/LINKEDIN-ANNOUNCEMENT-TEMPLATE.md` (Launch Posts)
- **Purpose:** LinkedIn announcement templates
- **Size:** ~9 KB
- **Target Audience:** You for November 27 launch
- **Key Content:**
  - 4 LinkedIn post options
  - Post best practices
  - Follow-up strategy
  - Comment response templates
  - DM template for direct outreach
  - Analytics tracking
- **Post Options:** 4 variations to choose from

#### `ROUNDTABLE-FILE-MANIFEST.md` (This File)
- **Purpose:** Complete file inventory
- **Size:** ~8 KB
- **Target Audience:** You, for reference
- **Key Content:**
  - Directory structure
  - File descriptions
  - Configuration requirements
  - Reading order

---

## 📖 Recommended Reading Order

### For Deployment (Before Launch)

1. **Start:** `QUICK-START-DEPLOYMENT.md` - Follow step-by-step
2. **Reference:** `ROUNDTABLE-EMAIL-TEMPLATES.md` - Review email copy
3. **Plan:** `LINKEDIN-ANNOUNCEMENT-TEMPLATE.md` - Draft announcement
4. **Overview:** `roundtable/README.md` - Quick system reference

### For Understanding System

1. **Overview:** `ROUNDTABLE-IMPLEMENTATION-SUMMARY.md`
2. **Details:** `ROUNDTABLE-SETUP-GUIDE.md`
3. **Technical:** Database SQL files + Edge Function template

### For Launch Day

1. **Final Check:** Pre-launch checklist in `QUICK-START-DEPLOYMENT.md`
2. **Post:** Choose from `LINKEDIN-ANNOUNCEMENT-TEMPLATE.md`
3. **Monitor:** Admin dashboard (`roundtable-admin.html`)

---

## ⚙️ Configuration Summary

### Files Requiring Supabase Credentials (3 files)

1. `roundtable/index.html` - Line ~272
2. `roundtable/apply/index.html` - Line ~381
3. `crm/roundtable-admin.html` - Line ~424

**What to update:**
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';  // Replace with your URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // Replace with your key
```

### Files Requiring Edge Function URL (1 file)

1. `crm/email-automation-trigger.sql` - Lines 21 and 62

**What to update:**
```sql
v_edge_function_url TEXT := 'YOUR_EDGE_FUNCTION_URL';  -- Replace with function URL
```

### Files Requiring Secrets (via CLI)

1. `crm/supabase-edge-function-template.ts`

**Command:**
```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
```

---

## 🗄️ Database Objects Created

### Tables (2)
- `roundtable_cohorts` - Session information
- `roundtable_applications` - Application data

### Functions (3)
- `update_updated_at_column()` - Auto-update timestamps
- `calculate_roundtable_score()` - Scoring logic (60+ lines)
- `set_roundtable_application_score()` - Trigger wrapper

### Triggers (4)
- `update_roundtable_cohorts_updated_at` - Update timestamp
- `update_roundtable_applications_updated_at` - Update timestamp
- `calculate_score_before_insert_or_update` - Auto-scoring
- `send_email_on_application_submit` - Email on new app
- `send_email_on_status_change` - Email on status change

### Indexes (7)
- `idx_roundtable_applications_status`
- `idx_roundtable_applications_email`
- `idx_roundtable_applications_cohort_id`
- `idx_roundtable_applications_score`
- `idx_roundtable_applications_created_at`
- `idx_roundtable_cohorts_date`
- `idx_roundtable_cohorts_status`

### RLS Policies (6)
- Public can view upcoming cohorts
- Admins can manage all cohorts
- Anyone can insert applications
- Admins can view all applications
- Admins can update all applications
- Admins can delete applications

---

## 📊 System Statistics

### Code Statistics
- **Total Lines of Code:** ~3,500
- **HTML:** ~2,000 lines (3 pages)
- **SQL:** ~400 lines (3 files)
- **TypeScript:** ~250 lines (1 file)
- **Markdown:** ~2,500 lines (7 docs)

### File Count
- **HTML Files:** 3
- **SQL Files:** 3
- **TypeScript Files:** 1
- **Markdown Files:** 8
- **Total Files:** 15

### Documentation
- **Total Words:** ~25,000
- **Reading Time:** ~2-3 hours (all docs)
- **Email Templates:** 12
- **LinkedIn Post Options:** 4

---

## 🎯 What Each File Does (TL;DR)

| File | Purpose | Who Uses It |
|------|---------|-------------|
| `roundtable/index.html` | Landing page | Public visitors |
| `roundtable/apply/index.html` | Application form | Applicants |
| `roundtable/thank-you/index.html` | Confirmation | Applicants after submit |
| `roundtable/README.md` | System overview | You (quick reference) |
| `crm/roundtable-admin.html` | Admin dashboard | You (manage apps) |
| `crm/roundtable-schema.sql` | Database structure | Run once in Supabase |
| `crm/roundtable-first-cohort.sql` | First cohort | Run once in Supabase |
| `crm/email-automation-trigger.sql` | Email triggers | Run once in Supabase |
| `crm/supabase-edge-function-template.ts` | Email function | Deploy to Supabase |
| `crm/QUICK-START-DEPLOYMENT.md` | Setup guide | You (for setup) |
| `crm/ROUNDTABLE-SETUP-GUIDE.md` | Detailed guide | Reference |
| `crm/ROUNDTABLE-EMAIL-TEMPLATES.md` | Email library | You (email content) |
| `crm/ROUNDTABLE-IMPLEMENTATION-SUMMARY.md` | System overview | Reference |
| `crm/LINKEDIN-ANNOUNCEMENT-TEMPLATE.md` | Launch posts | You (Nov 27) |
| `ROUNDTABLE-FILE-MANIFEST.md` | This file | You (reference) |

---

## ✅ Deployment Checklist

Use this to track which files you've configured:

### Configuration
- [ ] Updated Supabase credentials in `roundtable/index.html`
- [ ] Updated Supabase credentials in `roundtable/apply/index.html`
- [ ] Updated Supabase credentials in `crm/roundtable-admin.html`
- [ ] Updated Edge Function URL in `email-automation-trigger.sql`

### Database
- [ ] Ran `roundtable-schema.sql` in Supabase
- [ ] Ran `roundtable-first-cohort.sql` in Supabase
- [ ] Verified cohort created (Dec 4, 2025)
- [ ] Tested application insert

### Email
- [ ] Created Resend account
- [ ] Verified domain (cloverera.com)
- [ ] Deployed Edge Function (`supabase-edge-function-template.ts`)
- [ ] Set RESEND_API_KEY secret
- [ ] Ran `email-automation-trigger.sql` in Supabase
- [ ] Tested email send

### Frontend
- [ ] Uploaded `roundtable/` folder to web root
- [ ] Uploaded `crm/roundtable-admin.html` to CRM folder
- [ ] Tested landing page loads
- [ ] Tested application form submits
- [ ] Tested admin dashboard loads

### Pre-Launch
- [ ] Submitted test application
- [ ] Verified test email received
- [ ] Accepted test application
- [ ] Verified acceptance email received
- [ ] Tested on mobile
- [ ] Drafted LinkedIn post

---

## 📞 Support

If you need help with any file:

1. Check the relevant documentation:
   - **Setup issues:** `QUICK-START-DEPLOYMENT.md`
   - **Email questions:** `ROUNDTABLE-EMAIL-TEMPLATES.md`
   - **System overview:** `ROUNDTABLE-IMPLEMENTATION-SUMMARY.md`

2. Check troubleshooting sections in guides

3. External resources:
   - Supabase: [supabase.com/docs](https://supabase.com/docs)
   - Resend: [resend.com/docs](https://resend.com/docs)

---

## 🎉 Ready to Launch

All files are ready. Follow these steps:

1. Read `QUICK-START-DEPLOYMENT.md`
2. Follow setup steps (2-3 hours)
3. Complete deployment checklist above
4. Test end-to-end
5. Draft LinkedIn post from `LINKEDIN-ANNOUNCEMENT-TEMPLATE.md`
6. Announce November 27
7. Run cohort December 4

**Good luck with your Retention Reality Roundtable! 🍀**
