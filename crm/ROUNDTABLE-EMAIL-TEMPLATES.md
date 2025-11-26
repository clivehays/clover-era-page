# Roundtable Email Templates & Automation Guide

This document contains all email templates for the Retention Reality Roundtable system, organized by trigger type.

## Email Automation Options

You can implement these emails using:

1. **Supabase Edge Functions** (Recommended - free tier available)
2. **ConvertKit** (Paid - $29/mo, robust automation)
3. **ActiveCampaign** (Paid - $29/mo+, advanced automation)
4. **Make.com / Zapier** (Paid - connects Supabase to email service)
5. **Custom Node.js Script** (Free - run via cron job)

---

## 1. APPLICATION SUBMITTED - Immediate Auto-Response

**Trigger:** Application submitted to database
**Timing:** Immediately after form submission
**To:** Applicant email

**Subject:**
```
Application received - Retention Reality Roundtable
```

**Body:**
```
[Name] -

Got your application. I review these personally, so give me 48 hours.

You'll hear back either way.

Clive
```

**Implementation Notes:**
- Use applicant's first name from `full_name` field
- Send from: clive@cloverera.com
- Reply-to: clive@cloverera.com

---

## 2. APPLICATION ACCEPTED

**Trigger:** Status changed to 'accepted' in database
**Timing:** When admin accepts application
**To:** Applicant email

**Subject:**
```
You're in: Retention Reality Roundtable [Date]
```

**Body:**
```
[Name] -

You're confirmed for the Retention Reality Roundtable on [Date] at [Time] [Timezone].

Three things to know:

1. This is a conversation, not a presentation. Come ready to share what's actually happening on your team.

2. Chatham House rules apply. Share what you learn, never who said it.

3. There are 9 other managers in this cohort. Different companies, similar challenges. That's the point.

Calendar invite is attached. Join link is in the invite.

See you there.

Clive
```

**Attachments:**
- Calendar invite (.ics file) with:
  - Event title: "Retention Reality Roundtable"
  - Date/time from cohort record
  - Zoom link from cohort record
  - Duration: 60 minutes
  - Description: Brief overview + Chatham House rules reminder

**Implementation Notes:**
- Pull date, time, timezone, zoom_link from `roundtable_cohorts` table
- Format date as: "Tuesday, March 15, 2025"
- Generate .ics file dynamically
- Track email sent in `emails_sent` JSONB field

---

## 3. APPLICATION WAITLISTED

**Trigger:** Status changed to 'waitlisted' in database
**Timing:** When admin waitlists application
**To:** Applicant email

**Subject:**
```
Roundtable update - you're on the list
```

**Body:**
```
[Name] -

Thanks for applying. This cohort filled up, but you're on the list for the next one.

I run these quarterly. You'll get first notice when the next date is set.

If timing is urgent and you want to talk about what's happening on your team sooner, reply to this email.

Clive
```

**Implementation Notes:**
- Track email sent in `emails_sent` JSONB field
- Add note in database to notify for next cohort

---

## 4. APPLICATION DECLINED

**Trigger:** Status changed to 'declined' in database
**Timing:** When admin declines application
**To:** Applicant email

**Subject:**
```
Roundtable application - not the right fit
```

**Body:**
```
[Name] -

Thanks for applying to the Retention Reality Roundtable.

This particular program is designed for managers at mid-size tech companies, and based on your application it's not the right fit.

If your situation changes or I've misjudged the fit, reply and let me know.

Clive
```

**Implementation Notes:**
- Track email sent in `emails_sent` JSONB field
- Be gentle - some may become prospects later

---

## 5. REMINDER - 2 Days Before Event

**Trigger:** 2 days before cohort date
**Timing:** Scheduled automation (run daily, check dates)
**To:** All accepted attendees for cohort

**Subject:**
```
[Day]: One question to think about
```

**Body:**
```
[Name] -

Quick reminder: Roundtable is [Day] at [Time] [Timezone].

One question to think about before we meet:

"When's the last time someone on your team gave notice and you genuinely didn't see it coming?"

If the answer is "recently," you're not alone. That's what we're talking about.

Zoom link: [Link]

See you [Day].

Clive
```

**Implementation Notes:**
- Day should be formatted as: "Thursday" or "tomorrow"
- Pull zoom link from cohort record
- Only send to applications with status = 'accepted' for that cohort_id
- Track email sent in `emails_sent` JSONB field

---

## 6. FINAL REMINDER - 1 Hour Before Event

**Trigger:** 1 hour before cohort start time
**Timing:** Scheduled automation
**To:** All accepted attendees for cohort

**Subject:**
```
Starting in 1 hour
```

**Body:**
```
[Name] -

Roundtable starts in an hour.

Zoom link: [Link]

See you soon.

Clive
```

**Implementation Notes:**
- Calculate 1 hour before based on cohort date + time + timezone
- Pull zoom link from cohort record
- Only send to applications with status = 'accepted' for that cohort_id
- Track email sent in `emails_sent` JSONB field

---

## 7. POST-EVENT - Recording & Framework

**Trigger:** 2 hours after cohort end time
**Timing:** Scheduled automation
**To:** All who attended (attended = true)

**Subject:**
```
Roundtable recording + one framework
```

**Body:**
```
[Name] -

Thanks for showing up today and being real about what's happening on your team. That's rare.

Two things:

1. Recording is here: [Link] (for your eyes only, Chatham House applies)

2. The framework we discussed: [Link to PDF or attached]

One question I'm thinking about after today's conversation:

If your CEO heard what you shared in that room, what would change?

If the answer is "something would actually change," I'm happy to have that conversation with them directly. Just reply and I'll reach out.

Either way, glad you were there.

Clive
```

**Implementation Notes:**
- Only send to applications where `attended = true`
- Pull recording_link and framework_pdf_link from cohort record
- Track email sent in `emails_sent` JSONB field
- This is the first conversion touchpoint

---

## 8. HIGH-INTENT FOLLOW-UP - 3 Days After Event

**Trigger:** 3 days after cohort date
**Timing:** Scheduled automation
**To:** High-intent attendees only

**Conditions to send:**
- `intent_tag = 'high'` OR
- `ceo_intro_openness = 'Yes, I''d want them to hear this'` OR
- `spoke_count >= 2`

**Subject:**
```
Following up from [Day]
```

**Body:**
```
[Name] -

Wanted to follow up on something you mentioned in the roundtable about [PERSONALIZATION REQUIRED - leave placeholder].

That pattern you described is exactly what I help CEOs see before it turns into a resignation letter.

You mentioned you'd be open to introducing this to your leadership. Here's what that could look like:

I'd run a 15-minute Turnover Analysis for [Company], showing what turnover is likely costing annually and where the risk is concentrated. No pitch, just the math.

If that's useful, I can send you a short email you could forward to your CEO, or I can reach out directly and mention you flagged this as worth looking at.

What works better for you?

Clive
```

**Implementation Notes:**
- **IMPORTANT:** This email requires manual personalization before sending
- System should create draft and flag for Clive to review/edit
- [PERSONALIZATION REQUIRED] section must reference specific challenge they mentioned
- Pull company name from application record
- Track email sent in `emails_sent` JSONB field
- Track replies in `replied` field

---

## 9. MEDIUM-INTENT FOLLOW-UP - 3 Days After Event

**Trigger:** 3 days after cohort date
**Timing:** Scheduled automation
**To:** Medium-intent attendees

**Conditions to send:**
- `intent_tag = 'medium'` OR
- (`ceo_intro_openness = 'Maybe, depends on what I learn'` AND `intent_tag != 'high'`)

**Subject:**
```
One thing from [Day]
```

**Body:**
```
[Name] -

Thanks again for [Day]. Wanted to follow up on something you mentioned about [PERSONALIZATION REQUIRED].

That pattern shows up constantly. Most managers see it, most leadership doesn't hear about it until the resignation letter lands.

If this is something your company is struggling with, I'm happy to have a broader conversation about what other organizations are doing. No pitch, just perspective.

Either way, let me know if the roundtable was useful. Always trying to make these better.

Clive
```

**Implementation Notes:**
- **IMPORTANT:** Requires manual personalization
- System should create draft and flag for Clive to review/edit
- Less pushy than high-intent email
- Track email sent in `emails_sent` JSONB field

---

## 10. LOW-INTENT FOLLOW-UP - 3 Days After Event

**Trigger:** 3 days after cohort date
**Timing:** Scheduled automation
**To:** Low-intent attendees

**Conditions to send:**
- `intent_tag = 'low'` OR
- `ceo_intro_openness IN ('No, I''m here for my own development', 'My CEO would never go for this')` AND `intent_tag NOT IN ('high', 'medium')`

**Subject:**
```
Roundtable feedback
```

**Body:**
```
[Name] -

Thanks for joining [Day]. Hope it was useful.

Quick question: What would have made it more valuable for you?

Trying to improve these for future cohorts. Any feedback helps.

Clive
```

**Implementation Notes:**
- Simple feedback request
- No sales angle
- Track email sent in `emails_sent` JSONB field
- Track replies for product feedback

---

## 11. CONTENT FOLLOW-UP - 7 Days After Event

**Trigger:** 7 days after cohort date
**Timing:** Scheduled automation
**To:** All attendees

**Subject:**
```
This landed in my feed and thought of our conversation
```

**Body:**
```
[Name] -

Saw this post this week and thought of what we discussed in the roundtable: [LINK TO RECENT LINKEDIN POST]

The comments are worth reading. Lots of managers sharing similar patterns.

If anything shifted for you since our conversation, I'd like to hear about it.

Clive
```

**Implementation Notes:**
- **IMPORTANT:** Link must be updated weekly with recent relevant content
- Can be automated if you have a system to pull latest LinkedIn post
- Otherwise, send manually or create draft for Clive to add link
- Track email sent in `emails_sent` JSONB field

---

## 12. FINAL NUDGE - 14 Days After Event (High-Intent Only)

**Trigger:** 14 days after cohort date
**Timing:** Scheduled automation
**To:** High-intent attendees who haven't replied

**Conditions to send:**
- `intent_tag = 'high'`
- `replied = false`
- 14 days since cohort date

**Subject:**
```
Closing the loop
```

**Body:**
```
[Name] -

Wanted to check back on the CEO conversation we discussed.

If the timing isn't right, no problem. But if you're still thinking about it and want help positioning it internally, I've got a short summary doc that explains what a Turnover Analysis shows and why it matters. Easy to forward.

Just reply "send it" and I'll share.

Either way, glad you were part of the roundtable.

Clive
```

**Implementation Notes:**
- Final touchpoint for high-intent leads
- Very soft close
- Track email sent in `emails_sent` JSONB field
- If reply = "send it", mark `replied = true` and send summary doc

---

## Email Sending Configuration

### Using Supabase Edge Functions (Recommended)

1. Install Supabase CLI
2. Create Edge Function:
   ```bash
   supabase functions new send-roundtable-email
   ```

3. Use Resend, SendGrid, or Postmark for email delivery

4. Set up database triggers:
   ```sql
   -- Trigger on status change
   CREATE OR REPLACE FUNCTION notify_status_change()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.status != OLD.status THEN
       PERFORM net.http_post(
         url := 'YOUR_EDGE_FUNCTION_URL',
         body := json_build_object(
           'type', 'status_change',
           'application_id', NEW.id,
           'status', NEW.status
         )::text
       );
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

### Using Make.com / Zapier

1. **Trigger:** Watch for new rows in `roundtable_applications`
2. **Action:** Send email based on status
3. **Update:** Write back to `emails_sent` field

### Using ConvertKit

1. Create subscriber on application submission
2. Add tags based on status: `roundtable-pending`, `roundtable-accepted`, etc.
3. Create automated sequences for each tag
4. Manual personalization required for high/medium intent emails

### Scheduled Email Automation

Create a cron job or scheduled function that runs daily:

```javascript
// Pseudo-code for scheduled emails
async function sendScheduledEmails() {
  const today = new Date();

  // Get cohorts happening in 2 days
  const upcomingCohorts = await supabase
    .from('roundtable_cohorts')
    .select('*')
    .eq('status', 'upcoming')
    .eq('date', addDays(today, 2));

  // Get accepted applications for those cohorts
  for (const cohort of upcomingCohorts) {
    const applications = await supabase
      .from('roundtable_applications')
      .select('*')
      .eq('cohort_id', cohort.id)
      .eq('status', 'accepted');

    // Send 2-day reminder to each
    for (const app of applications) {
      await sendEmail({
        to: app.email,
        template: 'reminder-2-days',
        data: { ...app, ...cohort }
      });
    }
  }

  // Similar logic for:
  // - 1 hour before
  // - 2 hours after (post-event)
  // - 3 days after (follow-ups)
  // - 7 days after (content)
  // - 14 days after (final nudge)
}
```

---

## Email Tracking

All emails should be tracked in the `emails_sent` JSONB field:

```json
[
  {
    "type": "application_received",
    "sent_at": "2025-03-15T10:30:00Z"
  },
  {
    "type": "accepted",
    "sent_at": "2025-03-16T14:20:00Z"
  },
  {
    "type": "reminder_2_days",
    "sent_at": "2025-03-28T09:00:00Z"
  }
]
```

### Append to JSONB field:

```sql
UPDATE roundtable_applications
SET emails_sent = emails_sent || jsonb_build_array(
  jsonb_build_object(
    'type', 'accepted',
    'sent_at', now()
  )
)
WHERE id = '[application_id]';
```

---

## Anti-LLM Writing Checklist

Before sending any email, verify it passes these checks:

- [ ] No "curious" or "just curious"
- [ ] No "I'd love to" or "happy to help"
- [ ] No "feel free" or "don't hesitate"
- [ ] No "truly" / "deeply" / "incredibly"
- [ ] No em dashes (—)
- [ ] No choppy 3-word sentences
- [ ] No tidy conclusions or inspirational wrap-ups
- [ ] Reads naturally when spoken aloud
- [ ] Peer-to-peer tone, not salesy
- [ ] Direct and specific

---

## Next Steps

1. Choose email automation platform
2. Set up email sending credentials
3. Implement database triggers or webhooks
4. Test each email template with real data
5. Create manual review process for personalized emails
6. Set up monitoring for email delivery and opens

**Questions?** Review with Clive before going live.
