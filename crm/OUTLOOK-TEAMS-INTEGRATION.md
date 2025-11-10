# Microsoft Outlook & Teams Integration Guide

## Overview

This guide explains how to integrate Microsoft Outlook email and Teams calendar with the Clover ERA CRM system using Microsoft Graph API.

---

## Integration Approach: Three-Phase Implementation

### Phase 1: Quick Wins (1-2 hours) - START HERE
Simple features that provide immediate value without complex OAuth setup.

### Phase 2: Read-Only Integration (1 week)
OAuth authentication to read emails and calendar events.

### Phase 3: Full Two-Way Sync (2-3 weeks)
Complete integration with automatic syncing and Teams meeting creation.

---

## Phase 1: Quick Wins (No OAuth Required)

### What You Get:
- Create Teams meeting links from opportunities
- Log emails manually with one click
- Generate .ics calendar files for Outlook import
- Email templates for common scenarios

### Implementation:

**1. Schedule Teams Meeting Button**
Add to opportunity.html to generate Teams meeting invite:

```javascript
function createTeamsMeetingInvite() {
    const opp = currentOpportunity;
    const company = opp.companies;
    const contact = opp.contacts;

    // Generate .ics file content
    const meetingDate = new Date();
    meetingDate.setDate(meetingDate.getDate() + 7); // Default to next week

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Clover ERA//CRM//EN
BEGIN:VEVENT
UID:${opp.id}@cloverera.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(meetingDate)}
DTEND:${formatICSDate(new Date(meetingDate.getTime() + 60*60*1000))}
SUMMARY:Demo - ${opp.title}
DESCRIPTION:Demo for ${company.name}\\n\\nOpportunity: ${opp.title}\\nValue: $${opp.acv?.toLocaleString()}
LOCATION:Microsoft Teams Meeting
ORGANIZER:mailto:${currentUser.email}
ATTENDEE:mailto:${contact.email}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    // Download .ics file
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo-${company.name.replace(/\s+/g, '-')}.ics`;
    a.click();

    // Log activity in CRM
    await supabase.from('activities').insert([{
        opportunity_id: opp.id,
        company_id: opp.company_id,
        type: 'meeting',
        subject: `Demo scheduled with ${company.name}`,
        description: `Teams meeting invite sent to ${contact.first_name} ${contact.last_name}`,
        due_date: meetingDate.toISOString(),
        owner_id: currentUser.id,
        completed: false
    }]);
}

function formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
```

**2. Log Email Button**
Quick way to manually log Outlook emails:

```javascript
function showLogEmailModal() {
    // Modal with fields: Subject, Date, Participants, Summary
    // Saves as activity type 'email'
}

async function logEmail(emailData) {
    await supabase.from('activities').insert([{
        opportunity_id: currentOpportunity.id,
        company_id: currentOpportunity.company_id,
        type: 'email',
        subject: emailData.subject,
        description: emailData.summary,
        due_date: emailData.date,
        owner_id: currentUser.id,
        completed: true
    }]);
}
```

**3. Email Templates**
Pre-written email templates accessible from CRM:

```javascript
function generateDemoEmail() {
    const opp = currentOpportunity;
    const contact = opp.contacts;

    const template = `Subject: Demo Invitation - Clover ERA Manager Enablement

Hi ${contact.first_name},

Thank you for your interest in Clover ERA's manager enablement platform.

I'd like to schedule a 30-minute demo to show you how we help organizations identify struggling managers before they cause turnover and performance issues.

Key topics we'll cover:
- Early warning system for manager performance issues
- Anonymous feedback that managers actually want to hear
- Coaching pathways proven to improve retention

Does [DATE/TIME] work for your calendar?

Best regards,
${currentUser.full_name}
Clover ERA

---
This email was generated from CRM Opportunity: ${opp.title}`;

    // Copy to clipboard
    navigator.clipboard.writeText(template);
    alert('Email template copied to clipboard! Paste into Outlook.');
}
```

### Estimated Time: 2 hours
### Cost: $0 (no API usage)

---

## Phase 2: Read-Only Integration (OAuth Required)

### What You Get:
- Automatically sync Outlook emails to CRM
- Import calendar events as activities
- See recent emails related to opportunities
- Auto-detect meeting follow-ups

### Prerequisites:

**1. Microsoft 365 Developer Account**
- Sign up: https://developer.microsoft.com/microsoft-365/dev-program
- Free developer tenant with sample data

**2. Azure App Registration**
Steps:
1. Go to https://portal.azure.com
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: "Clover ERA CRM"
5. Supported account types: "Accounts in this organizational directory only"
6. Redirect URI:
   - Type: "Single-page application (SPA)"
   - URI: `https://cloverera.com/crm/auth-callback.html`
7. Click "Register"

**3. Configure API Permissions**
In your app registration:
1. Click "API permissions" → "Add a permission"
2. Select "Microsoft Graph" → "Delegated permissions"
3. Add these permissions:
   - `Mail.Read` - Read user mail
   - `Calendars.Read` - Read user calendars
   - `User.Read` - Sign in and read user profile
4. Click "Grant admin consent" (if you're admin)

**4. Get Credentials**
From "Overview" page, note:
- Application (client) ID: `abc123...`
- Directory (tenant) ID: `def456...`

### Implementation:

**1. Install Microsoft Graph SDK**
Add to your HTML pages:

```html
<script src="https://cdn.jsdelivr.net/npm/@microsoft/microsoft-graph-client@3.0.7/lib/graph-js-sdk.min.js"></script>
<script src="https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js"></script>
```

**2. Authentication Setup**
Create `crm/auth-microsoft.js`:

```javascript
// Microsoft Graph configuration
const msalConfig = {
    auth: {
        clientId: 'YOUR_CLIENT_ID_HERE', // From Azure app registration
        authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID_HERE',
        redirectUri: 'https://cloverera.com/crm/auth-callback.html'
    },
    cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

// Login with Microsoft
async function loginWithMicrosoft() {
    const loginRequest = {
        scopes: ['User.Read', 'Mail.Read', 'Calendars.Read']
    };

    try {
        const response = await msalInstance.loginPopup(loginRequest);
        console.log('Microsoft login successful:', response);

        // Store token in Supabase profile
        await supabase.from('profiles').update({
            microsoft_access_token: response.accessToken,
            microsoft_refresh_token: response.account.idToken
        }).eq('id', currentUser.id);

        return response.accessToken;
    } catch (error) {
        console.error('Microsoft login failed:', error);
        throw error;
    }
}

// Get stored access token
async function getMicrosoftToken() {
    const account = msalInstance.getAllAccounts()[0];
    if (!account) {
        throw new Error('No Microsoft account found. Please login.');
    }

    const silentRequest = {
        scopes: ['User.Read', 'Mail.Read', 'Calendars.Read'],
        account: account
    };

    try {
        const response = await msalInstance.acquireTokenSilent(silentRequest);
        return response.accessToken;
    } catch (error) {
        // Token expired, need to re-login
        return await loginWithMicrosoft();
    }
}
```

**3. Fetch Outlook Emails**
Create `crm/outlook-integration.js`:

```javascript
// Initialize Graph client
function getGraphClient(accessToken) {
    return MicrosoftGraph.Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
}

// Fetch recent emails related to contact
async function fetchEmailsForContact(contactEmail) {
    try {
        const token = await getMicrosoftToken();
        const client = getGraphClient(token);

        // Search emails to/from contact
        const messages = await client
            .api('/me/messages')
            .filter(`from/emailAddress/address eq '${contactEmail}' or toRecipients/any(r:r/emailAddress/address eq '${contactEmail}')`)
            .select('subject,receivedDateTime,from,toRecipients,bodyPreview')
            .top(20)
            .orderby('receivedDateTime desc')
            .get();

        return messages.value;
    } catch (error) {
        console.error('Error fetching emails:', error);
        return [];
    }
}

// Sync emails to CRM activities
async function syncEmailsToCRM(opportunityId, contactEmail) {
    const emails = await fetchEmailsForContact(contactEmail);

    for (const email of emails) {
        // Check if already logged
        const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('opportunity_id', opportunityId)
            .eq('type', 'email')
            .eq('subject', email.subject)
            .eq('due_date', email.receivedDateTime)
            .single();

        if (existing) continue; // Already logged

        // Create activity
        await supabase.from('activities').insert([{
            opportunity_id: opportunityId,
            company_id: currentOpportunity.company_id,
            type: 'email',
            subject: email.subject,
            description: email.bodyPreview,
            due_date: email.receivedDateTime,
            owner_id: currentUser.id,
            completed: true
        }]);
    }

    console.log(`Synced ${emails.length} emails for opportunity ${opportunityId}`);
}
```

**4. Fetch Calendar Events**
Add to `crm/outlook-integration.js`:

```javascript
// Fetch calendar events
async function fetchCalendarEvents(startDate, endDate) {
    try {
        const token = await getMicrosoftToken();
        const client = getGraphClient(token);

        const events = await client
            .api('/me/calendarView')
            .query({
                startDateTime: startDate.toISOString(),
                endDateTime: endDate.toISOString()
            })
            .select('subject,start,end,attendees,bodyPreview,onlineMeeting')
            .orderby('start/dateTime')
            .get();

        return events.value;
    } catch (error) {
        console.error('Error fetching calendar:', error);
        return [];
    }
}

// Sync meetings to CRM
async function syncMeetingsToCRM(contactEmail) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    const endDate = new Date();

    const events = await fetchCalendarEvents(startDate, endDate);

    // Filter events with this contact
    const relevantEvents = events.filter(event =>
        event.attendees.some(att => att.emailAddress.address === contactEmail)
    );

    for (const event of relevantEvents) {
        // Find opportunity for this contact
        const { data: opportunities } = await supabase
            .from('opportunities')
            .select('id, company_id')
            .eq('contact_id', contactId);

        if (!opportunities || opportunities.length === 0) continue;

        const opp = opportunities[0]; // Use first opportunity

        // Check if already logged
        const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('opportunity_id', opp.id)
            .eq('type', 'meeting')
            .eq('subject', event.subject)
            .eq('due_date', event.start.dateTime)
            .single();

        if (existing) continue;

        // Create meeting activity
        await supabase.from('activities').insert([{
            opportunity_id: opp.id,
            company_id: opp.company_id,
            type: 'meeting',
            subject: event.subject,
            description: event.bodyPreview || 'Teams meeting',
            due_date: event.start.dateTime,
            owner_id: currentUser.id,
            completed: true
        }]);
    }

    console.log(`Synced ${relevantEvents.length} meetings`);
}
```

**5. Add UI Elements**
In `opportunity.html`, add:

```html
<!-- Microsoft Integration Section -->
<div class="section">
    <h2 class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
        <span>Microsoft Integration</span>
        <button class="btn" onclick="connectMicrosoft()" id="msConnectBtn">
            Connect Outlook
        </button>
    </h2>

    <div id="msIntegrationContent" style="display: none;">
        <button class="btn" onclick="syncEmailsForThisOpp()">
            Sync Emails
        </button>
        <button class="btn" onclick="syncMeetingsForThisOpp()">
            Sync Calendar
        </button>

        <div id="recentEmails" style="margin-top: 1rem;">
            <!-- Recent emails will appear here -->
        </div>
    </div>
</div>

<script>
async function connectMicrosoft() {
    try {
        await loginWithMicrosoft();
        document.getElementById('msConnectBtn').textContent = 'Connected';
        document.getElementById('msConnectBtn').style.background = 'var(--success-green)';
        document.getElementById('msIntegrationContent').style.display = 'block';
    } catch (error) {
        alert('Failed to connect Microsoft account: ' + error.message);
    }
}

async function syncEmailsForThisOpp() {
    const contact = currentOpportunity.contacts;
    if (!contact || !contact.email) {
        alert('No contact email found for this opportunity.');
        return;
    }

    await syncEmailsToCRM(currentOpportunity.id, contact.email);
    await loadActivities(); // Refresh activity timeline
    alert('Emails synced successfully!');
}

async function syncMeetingsForThisOpp() {
    const contact = currentOpportunity.contacts;
    if (!contact || !contact.email) {
        alert('No contact email found for this opportunity.');
        return;
    }

    await syncMeetingsToCRM(contact.email);
    await loadActivities(); // Refresh activity timeline
    alert('Meetings synced successfully!');
}
</script>
```

**6. Update Database Schema**
Add Microsoft token storage to profiles table:

```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.profiles
ADD COLUMN microsoft_access_token TEXT,
ADD COLUMN microsoft_refresh_token TEXT,
ADD COLUMN microsoft_connected_at TIMESTAMPTZ;
```

### Estimated Time: 1 week (including testing)
### Cost: $0 (Microsoft Graph API is free for standard usage)

---

## Phase 3: Full Two-Way Sync (Advanced)

### What You Get:
- Automatically create Teams meetings from CRM
- Two-way sync: CRM → Outlook calendar
- Send emails directly from CRM
- Automatic activity logging (no manual sync needed)
- Webhook-based real-time updates

### Implementation:

**1. Additional API Permissions**
Add to Azure app registration:
- `Mail.Send` - Send emails as user
- `Calendars.ReadWrite` - Create calendar events
- `OnlineMeetings.ReadWrite` - Create Teams meetings

**2. Create Teams Meeting from CRM**

```javascript
async function createTeamsMeeting(opportunityId, meetingDetails) {
    const token = await getMicrosoftToken();
    const client = getGraphClient(token);

    // Create Teams meeting
    const meeting = await client
        .api('/me/onlineMeetings')
        .post({
            startDateTime: meetingDetails.startTime,
            endDateTime: meetingDetails.endTime,
            subject: meetingDetails.subject
        });

    // Create calendar event with Teams link
    const event = await client
        .api('/me/events')
        .post({
            subject: meetingDetails.subject,
            start: {
                dateTime: meetingDetails.startTime,
                timeZone: 'UTC'
            },
            end: {
                dateTime: meetingDetails.endTime,
                timeZone: 'UTC'
            },
            attendees: meetingDetails.attendees.map(email => ({
                emailAddress: { address: email },
                type: 'required'
            })),
            body: {
                contentType: 'HTML',
                content: `<p>${meetingDetails.description}</p><br><p><a href="${meeting.joinUrl}">Join Teams Meeting</a></p>`
            },
            location: {
                displayName: 'Microsoft Teams Meeting'
            },
            isOnlineMeeting: true,
            onlineMeetingProvider: 'teamsForBusiness'
        });

    // Log in CRM
    await supabase.from('activities').insert([{
        opportunity_id: opportunityId,
        company_id: currentOpportunity.company_id,
        type: 'meeting',
        subject: meetingDetails.subject,
        description: `Teams meeting: ${meeting.joinUrl}`,
        due_date: meetingDetails.startTime,
        owner_id: currentUser.id,
        completed: false
    }]);

    return { meeting, event };
}
```

**3. Send Email from CRM**

```javascript
async function sendEmailFromCRM(to, subject, body) {
    const token = await getMicrosoftToken();
    const client = getGraphClient(token);

    const message = {
        message: {
            subject: subject,
            body: {
                contentType: 'HTML',
                content: body
            },
            toRecipients: [{
                emailAddress: { address: to }
            }]
        }
    };

    await client.api('/me/sendMail').post(message);

    // Log in CRM
    await supabase.from('activities').insert([{
        opportunity_id: currentOpportunity.id,
        company_id: currentOpportunity.company_id,
        type: 'email',
        subject: subject,
        description: body,
        due_date: new Date().toISOString(),
        owner_id: currentUser.id,
        completed: true
    }]);
}
```

**4. Automatic Sync with Webhooks**
Use Supabase Edge Functions to handle Microsoft Graph webhooks:

```javascript
// Supabase Edge Function: sync-outlook-webhook
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL'),
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    // Microsoft sends validation token on subscription
    if (req.method === 'POST' && req.headers.get('validationToken')) {
        return new Response(req.headers.get('validationToken'), {
            headers: { 'Content-Type': 'text/plain' }
        })
    }

    // Handle notification
    const notification = await req.json()

    // Process email/calendar change
    // Sync to CRM activities table

    return new Response('OK', { status: 200 })
})
```

**5. Subscribe to Outlook Changes**

```javascript
async function subscribeToOutlookChanges() {
    const token = await getMicrosoftToken();
    const client = getGraphClient(token);

    // Subscribe to email changes
    await client.api('/subscriptions').post({
        changeType: 'created',
        notificationUrl: 'https://YOUR_PROJECT.supabase.co/functions/v1/sync-outlook-webhook',
        resource: '/me/messages',
        expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        clientState: 'secretClientState'
    });

    // Subscribe to calendar changes
    await client.api('/subscriptions').post({
        changeType: 'created,updated',
        notificationUrl: 'https://YOUR_PROJECT.supabase.co/functions/v1/sync-outlook-webhook',
        resource: '/me/events',
        expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        clientState: 'secretClientState'
    });
}
```

### Estimated Time: 2-3 weeks
### Cost: $0 (Graph API free tier sufficient)

---

## Security Best Practices

### 1. Token Storage
**Current approach (OK for MVP):**
- Store tokens in Supabase profiles table
- Encrypted at rest by Supabase

**Production approach:**
- Use Supabase Vault for token encryption
- Rotate refresh tokens regularly
- Implement token expiry checks

### 2. API Permissions
**Principle of least privilege:**
- Only request permissions you actually use
- Start with read-only (Phase 2)
- Add write permissions as needed (Phase 3)

### 3. Error Handling
```javascript
async function safeGraphCall(apiCall) {
    try {
        return await apiCall();
    } catch (error) {
        if (error.statusCode === 401) {
            // Token expired, re-authenticate
            await loginWithMicrosoft();
            return await apiCall();
        } else if (error.statusCode === 403) {
            // Permission denied
            throw new Error('Missing required permission. Please reconnect Microsoft account.');
        } else {
            throw error;
        }
    }
}
```

---

## Testing Checklist

### Phase 1:
- [ ] Download .ics file and import to Outlook
- [ ] Verify meeting appears in Teams calendar
- [ ] Log email manually and see in activity timeline
- [ ] Copy email template to clipboard

### Phase 2:
- [ ] Login with Microsoft account
- [ ] Fetch emails for a contact
- [ ] Sync emails to CRM activities
- [ ] Fetch calendar events
- [ ] Sync meetings to CRM activities
- [ ] Token refresh after expiry

### Phase 3:
- [ ] Create Teams meeting from CRM
- [ ] Meeting appears in Outlook calendar
- [ ] Teams join link works
- [ ] Send email from CRM
- [ ] Email appears in Outlook Sent folder
- [ ] Automatic sync via webhooks

---

## Cost Estimate

| Phase | Setup Time | Development Time | Monthly Cost |
|-------|------------|------------------|--------------|
| Phase 1 | 30 min | 2 hours | $0 |
| Phase 2 | 2 hours | 1 week | $0 |
| Phase 3 | 4 hours | 2-3 weeks | $0 |

**Microsoft Graph API Limits (Free):**
- 10,000 requests per 10 minutes per app
- Way more than needed for small sales team

**When to pay:**
- Never, unless you exceed 10K requests/10min
- Typical CRM usage: ~100 requests/day

---

## Recommended Approach

### Week 1: Start with Phase 1
Implement quick wins:
1. Add "Schedule Demo" button that downloads .ics file
2. Add "Log Email" modal for manual logging
3. Add email templates for common scenarios
4. Test with real opportunities

**Deliverable:** Sales team can schedule Teams meetings and log emails in ~15 seconds

### Week 2-3: Add Phase 2 (if needed)
Only if manual logging becomes tedious:
1. Set up Azure app registration
2. Implement OAuth login
3. Add "Sync Emails" and "Sync Calendar" buttons
4. Test with your Microsoft account

**Deliverable:** One-click sync of Outlook emails and calendar to CRM

### Week 4+: Consider Phase 3 (future)
Only if you want fully automated sync:
1. Add Teams meeting creation from CRM
2. Add email sending from CRM
3. Set up webhooks for automatic sync
4. Implement full two-way sync

**Deliverable:** Complete Outlook/Teams integration

---

## Next Steps

**Immediate:**
1. Decide which phase to start with (recommend Phase 1)
2. I'll implement the chosen features
3. Test with real opportunities

**Questions to answer:**
- Do you have admin access to Azure for Phase 2/3?
- What's your Microsoft 365 subscription tier?
- Do you want me to start with Phase 1 quick wins?

---

## Support Resources

- **Microsoft Graph Explorer:** https://developer.microsoft.com/graph/graph-explorer
  Test API calls without writing code

- **Microsoft Graph Documentation:** https://learn.microsoft.com/graph
  Complete API reference

- **Azure Portal:** https://portal.azure.com
  Manage app registrations

- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
  Deploy webhook handlers
