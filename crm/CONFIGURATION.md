# Clover ERA CRM - Configuration & Setup

**Last Updated**: November 2025
**Version**: 1.0

---

## System Architecture

### **Deployment Model: Single-Tenant**

This CRM is configured as a **single-tenant system**:

✅ **What this means:**
- One organization (Clover ERA) uses the entire system
- All users belong to the same company
- All data is shared across authenticated users
- No data isolation between users needed

❌ **What this is NOT:**
- Multi-tenant SaaS platform
- Each client has separate data
- User-level data isolation

### **Security Implications**

Because this is single-tenant:
- ✅ Current RLS policies are appropriate
- ✅ Any authenticated user can see all CRM data (as intended)
- ✅ No organization_id needed in database tables
- ✅ Simpler security model

**If this changes in the future:**
If you need to give clients their own login to see ONLY their data, you'll need to:
1. Add organization_id to all tables
2. Update RLS policies to filter by organization
3. Implement organization management
4. See SECURITY-ASSESSMENT.md for details

---

## Supabase Configuration

### **Project Details**
- **Project URL**: https://drugebiitlcjkknjfxeh.supabase.co
- **Project ID**: drugebiitlcjkknjfxeh
- **Region**: (Check in Supabase dashboard → Settings → General)
- **Plan**: (Check in Supabase dashboard → Settings → Billing)

### **Database Settings**

#### Encryption at Rest
**Status**: ✅ Enabled (default on all Supabase plans)

**How to verify:**
1. Dashboard → Settings → Database
2. Look for "Encryption" section
3. Should show: "Encryption at rest: Enabled"

#### Connection Pooling
**Default Settings:**
- Pool Mode: Transaction
- Pool Size: 15 (adjustable based on plan)

**How to check:**
1. Dashboard → Settings → Database
2. Scroll to "Connection Pooling" section

### **API Settings**

#### Rate Limiting

**Current Configuration:**

| Limit Type | Setting | Notes |
|------------|---------|-------|
| Global API Requests | 60/min (Free tier default) | Upgrade to Pro for custom limits |
| Email Signups | 10/hour per IP | Built-in protection |
| Password Recovery | 5/hour per email | Prevents abuse |
| Login Attempts | 30/hour per IP | Brute force protection |

**How to configure:**
1. Dashboard → Settings → API → Rate Limiting
2. Or: Dashboard → Authentication → Rate Limits

**Recommended limits for production:**
- API Requests: 100-200 per minute per user
- Login Attempts: 5 per 15 minutes (requires Pro plan)

#### CORS Settings
**Current**: Allowed origins configured in Supabase dashboard

**How to verify:**
1. Dashboard → Settings → API
2. Scroll to "API Settings"
3. Check "Allowed Origins"
4. Should include: `https://cloverera.com`

### **Authentication Settings**

#### Password Policy
**Current Settings** (as of Nov 2025):
- Minimum length: 6 characters (Supabase default)
- No complexity requirements

**Recommended changes:**
1. Dashboard → Authentication → Policies
2. Set minimum length to **12 characters**
3. Enable "Check if password has been leaked" (if available)

#### Email Settings
**Current**:
- Email confirmations: Enabled/Disabled (check dashboard)
- Magic link expiry: 1 hour (default)

**How to check:**
1. Dashboard → Authentication → Email Templates
2. Review confirmation and recovery templates

#### Session Settings
**Current**:
- JWT expiry: 1 hour (default)
- Refresh token expiry: 30 days (default)

**How to check:**
1. Dashboard → Settings → API
2. Look for "JWT Settings"

---

## Security Checklist

### ✅ Completed
- [x] HTTPS enabled on cloverera.com
- [x] Supabase authentication configured
- [x] RLS enabled on all tables
- [x] Basic rate limiting (default)
- [x] Documented as single-tenant

### ⚠️ Pending (Next 30 days)
- [ ] Verify encryption at rest in dashboard
- [ ] Configure enhanced rate limiting (if on Pro plan)
- [ ] Strengthen password policy to 12 characters
- [ ] Review and update RLS policies
- [ ] Add input validation

### 📋 Future Improvements (90 days)
- [ ] Implement audit logging
- [ ] Enable 2FA for admin users
- [ ] Add Content Security Policy headers
- [ ] Create incident response plan

---

## User Roles & Permissions

### Current Roles

#### 1. Admin
**Access Level**: Full access to everything

**Permissions**:
- ✅ View/edit all companies, opportunities, activities
- ✅ Access Admin page
- ✅ Manage users (view, update roles, delete)
- ✅ Access all CRM features
- ✅ Delete records

**Users with Admin role**:
- Check in: CRM → Admin page
- Or: Supabase Dashboard → Table Editor → profiles

#### 2. Regular User
**Access Level**: Full access to CRM data (single-tenant model)

**Permissions**:
- ✅ View/edit all companies, opportunities, activities
- ✅ Create new records
- ✅ Delete own activities
- ❌ Cannot access Admin page
- ❌ Cannot manage other users

**Note**: Because this is single-tenant, regular users can see ALL data (by design).

---

## Database Schema

### Tables Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profiles & roles | id, email, full_name, role |
| `companies` | Customer/prospect companies | id, name, status, industry |
| `contacts` | People at companies | id, company_id, first_name, last_name, email |
| `opportunities` | Sales deals | id, company_id, contact_id, stage, value |
| `activities` | Interactions/tasks | id, opportunity_id, type, subject, due_date |

### Row Level Security (RLS) Policies

**Current Policy**: Authenticated users get full access

```sql
-- Example from companies table
CREATE POLICY "Allow authenticated users full access to companies"
    ON companies FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

**Why this is OK**:
- Single-tenant system (one organization)
- All authenticated users should see all data
- Simpler security model

**When to change**:
- If implementing multi-tenant (each client has own data)
- If need user-level data restrictions
- See SECURITY-ASSESSMENT.md for guidance

---

## Backup & Recovery

### Automated Backups
**Supabase Plan-Dependent**:
- **Free**: Daily backups, 7-day retention
- **Pro**: Daily backups, 30-day retention + point-in-time recovery
- **Enterprise**: Custom retention

**How to check**:
1. Dashboard → Settings → Database
2. Scroll to "Database Backups" section
3. See schedule and retention period

### Manual Backup
**How to export data manually**:
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or via dashboard:
# Database → Backup & Restore → Create Backup
```

### Recovery Testing
**Recommended**: Test restore process quarterly
1. Create test backup
2. Restore to development environment
3. Verify data integrity

---

## Monitoring & Alerts

### What to Monitor

#### 1. API Usage
**Location**: Dashboard → Reports → API
**Watch for**:
- Unusual spikes in traffic
- Error rate increases
- Slow query performance

#### 2. Authentication
**Location**: Dashboard → Authentication → Users
**Watch for**:
- Failed login attempts
- New user registrations (should be none if invite-only)
- Session anomalies

#### 3. Database Performance
**Location**: Dashboard → Reports → Database
**Watch for**:
- High CPU usage (>80%)
- Slow queries (>1 second)
- Connection pool exhaustion

### Setting Up Alerts (Pro Plan)
1. Dashboard → Settings → Alerts
2. Configure email notifications for:
   - High error rates (>5% of requests)
   - Database CPU >90%
   - Storage >80% full

---

## Environment Variables

### Frontend (HTML files)
```javascript
// Located in all CRM HTML files (line ~647)
const SUPABASE_URL = 'https://drugebiitlcjkknjfxeh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Security Note**:
- ✅ ANON key is meant to be public (this is correct)
- ✅ Security comes from RLS policies, not hiding the key
- ❌ Never expose SERVICE_ROLE key in frontend

### How to Rotate Keys (if compromised)
1. Dashboard → Settings → API
2. Click "Regenerate" next to anon/public key
3. Update all HTML files with new key
4. Deploy immediately

---

## Deployment Process

### Current Setup
1. **Code Repository**: GitHub (clivehays/clover-era-page)
2. **Hosting**: GitHub Pages
3. **Domain**: cloverera.com (HTTPS via GitHub)
4. **Database**: Supabase (hosted PostgreSQL)

### Deploy New Changes
```bash
# After making changes
git add .
git commit -m "Description of changes"
git push origin main

# Changes go live automatically via GitHub Pages
# URL: https://cloverera.com/crm/
```

### Rollback Process
```bash
# Revert to previous commit
git log  # Find commit hash
git revert <commit-hash>
git push origin main
```

---

## Troubleshooting

### Common Issues

#### Issue: "Failed to load data"
**Possible Causes**:
- RLS policy blocking access
- Network connectivity
- Supabase service outage

**Solution**:
1. Check browser console for errors (F12)
2. Verify user is authenticated
3. Check Supabase status: https://status.supabase.com
4. Review RLS policies in dashboard

#### Issue: "Cannot connect to database"
**Possible Causes**:
- Invalid Supabase URL/key
- Database paused (Free tier after inactivity)

**Solution**:
1. Check SUPABASE_URL and SUPABASE_ANON_KEY in code
2. Dashboard → Database → Check if paused
3. Click "Resume" if needed

#### Issue: Slow performance
**Possible Causes**:
- Missing database indexes
- Too many records
- Inefficient queries

**Solution**:
1. Add indexes on frequently queried columns
2. Implement pagination
3. Review slow query log in dashboard

---

## Maintenance Schedule

### Daily
- ✅ Monitor Supabase email alerts (if configured)

### Weekly
- Check API usage in dashboard
- Review authentication logs for anomalies

### Monthly
- Review user access and roles
- Check database storage usage
- Review error logs

### Quarterly
- Test backup restore process
- Security assessment review
- Update dependencies (Supabase client library)

### Annually
- Full security audit
- Review and update RLS policies
- Disaster recovery drill

---

## Support & Resources

### Supabase Support
- **Documentation**: https://supabase.com/docs
- **Community**: https://discord.supabase.com
- **Status Page**: https://status.supabase.com
- **Email Support**: support@supabase.com (Pro/Enterprise plans)

### CRM Support
- **Documentation**: See crm/*.md files in repository
- **Issues**: https://github.com/clivehays/clover-era-page/issues

---

## Change Log

| Date | Change | Changed By |
|------|--------|------------|
| Nov 2025 | Initial CRM deployment | Development Team |
| Nov 2025 | Added Outlook/Teams integration (Phase 1) | Development Team |
| Nov 2025 | Security assessment completed | Development Team |
| Nov 2025 | Configuration documented | Development Team |

---

**Document Owner**: Clover ERA IT Team
**Next Review Date**: February 2026
