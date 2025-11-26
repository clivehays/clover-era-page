# Partner Portal Integration - Features & User Stories

## Project Overview

Integrate the existing Partner Portal (static HTML pages) into the Clover ERA backoffice system to enable partner user management, lead tracking, and customer dashboard access.

**Tech Stack:**
- Database: PostgreSQL
- Backend: API-based architecture
- Frontend: HTML with dynamic code
- Authentication: Email/Password

**Existing Assets to Integrate:**
- `/sales-portal.html` - Main partner sales portal
- `/team-onboarding.html` - Team onboarding guide
- `/email-templates/onboarding-followup.md` - Email template
- `/partner-opportunities/register.html` - Lead registration form
- `/partner-opportunities/dashboard.html` - Opportunity tracking dashboard

---

## Feature 1: Partner User Management

### Feature 1.1: Partner Self-Registration Flow

**Description:**
Enable partners to self-register through the existing partner application forms and create their accounts in the backoffice system.

**User Story 1.1.1: Partner Self-Registration**
```
As a prospective partner
I want to register through the partner application form
So that I can access the partner portal and start referring clients
```

**Acceptance Criteria:**
- [ ] Partner can access partner application form at `/partners/apply.html`
- [ ] Form captures: Name, Email, Company, Phone, Partner Type, Industry Focus
- [ ] Form submission creates a new user record with `user_type = 'partner'` and `status = 'pending'`
- [ ] System sends confirmation email to partner upon successful registration
- [ ] System sends notification to admin for partner approval
- [ ] Partner cannot login until admin approves their account

**Technical Requirements:**
- Add `user_type` column to users table: ENUM('admin', 'manager', 'partner', 'partner_admin')
- Add `partner_status` column: ENUM('pending', 'active', 'suspended', 'inactive')
- Add `partner_id` column (UUID) to identify partner organization
- Create API endpoint: `POST /api/partners/register`
- Create API endpoint: `GET /api/partners/pending` (admin only)

**Database Schema Changes:**
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'manager';
ALTER TABLE users ADD COLUMN partner_status VARCHAR(20);
ALTER TABLE users ADD COLUMN partner_id UUID;
ALTER TABLE users ADD COLUMN partner_organization VARCHAR(255);
ALTER TABLE users ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 25.00;

-- Create partners table
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name VARCHAR(255) NOT NULL,
    primary_contact_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    commission_rate DECIMAL(5,2) DEFAULT 25.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    notes TEXT
);

-- Index for performance
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_partner_id ON users(partner_id);
CREATE INDEX idx_partners_status ON partners(status);
```

---

**User Story 1.1.2: Admin Partner Approval**
```
As an admin
I want to review and approve partner applications
So that I can control who has access to the partner portal
```

**Acceptance Criteria:**
- [ ] Admin can view list of pending partner applications in backoffice
- [ ] Admin can see partner details: Name, Company, Email, Phone, Registration Date
- [ ] Admin can approve or reject partner application
- [ ] On approval, partner status changes to 'active' and partner receives welcome email with login credentials
- [ ] On rejection, partner receives email notification with optional reason
- [ ] Approved partners can login immediately

**Technical Requirements:**
- Add "Pending Partners" section to admin dashboard
- Create API endpoint: `PUT /api/partners/{id}/approve`
- Create API endpoint: `PUT /api/partners/{id}/reject`
- Email template: Partner Welcome Email (with password setup link)
- Email template: Partner Rejection Email

---

### Feature 1.2: Partner User Authentication

**User Story 1.2.1: Partner Login**
```
As an approved partner
I want to login to the Clover ERA backoffice
So that I can access partner-specific features and resources
```

**Acceptance Criteria:**
- [ ] Partner can login at existing login page with email/password
- [ ] System validates user_type = 'partner' and partner_status = 'active'
- [ ] Inactive or suspended partners cannot login (show appropriate error message)
- [ ] On successful login, partner is redirected to partner-specific dashboard
- [ ] Partner session is managed same as other user types (JWT/session)

**Technical Requirements:**
- Modify authentication middleware to handle partner user type
- Add partner status validation to login flow
- Create partner-specific redirect logic
- Update login API: `POST /api/auth/login` to handle partner users

---

### Feature 1.3: Partner User Roles

**User Story 1.3.1: Partner Admin vs Partner User**
```
As a partner organization owner
I want to designate admin and standard users within my organization
So that I can control access and permissions for my team
```

**Acceptance Criteria:**
- [ ] First user from partner organization is automatically designated as `partner_admin`
- [ ] Partner admin can invite additional users to their organization
- [ ] Partner admin can see all leads/customers for their organization
- [ ] Partner users can only see leads/customers they personally created
- [ ] Partner admin can view activity of all users in their organization

**Technical Requirements:**
- Add `user_type` distinction: `partner_admin` vs `partner`
- Create API endpoint: `POST /api/partners/invite` (partner_admin only)
- Create API endpoint: `GET /api/partners/{partner_id}/users`
- Implement row-level security based on partner_id and user permissions

**Database Schema:**
```sql
-- Track which partner user created each lead
ALTER TABLE leads ADD COLUMN created_by_partner_user_id UUID REFERENCES users(id);
```

---

## Feature 2: Partner Navigation & Portal Access

### Feature 2.1: Partner-Specific Navigation

**User Story 2.1.1: Partner Dashboard Navigation**
```
As a partner user
I want to see a customized navigation menu
So that I can access partner-specific features
```

**Acceptance Criteria:**
- [ ] Partner sees left sidebar navigation with these menu items:
  - 🏠 Home (Partner Dashboard)
  - 📊 Sales Portal (embedded sales-portal.html)
  - 🎯 My Opportunities (opportunities dashboard)
  - 🤝 My Customers (list of onboarded companies)
  - 📚 Resources (team onboarding guide, email templates)
  - ⚙️ Settings (profile, password, notifications)
- [ ] Partner does NOT see admin-only menu items:
  - Reports (admin only)
  - Companies (admin manages all, partners see "My Customers")
  - Questions (admin only)
  - Action Hub (admin only)
  - Team Structure (admin only)
  - Users (admin only)
  - LLM / LLM Batches (admin only)
- [ ] Navigation is dynamically rendered based on user_type

**Technical Requirements:**
- Create navigation component with role-based rendering
- Frontend logic: `if (user.user_type === 'partner' || user.user_type === 'partner_admin') { renderPartnerNav() }`
- API endpoint: `GET /api/users/me` returns user object with user_type and permissions

---

### Feature 2.2: Embedded Sales Portal

**User Story 2.2.1: Access Sales Portal from Backoffice**
```
As a partner user
I want to access the sales portal within the backoffice
So that I can view sales resources without leaving the platform
```

**Acceptance Criteria:**
- [ ] Clicking "Sales Portal" in navigation loads sales-portal.html content
- [ ] Sales portal is embedded as iframe or dynamically loaded content
- [ ] All navigation within sales portal works (anchor links, dropdowns, sections)
- [ ] Password protection from sales-portal.html is REMOVED (already authenticated)
- [ ] Back link "← Back to Partner Portal" is replaced with "← Back to Dashboard"
- [ ] All relative links in sales portal continue to work

**Technical Requirements:**
- Create route: `/backoffice/partner/sales-portal`
- Strip password modal from sales-portal.html when rendering in backoffice
- Update navigation links in embedded version
- Option 1: Server-side include sales-portal.html and modify
- Option 2: Create API endpoint that returns modified HTML: `GET /api/partners/sales-portal-content`

**Code Reference:**
```html
<!-- Remove this section from embedded version -->
<div id="passwordModal" style="display: none;">...</div>
<script>
    // Remove password check functions
    // window.onload = checkPasswordOnLoad;
    // function checkPassword() { ... }
</script>
```

---

### Feature 2.3: Team Onboarding Guide Access

**User Story 2.3.1: Access Team Onboarding Resources**
```
As a partner user
I want to access the team onboarding guide and email templates
So that I can conduct effective client onboarding sessions
```

**Acceptance Criteria:**
- [ ] Partner can click "Resources" in navigation
- [ ] Resources section shows:
  - 🎯 Team Onboarding Guide (link to team-onboarding.html)
  - 📧 Email Templates (download onboarding-followup.md)
  - 📥 Sales Collateral (links to PDFs from sales portal)
- [ ] Team onboarding guide opens in new tab or embedded in backoffice
- [ ] Email template downloads correctly
- [ ] Partner can return to dashboard from resources

**Technical Requirements:**
- Create route: `/backoffice/partner/resources`
- Create page listing all partner resources
- Link to existing team-onboarding.html (can be opened in new tab or embedded)
- Provide download link for email-templates/onboarding-followup.md

---

## Feature 3: Lead Management (My Opportunities)

### Feature 3.1: Lead Registration

**User Story 3.1.1: Register New Lead**
```
As a partner user
I want to register a new lead/opportunity
So that I can track my sales pipeline and earn commissions
```

**Acceptance Criteria:**
- [ ] Partner can click "Register New Lead" button
- [ ] Form loads from existing `/partner-opportunities/register.html`
- [ ] Form captures:
  - Company Name (required)
  - Contact Name (required)
  - Contact Email (required)
  - Contact Phone
  - Company Size (50-100, 100-200, 200-500, 500+)
  - Industry
  - Pain Points (checkboxes: Burnout, Turnover, Low Engagement, Culture Issues)
  - Notes
  - Lead Source (dropdown: Referral, Cold Outreach, Conference, Webinar, Other)
- [ ] On submit, lead is created with:
  - status = 'new'
  - partner_id = current user's partner_id
  - created_by_partner_user_id = current user's id
  - created_at = timestamp
- [ ] Success message shown: "Lead registered successfully!"
- [ ] Partner is redirected to "My Opportunities" dashboard

**Technical Requirements:**
- Integrate existing form from `/partner-opportunities/register.html`
- Create API endpoint: `POST /api/partners/leads`
- Validate that partner is active before allowing lead creation

**Database Schema:**
```sql
CREATE TABLE partner_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) NOT NULL,
    created_by_user_id UUID REFERENCES users(id) NOT NULL,

    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    company_size VARCHAR(50),
    industry VARCHAR(100),

    -- Sales Information
    status VARCHAR(50) DEFAULT 'new',
    lead_source VARCHAR(100),
    pain_points TEXT[], -- Array of pain points
    notes TEXT,

    -- Deal Tracking
    estimated_value DECIMAL(10,2),
    estimated_close_date DATE,

    -- Conversion Tracking
    converted_to_customer BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMP,
    company_id UUID REFERENCES companies(id), -- Link to actual customer when converted

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_partner_leads_partner_id ON partner_leads(partner_id);
CREATE INDEX idx_partner_leads_status ON partner_leads(status);
CREATE INDEX idx_partner_leads_created_by ON partner_leads(created_by_user_id);
CREATE INDEX idx_partner_leads_company_id ON partner_leads(company_id);
```

---

### Feature 3.2: Opportunity Dashboard

**User Story 3.2.1: View My Opportunities**
```
As a partner user
I want to see all my leads in a dashboard
So that I can track my sales pipeline and update deal status
```

**Acceptance Criteria:**
- [ ] Partner sees dashboard from `/partner-opportunities/dashboard.html`
- [ ] Dashboard shows tabs/filters:
  - All Opportunities
  - New Leads (status = 'new')
  - Qualified (status = 'qualified')
  - Demo Scheduled (status = 'demo_scheduled')
  - Proposal Sent (status = 'proposal_sent')
  - Negotiation (status = 'negotiation')
  - Won (status = 'won')
  - Lost (status = 'lost')
- [ ] Each opportunity card shows:
  - Company Name
  - Contact Name & Email
  - Status (with color coding)
  - Estimated Value
  - Last Activity Date
  - Days Since Last Activity
  - Quick Actions: View, Update Status, Add Note
- [ ] Partner can filter by status, date range, company size
- [ ] Partner can search by company name or contact name
- [ ] Partner admin sees ALL opportunities for their partner organization
- [ ] Partner user sees ONLY opportunities they created

**Technical Requirements:**
- Integrate existing dashboard from `/partner-opportunities/dashboard.html`
- Create API endpoint: `GET /api/partners/leads?status={status}&partner_id={partner_id}`
- Implement filtering and search on backend
- Row-level security:
  - Partner admin: WHERE partner_id = {user.partner_id}
  - Partner user: WHERE created_by_user_id = {user.id}

---

**User Story 3.2.2: Update Lead Status**
```
As a partner user
I want to update the status of my leads
So that I can track deal progression and mark conversions
```

**Acceptance Criteria:**
- [ ] Partner can click on opportunity card to view details
- [ ] Detail view shows all lead information + activity timeline
- [ ] Partner can update status via dropdown:
  - New → Qualified
  - Qualified → Demo Scheduled
  - Demo Scheduled → Proposal Sent
  - Proposal Sent → Negotiation
  - Negotiation → Won or Lost
- [ ] When status is changed to "Won", system prompts:
  - "Has this lead been converted to a customer?"
  - If Yes: Link to existing company or create new company
  - If No: Keep as won opportunity (future conversion)
- [ ] Partner can add notes to opportunity
- [ ] All status changes are logged in activity timeline
- [ ] last_activity_at timestamp is updated automatically

**Technical Requirements:**
- Create API endpoint: `PUT /api/partners/leads/{lead_id}`
- Create API endpoint: `POST /api/partners/leads/{lead_id}/notes`
- Create API endpoint: `GET /api/partners/leads/{lead_id}/activity`
- When status = 'won' and converted = true, create link to companies table

**Database Schema:**
```sql
-- Activity log for lead updates
CREATE TABLE partner_lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES partner_leads(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'status_change', 'note_added', 'email_sent', 'call_made'
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_activities_lead_id ON partner_lead_activities(lead_id);
```

---

## Feature 4: Customer Management (My Customers)

### Feature 4.1: View Customer List

**User Story 4.1.1: View My Customers**
```
As a partner user
I want to see a list of all customers I've onboarded
So that I can track their engagement and identify upsell opportunities
```

**Acceptance Criteria:**
- [ ] Partner clicks "My Customers" in navigation
- [ ] Page shows list of companies where:
  - company.partner_id = current user's partner_id
  - OR company.id is linked to a converted lead (partner_leads.company_id)
- [ ] Each customer card shows:
  - Company Name
  - Number of Teams
  - Number of Active Employees
  - Overall Engagement Score (if available)
  - Onboarded Date
  - Status: Active, Trial, Churned
  - Action: View Dashboard
- [ ] Partner admin sees ALL customers for their partner organization
- [ ] Partner user sees ONLY customers from leads they created
- [ ] Customer list can be filtered by status, date range
- [ ] Customer list can be searched by company name

**Technical Requirements:**
- Create route: `/backoffice/partner/customers`
- Create API endpoint: `GET /api/partners/customers?partner_id={partner_id}`
- Query joins companies table with partner_leads table
- Row-level security based on partner_id and created_by_user_id

**Database Schema:**
```sql
-- Add partner tracking to companies table
ALTER TABLE companies ADD COLUMN partner_id UUID REFERENCES partners(id);
ALTER TABLE companies ADD COLUMN referred_by_user_id UUID REFERENCES users(id);
ALTER TABLE companies ADD COLUMN onboarded_at TIMESTAMP;

CREATE INDEX idx_companies_partner_id ON companies(partner_id);
```

---

### Feature 4.2: View Customer Dashboard

**User Story 4.2.1: Access Customer Engagement Dashboard**
```
As a partner user
I want to view the engagement dashboard for my customers
So that I can monitor their success and identify intervention opportunities
```

**Acceptance Criteria:**
- [ ] Partner can click "View Dashboard" on any customer in "My Customers" list
- [ ] System loads the company's engagement dashboard (same view as screenshot provided)
- [ ] Dashboard shows:
  - Overall Engagement Score (0-100%)
  - Response Rate
  - 14-Day Trend
  - Health metrics for CLOVER elements:
    - Communication
    - Learning
    - Opportunities
    - Vulnerability
    - Enablement
    - Reflection
  - Color-coded status bars (Excellent, Good, Needs Work, Urgent Attention)
- [ ] Partner can select team from dropdown (if multiple teams exist)
- [ ] Partner can select report date range (Last 2 Weeks default)
- [ ] Partner CANNOT see:
  - Individual employee responses
  - Individual employee names
  - Action Hub (admin/manager only)
  - Team Structure editing (admin/manager only)
- [ ] Partner can ONLY see aggregated, anonymized team-level data

**Technical Requirements:**
- Create route: `/backoffice/partner/customers/{company_id}/dashboard`
- Use existing dashboard component/page (same as managers see)
- Add authorization check: Verify company.partner_id = user.partner_id
- Hide sensitive sections (Action Hub, Team Structure, Individual Data)
- Create API endpoint: `GET /api/partners/customers/{company_id}/dashboard`
- API returns only aggregated team-level metrics

**Security Considerations:**
```javascript
// Example authorization middleware
function authorizePartnerCustomerAccess(req, res, next) {
    const { company_id } = req.params;
    const { partner_id, user_type } = req.user;

    // Admin can see everything
    if (user_type === 'admin') return next();

    // Partners can only see their customers
    if (user_type === 'partner' || user_type === 'partner_admin') {
        db.query(
            'SELECT partner_id FROM companies WHERE id = $1',
            [company_id],
            (err, result) => {
                if (result.rows[0].partner_id === partner_id) {
                    return next();
                }
                return res.status(403).json({ error: 'Access denied' });
            }
        );
    }
}
```

---

**User Story 4.2.2: Export Customer Report**
```
As a partner user
I want to export the engagement dashboard as PDF
So that I can share progress with my customer contacts
```

**Acceptance Criteria:**
- [ ] Partner sees "Export PDF" button on customer dashboard
- [ ] Clicking button generates PDF of current dashboard view
- [ ] PDF includes:
  - Company Name
  - Report Date Range
  - Overall Engagement Score
  - CLOVER element scores with visual indicators
  - Clover ERA branding
  - Partner organization name (footer)
- [ ] PDF downloads automatically

**Technical Requirements:**
- Create API endpoint: `GET /api/partners/customers/{company_id}/export-pdf`
- Use existing PDF generation library
- Include partner branding in PDF

---

## Feature 5: Settings & Profile Management

### Feature 5.1: Partner Profile Settings

**User Story 5.1.1: Update Partner Profile**
```
As a partner user
I want to update my profile information
So that I can keep my contact details current
```

**Acceptance Criteria:**
- [ ] Partner can access Settings from navigation
- [ ] Profile page shows editable fields:
  - Name
  - Email (with verification if changed)
  - Phone
  - Organization Name (partner_admin only)
  - Profile Photo (optional)
- [ ] Partner can change password
- [ ] Changes are saved with confirmation message

**Technical Requirements:**
- Create route: `/backoffice/partner/settings`
- Create API endpoint: `PUT /api/users/{user_id}/profile`
- Create API endpoint: `PUT /api/users/{user_id}/password`
- Email verification flow if email is changed

---

## Feature 6: Admin Management of Partners

### Feature 6.1: Admin Partner Overview

**User Story 6.1.1: View All Partners**
```
As an admin
I want to view all partner organizations and their performance
So that I can manage the partner program effectively
```

**Acceptance Criteria:**
- [ ] Admin sees "Partners" menu item in left navigation
- [ ] Partners page shows:
  - List of all partner organizations
  - Status (Active, Pending, Suspended, Inactive)
  - Number of users per partner
  - Number of leads registered
  - Number of customers onboarded
  - Total ARR from partner's customers
  - Join Date
  - Actions: View Details, Edit, Suspend, Activate
- [ ] Admin can filter by status
- [ ] Admin can search by organization name

**Technical Requirements:**
- Create route: `/backoffice/admin/partners`
- Create API endpoint: `GET /api/admin/partners`
- Join data from partners, partner_leads, and companies tables

---

**User Story 6.1.2: View Partner Details**
```
As an admin
I want to view detailed information about a specific partner
So that I can monitor their activity and provide support
```

**Acceptance Criteria:**
- [ ] Admin can click on partner organization to view details
- [ ] Detail page shows:
  - Organization Information (name, primary contact, join date)
  - Partner Users (list of all users in organization)
  - Lead Pipeline (breakdown of leads by status)
  - Customers (list of onboarded customers)
  - Activity Timeline (recent activities)
  - Commission Summary (total earned - future enhancement)
- [ ] Admin can suspend or activate partner from this page
- [ ] Admin can add internal notes (not visible to partner)

**Technical Requirements:**
- Create route: `/backoffice/admin/partners/{partner_id}`
- Create API endpoint: `GET /api/admin/partners/{partner_id}`
- Create API endpoint: `PUT /api/admin/partners/{partner_id}/status`

---

## Implementation Priority

### Phase 1: MVP (Weeks 1-2)
**Goal: Get partners able to login and access basic portal**

1. ✅ Database schema changes (users, partners, partner_leads tables)
2. ✅ Partner self-registration flow
3. ✅ Admin partner approval
4. ✅ Partner login authentication
5. ✅ Partner-specific navigation
6. ✅ Embedded sales portal (remove password protection)
7. ✅ Basic lead registration
8. ✅ Basic opportunity dashboard

### Phase 2: Core Features (Weeks 3-4)
**Goal: Full lead management and customer visibility**

9. ✅ Complete lead registration form integration
10. ✅ Lead status updates and activity tracking
11. ✅ My Customers list
12. ✅ Customer dashboard access (view-only, aggregated data)
13. ✅ Partner profile settings
14. ✅ Team onboarding guide access
15. ✅ Email template access

### Phase 3: Admin & Advanced Features (Weeks 5-6)
**Goal: Admin control and enhanced partner experience**

16. ✅ Partner admin vs partner user roles
17. ✅ Admin partner management dashboard
18. ✅ Partner activity monitoring
19. ✅ Dashboard PDF export
20. ✅ Partner invite workflow

### Phase 4: Future Enhancements (Post-MVP)
**Goal: Nice-to-haves and optimizations**

21. Commission tracking and reporting
22. Notifications (email/in-app)
23. Partner performance analytics
24. Advanced filtering and search
25. Bulk lead import
26. API access for partners

---

## Technical Architecture

### Authentication Flow
```
1. User enters email/password at login
2. Backend validates credentials
3. If valid, check user_type and partner_status
4. If partner:
   - Verify partner_status = 'active'
   - Generate JWT with user_id, user_type, partner_id
   - Return token + user object
5. Frontend stores token and user object
6. Frontend redirects based on user_type:
   - admin → /backoffice/admin/dashboard
   - manager → /backoffice/dashboard
   - partner → /backoffice/partner/dashboard
```

### Authorization Middleware
```javascript
// Check if user is partner
function isPartner(req, res, next) {
    if (req.user.user_type === 'partner' || req.user.user_type === 'partner_admin') {
        return next();
    }
    return res.status(403).json({ error: 'Partner access required' });
}

// Check if partner is active
function isActivePartner(req, res, next) {
    if (req.user.partner_status === 'active') {
        return next();
    }
    return res.status(403).json({ error: 'Partner account is not active' });
}

// Check if partner admin
function isPartnerAdmin(req, res, next) {
    if (req.user.user_type === 'partner_admin') {
        return next();
    }
    return res.status(403).json({ error: 'Partner admin access required' });
}

// Check if partner owns the resource
function ownsResource(resourceType) {
    return async (req, res, next) => {
        const { id } = req.params;
        const { partner_id, user_type, id: user_id } = req.user;

        // Admin can access everything
        if (user_type === 'admin') return next();

        // Query based on resource type
        let query;
        if (resourceType === 'lead') {
            query = 'SELECT partner_id, created_by_user_id FROM partner_leads WHERE id = $1';
        } else if (resourceType === 'customer') {
            query = 'SELECT partner_id FROM companies WHERE id = $1';
        }

        const result = await db.query(query, [id]);
        const resource = result.rows[0];

        // Partner admin can access all resources for their organization
        if (user_type === 'partner_admin' && resource.partner_id === partner_id) {
            return next();
        }

        // Partner user can only access resources they created
        if (user_type === 'partner' && resource.created_by_user_id === user_id) {
            return next();
        }

        return res.status(403).json({ error: 'Access denied' });
    };
}
```

### API Route Examples
```javascript
// Partner Routes
app.post('/api/partners/register', registerPartner);
app.post('/api/auth/login', login); // Modified to handle partners

// Partner Portal (requires active partner)
app.get('/api/partners/sales-portal-content', isPartner, isActivePartner, getSalesPortalContent);

// Lead Management
app.post('/api/partners/leads', isPartner, isActivePartner, createLead);
app.get('/api/partners/leads', isPartner, isActivePartner, getPartnerLeads);
app.get('/api/partners/leads/:id', isPartner, isActivePartner, ownsResource('lead'), getLeadDetails);
app.put('/api/partners/leads/:id', isPartner, isActivePartner, ownsResource('lead'), updateLead);
app.post('/api/partners/leads/:id/notes', isPartner, isActivePartner, ownsResource('lead'), addLeadNote);

// Customer Access
app.get('/api/partners/customers', isPartner, isActivePartner, getPartnerCustomers);
app.get('/api/partners/customers/:id/dashboard', isPartner, isActivePartner, ownsResource('customer'), getCustomerDashboard);
app.get('/api/partners/customers/:id/export-pdf', isPartner, isActivePartner, ownsResource('customer'), exportDashboardPDF);

// Partner Admin Only
app.post('/api/partners/invite', isPartnerAdmin, isActivePartner, invitePartnerUser);
app.get('/api/partners/:partner_id/users', isPartnerAdmin, isActivePartner, getPartnerUsers);

// Admin Partner Management
app.get('/api/admin/partners', isAdmin, getAllPartners);
app.get('/api/admin/partners/pending', isAdmin, getPendingPartners);
app.put('/api/admin/partners/:id/approve', isAdmin, approvePartner);
app.put('/api/admin/partners/:id/reject', isAdmin, rejectPartner);
app.get('/api/admin/partners/:id', isAdmin, getPartnerDetails);
app.put('/api/admin/partners/:id/status', isAdmin, updatePartnerStatus);
```

---

## Database Migration Scripts

### Migration 1: Add User Type Support
```sql
-- File: migrations/001_add_partner_user_types.sql

BEGIN;

-- Add user_type column
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'manager';
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_status VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_organization VARCHAR(255);

-- Add constraint
ALTER TABLE users ADD CONSTRAINT check_user_type
    CHECK (user_type IN ('admin', 'manager', 'partner', 'partner_admin'));

ALTER TABLE users ADD CONSTRAINT check_partner_status
    CHECK (partner_status IS NULL OR partner_status IN ('pending', 'active', 'suspended', 'inactive'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);

COMMIT;
```

### Migration 2: Create Partners Table
```sql
-- File: migrations/002_create_partners_table.sql

BEGIN;

CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name VARCHAR(255) NOT NULL,
    primary_contact_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    commission_rate DECIMAL(5,2) DEFAULT 25.00,

    -- Application details
    industry_focus VARCHAR(100),
    expected_monthly_referrals INT,
    why_partner TEXT,

    -- Approval tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),

    -- Notes
    admin_notes TEXT,

    CONSTRAINT check_partner_status CHECK (status IN ('pending', 'active', 'suspended', 'inactive'))
);

CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_primary_contact ON partners(primary_contact_id);

COMMIT;
```

### Migration 3: Create Partner Leads Table
```sql
-- File: migrations/003_create_partner_leads_table.sql

BEGIN;

CREATE TABLE IF NOT EXISTS partner_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) NOT NULL,
    created_by_user_id UUID REFERENCES users(id) NOT NULL,

    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    company_size VARCHAR(50),
    industry VARCHAR(100),

    -- Sales Information
    status VARCHAR(50) DEFAULT 'new',
    lead_source VARCHAR(100),
    pain_points TEXT[],
    notes TEXT,

    -- Deal Tracking
    estimated_value DECIMAL(10,2),
    estimated_close_date DATE,

    -- Conversion Tracking
    converted_to_customer BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMP,
    company_id UUID REFERENCES companies(id),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_lead_status CHECK (
        status IN ('new', 'qualified', 'demo_scheduled', 'proposal_sent',
                   'negotiation', 'won', 'lost', 'on_hold')
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_leads_partner_id ON partner_leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_leads_status ON partner_leads(status);
CREATE INDEX IF NOT EXISTS idx_partner_leads_created_by ON partner_leads(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_leads_company_id ON partner_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_partner_leads_created_at ON partner_leads(created_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_partner_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_partner_leads_updated_at
    BEFORE UPDATE ON partner_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_leads_updated_at();

COMMIT;
```

### Migration 4: Create Lead Activity Log
```sql
-- File: migrations/004_create_lead_activities_table.sql

BEGIN;

CREATE TABLE IF NOT EXISTS partner_lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES partner_leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_activity_type CHECK (
        activity_type IN ('status_change', 'note_added', 'email_sent',
                         'call_made', 'meeting_scheduled', 'proposal_sent',
                         'converted', 'lost')
    )
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON partner_lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON partner_lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON partner_lead_activities(created_at);

COMMIT;
```

### Migration 5: Update Companies Table
```sql
-- File: migrations/005_update_companies_for_partners.sql

BEGIN;

-- Add partner tracking to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES users(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMP;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS original_lead_id UUID REFERENCES partner_leads(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_partner_id ON companies(partner_id);
CREATE INDEX IF NOT EXISTS idx_companies_referred_by ON companies(referred_by_user_id);

COMMIT;
```

---

## Frontend Integration Guide

### 1. Existing Assets Location
All existing HTML/templates to integrate:
- `/sales-portal.html` - Main sales portal (password-protected, needs modification)
- `/team-onboarding.html` - Onboarding guide (no modification needed)
- `/email-templates/onboarding-followup.md` - Email template (no modification needed)
- `/partner-opportunities/register.html` - Lead registration form (needs backend integration)
- `/partner-opportunities/dashboard.html` - Opportunity dashboard (needs backend integration)

### 2. Sales Portal Modifications Required

**Remove Password Protection:**
```html
<!-- REMOVE THIS ENTIRE SECTION -->
<div id="passwordModal" style="display: none; ...">
    ...password modal HTML...
</div>

<script>
    // REMOVE THESE FUNCTIONS
    window.onload = checkPasswordOnLoad;
    function checkPasswordOnLoad() { ... }
    function checkPassword() { ... }
</script>
```

**Update Navigation Link:**
```html
<!-- CHANGE FROM: -->
<a href="/" class="back-link">← Back to Website</a>

<!-- CHANGE TO: -->
<a href="/backoffice/partner/dashboard" class="back-link">← Back to Dashboard</a>
```

### 3. Navigation Component Structure

```javascript
// Example React/Vue component structure
const PartnerNavigation = () => {
    const { user } = useAuth();

    if (user.user_type === 'partner' || user.user_type === 'partner_admin') {
        return (
            <nav className="sidebar">
                <NavItem icon="🏠" label="Dashboard" href="/backoffice/partner/dashboard" />
                <NavItem icon="📊" label="Sales Portal" href="/backoffice/partner/sales-portal" />
                <NavItem icon="🎯" label="My Opportunities" href="/backoffice/partner/opportunities" />
                <NavItem icon="🤝" label="My Customers" href="/backoffice/partner/customers" />
                <NavItem icon="📚" label="Resources" href="/backoffice/partner/resources" />
                <NavItem icon="⚙️" label="Settings" href="/backoffice/partner/settings" />
            </nav>
        );
    }

    // Return admin/manager navigation for other user types
    return <AdminNavigation />;
};
```

### 4. Opportunity Dashboard Integration

The existing dashboard at `/partner-opportunities/dashboard.html` needs to be converted to dynamic template with API integration:

**Data Structure Expected:**
```javascript
// API Response: GET /api/partners/leads
{
    "leads": [
        {
            "id": "uuid",
            "company_name": "Acme Corp",
            "contact_name": "John Smith",
            "contact_email": "john@acme.com",
            "status": "demo_scheduled",
            "estimated_value": 35000,
            "company_size": "200-500",
            "created_at": "2025-01-15T10:00:00Z",
            "last_activity_at": "2025-01-20T14:30:00Z",
            "days_since_activity": 3
        },
        // ... more leads
    ],
    "summary": {
        "total_leads": 42,
        "by_status": {
            "new": 8,
            "qualified": 12,
            "demo_scheduled": 5,
            "proposal_sent": 7,
            "negotiation": 4,
            "won": 4,
            "lost": 2
        },
        "total_estimated_value": 1450000
    }
}
```

### 5. Customer Dashboard Access Control

When rendering customer dashboard for partners, hide these sections:

```javascript
// Example conditional rendering
function renderCustomerDashboard(company, user) {
    const isPartner = user.user_type === 'partner' || user.user_type === 'partner_admin';

    return (
        <div>
            {/* SHOW: Engagement scores */}
            <EngagementScoreCard data={company.engagement_data} />

            {/* SHOW: CLOVER metrics */}
            <CLOVERMetrics data={company.clover_scores} />

            {/* HIDE from partners: Action Hub */}
            {!isPartner && <ActionHub companyId={company.id} />}

            {/* HIDE from partners: Team Structure */}
            {!isPartner && <TeamStructure companyId={company.id} />}

            {/* HIDE from partners: Individual responses */}
            {!isPartner && <IndividualResponses companyId={company.id} />}
        </div>
    );
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Partner registration validation
- [ ] Partner status validation in authentication
- [ ] Authorization middleware for partner routes
- [ ] Lead ownership validation
- [ ] Customer dashboard data filtering

### Integration Tests
- [ ] Partner self-registration → admin approval → login flow
- [ ] Create lead → update status → convert to customer flow
- [ ] Partner can access own customers only
- [ ] Partner admin can see all organization leads
- [ ] Partner user can only see own leads

### Security Tests
- [ ] Partner cannot access admin routes
- [ ] Partner cannot access other partners' leads
- [ ] Partner cannot see individual employee data
- [ ] Suspended partner cannot login
- [ ] Partner cannot modify other partners' data

### UI/UX Tests
- [ ] Navigation menu displays correctly for partners
- [ ] Sales portal loads without password prompt
- [ ] Opportunity dashboard filters work correctly
- [ ] Customer dashboard loads with correct data
- [ ] Mobile responsiveness for partner views

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run database migrations in staging environment
- [ ] Test partner registration flow end-to-end
- [ ] Verify existing admin/manager functionality not broken
- [ ] Test with sample partner accounts
- [ ] Review and test all API endpoints with Postman/Insomnia
- [ ] Load test with multiple concurrent partner users

### Deployment Steps
1. [ ] Backup production database
2. [ ] Run database migrations
3. [ ] Deploy backend API changes
4. [ ] Deploy frontend changes
5. [ ] Clear application cache
6. [ ] Test login with existing admin account (verify not broken)
7. [ ] Create test partner account and verify flow
8. [ ] Monitor error logs for first 24 hours

### Post-Deployment
- [ ] Create initial partner accounts for existing partners (if any)
- [ ] Send announcement to partners about new portal
- [ ] Monitor partner login activity
- [ ] Gather feedback from first partner users
- [ ] Create partner onboarding documentation

---

## Support & Documentation

### Partner Onboarding Documentation Needed
1. **Partner Welcome Guide**
   - How to login for first time
   - Overview of portal features
   - How to register leads
   - How to track opportunities
   - How to access customer dashboards

2. **Partner FAQ**
   - How do I reset my password?
   - How do I invite team members?
   - When do leads convert to customers?
   - How do I track my commissions? (future)
   - Who do I contact for support?

3. **Video Tutorials**
   - Portal overview (5 min)
   - Registering and managing leads (3 min)
   - Accessing customer dashboards (2 min)

---

## Success Metrics

### Phase 1 Success Criteria (MVP)
- [ ] 5 partners successfully register and get approved
- [ ] Partners can login without errors
- [ ] Partners can access sales portal
- [ ] Partners can register at least 10 leads total
- [ ] Zero critical bugs reported
- [ ] Page load time < 2 seconds

### Phase 2 Success Criteria (Core Features)
- [ ] Partners register average 5+ leads per week
- [ ] 80% of partners update lead status at least weekly
- [ ] Partners access customer dashboards successfully
- [ ] Partners report positive feedback on usability
- [ ] Zero data security incidents

### Long-term Success Metrics (Post-Launch)
- [ ] 50+ active partners using portal monthly
- [ ] 100+ leads registered per month
- [ ] 20%+ lead-to-customer conversion rate
- [ ] Partners log in at least 2x per week
- [ ] 90%+ partner satisfaction score

---

## Contact for Questions

**Development Team Contacts:**
- Technical Lead: [Name/Email]
- Product Manager: [Name/Email]
- UI/UX Designer: [Name/Email]

**Available Resources:**
- Existing code repository: [Git URL]
- API documentation: [Link]
- Design mockups: [Link]
- Database schema docs: [Link]

---

## Appendix: Existing Asset References

### A. Sales Portal Content Structure
Located at: `/sales-portal.html`

**Sections to preserve:**
- Platform overview
- Sales battle cards (3 scripts)
- Objection handlers
- Talking points
- CLOVER framework explanation
- Competitive advantages
- Pricing guidance
- Download center
- Partner resources

**Sections to remove:**
- Password protection modal
- Password check JavaScript

### B. Team Onboarding Guide Structure
Located at: `/team-onboarding.html`

**Navigation tabs:**
1. Overview (meeting timeline)
2. Preparation (checklist)
3. Meeting Structure (6 parts)
4. Follow-Up (post-meeting steps)
5. Checklist (printable)

**No modifications needed** - can be embedded/linked as-is

### C. Lead Registration Form Fields
Located at: `/partner-opportunities/register.html`

**Form fields to integrate:**
- Company Name (text, required)
- Contact Name (text, required)
- Contact Email (email, required)
- Contact Phone (tel, optional)
- Company Size (select: 50-100, 100-200, 200-500, 500+)
- Industry (select: dropdown)
- Pain Points (checkboxes: Burnout, Turnover, Low Engagement, Culture Issues, Other)
- Lead Source (select: Referral, Cold Outreach, Conference, Webinar, Other)
- Notes (textarea, optional)

### D. Opportunity Dashboard Components
Located at: `/partner-opportunities/dashboard.html`

**Components to integrate:**
1. Summary cards (total leads, by status, estimated value)
2. Status filter tabs
3. Opportunity cards (company info, status, actions)
4. Search and filter controls
5. Activity timeline (per opportunity)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-23
**Status:** Ready for Development
**Estimated Timeline:** 6 weeks (3 phases)
