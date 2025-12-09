import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Admin email for notifications
const ADMIN_EMAIL = 'clive.hays@cloverera.com';

serve(async (req) => {
  try {
    const body = await req.json();
    const { type, application_id, cohort_id, status } = body;
    console.log('Received request:', { type, application_id, cohort_id });

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Handle scheduled email check (called by cron)
    if (type === 'check_scheduled_emails') {
      return await handleScheduledEmails(supabase);
    }

    // Get application data
    const { data: app, error: appError } = await supabase
      .from('roundtable_applications')
      .select('*')
      .eq('id', application_id)
      .single();

    console.log('Application query result:', { app, appError });

    if (appError) {
      console.error('Application query error:', appError);
      throw new Error(`Database error: ${appError.message}`);
    }

    if (!app) {
      throw new Error('Application not found - no data returned');
    }

    // Get cohort data separately if needed
    let cohort = null;
    const cohortIdToFetch = cohort_id || app.cohort_id;
    if (cohortIdToFetch) {
      const { data: cohortData, error: cohortError } = await supabase
        .from('roundtable_cohorts')
        .select('*')
        .eq('id', cohortIdToFetch)
        .single();

      if (!cohortError && cohortData) {
        cohort = cohortData;
      }
    }

    console.log('Cohort data:', cohort);

    // Determine email type if status changed
    let emailType = type;
    if (type === 'status_changed' && status) {
      emailType = status;
    }

    // Get email template based on type
    const emailTemplate = getEmailTemplate(emailType, app, cohort);

    console.log('Sending email:', { to: app.email, subject: emailTemplate.subject });

    // Send email to applicant via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Clive Hays <clive.hays@cloverera.com>',
        to: app.email,
        subject: emailTemplate.subject,
        text: emailTemplate.body,
        reply_to: 'clive.hays@cloverera.com',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const emailResult = await response.json();
    console.log('Email sent successfully:', emailResult);

    // Send admin notification for new applications
    if (emailType === 'application_received') {
      const adminTemplate = getAdminNotificationTemplate(app, cohort);

      console.log('Sending admin notification to:', ADMIN_EMAIL);

      const adminResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Roundtable System <clive.hays@cloverera.com>',
          to: ADMIN_EMAIL,
          subject: adminTemplate.subject,
          text: adminTemplate.body,
          reply_to: app.email,
        }),
      });

      if (!adminResponse.ok) {
        const adminErrorText = await adminResponse.text();
        console.error('Admin notification error:', adminErrorText);
        // Don't throw - admin notification failure shouldn't break the flow
      } else {
        const adminResult = await adminResponse.json();
        console.log('Admin notification sent:', adminResult);
      }
    }

    // Track email sent in database
    const currentEmails = app.emails_sent || [];
    const updatedEmails = [
      ...currentEmails,
      {
        type: emailType,
        sent_at: new Date().toISOString(),
        email_id: emailResult.id,
      },
    ];

    await supabase
      .from('roundtable_applications')
      .update({ emails_sent: updatedEmails })
      .eq('id', application_id);

    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailResult.id,
        type: emailType,
        to: app.email,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Email function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Handle scheduled emails (48h reminder, 6h reminder, 30min follow-up)
async function handleScheduledEmails(supabase: any) {
  const now = new Date();
  const results: any[] = [];

  // Get all upcoming cohorts
  const { data: cohorts, error: cohortsError } = await supabase
    .from('roundtable_cohorts')
    .select('*')
    .in('status', ['upcoming', 'completed']);

  if (cohortsError) {
    console.error('Error fetching cohorts:', cohortsError);
    return new Response(
      JSON.stringify({ success: false, error: cohortsError.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  for (const cohort of cohorts || []) {
    // Calculate cohort datetime
    const cohortDate = new Date(`${cohort.date}T${cohort.time}`);
    const cohortEndTime = new Date(cohortDate.getTime() + 60 * 60 * 1000); // 1 hour after start

    const hoursUntilSession = (cohortDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const minutesSinceEnd = (now.getTime() - cohortEndTime.getTime()) / (1000 * 60);

    // Get accepted applications for this cohort
    const { data: applications, error: appsError } = await supabase
      .from('roundtable_applications')
      .select('*')
      .eq('cohort_id', cohort.id)
      .eq('status', 'accepted');

    if (appsError || !applications) continue;

    for (const app of applications) {
      const emailsSent = app.emails_sent || [];
      const sentTypes = emailsSent.map((e: any) => e.type);

      // 48-hour reminder (between 47-49 hours before)
      if (hoursUntilSession >= 47 && hoursUntilSession <= 49 && !sentTypes.includes('reminder_48h')) {
        const result = await sendScheduledEmail(supabase, app, cohort, 'reminder_48h');
        results.push(result);
      }

      // 6-hour reminder (between 5-7 hours before)
      if (hoursUntilSession >= 5 && hoursUntilSession <= 7 && !sentTypes.includes('reminder_6h')) {
        const result = await sendScheduledEmail(supabase, app, cohort, 'reminder_6h');
        results.push(result);
      }

      // 30-minute follow-up (between 25-35 minutes after end)
      if (minutesSinceEnd >= 25 && minutesSinceEnd <= 35 && !sentTypes.includes('follow_up')) {
        const result = await sendScheduledEmail(supabase, app, cohort, 'follow_up');
        results.push(result);
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, emails_sent: results.length, results }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 }
  );
}

async function sendScheduledEmail(supabase: any, app: any, cohort: any, emailType: string) {
  const emailTemplate = getEmailTemplate(emailType, app, cohort);

  console.log(`Sending ${emailType} email to:`, app.email);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Clive Hays <clive.hays@cloverera.com>',
      to: app.email,
      subject: emailTemplate.subject,
      text: emailTemplate.body,
      reply_to: 'clive.hays@cloverera.com',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${emailType} email error:`, errorText);
    return { success: false, type: emailType, email: app.email, error: errorText };
  }

  const emailResult = await response.json();

  // Track email sent
  const currentEmails = app.emails_sent || [];
  const updatedEmails = [
    ...currentEmails,
    {
      type: emailType,
      sent_at: new Date().toISOString(),
      email_id: emailResult.id,
    },
  ];

  await supabase
    .from('roundtable_applications')
    .update({ emails_sent: updatedEmails })
    .eq('id', app.id);

  return { success: true, type: emailType, email: app.email, email_id: emailResult.id };
}

function getEmailTemplate(type: string, app: any, cohort: any) {
  const firstName = app.full_name.split(' ')[0];
  const sessionDate = formatDate(cohort?.date);
  const sessionTime = cohort?.time || 'TBA';
  const sessionTimezone = cohort?.timezone || '';
  const meetingLink = cohort?.zoom_link || 'Link will be provided';

  const templates: Record<string, { subject: string; body: string }> = {
    'application_received': {
      subject: 'Application received - Retention Reality Roundtable',
      body: `${firstName} -

Got your application. I review these personally, so give me 48 hours.

You'll hear back either way.

Clive`,
    },
    'accepted': {
      subject: `You're in: Retention Reality Roundtable ${sessionDate}`,
      body: `${firstName} -

You're confirmed for the Retention Reality Roundtable on ${sessionDate} at ${sessionTime} ${sessionTimezone}.

Three things to know:

1. This is a conversation, not a presentation. Come ready to share what's actually happening on your team.

2. Chatham House rules apply. Share what you learn, never who said it.

3. There are 7 other managers in this session. Different companies, similar challenges. That's the point.

Meeting link: ${meetingLink}

See you there.

Clive`,
    },
    'reminder_48h': {
      subject: `Reminder: Roundtable in 2 days - ${sessionDate}`,
      body: `${firstName} -

Quick reminder - we're meeting in 2 days.

${sessionDate} at ${sessionTime} ${sessionTimezone}

Meeting link: ${meetingLink}

Come ready to share what's actually happening on your team. The more specific you are, the more useful this will be.

See you soon.

Clive`,
    },
    'reminder_6h': {
      subject: `Today: Roundtable at ${sessionTime} ${sessionTimezone}`,
      body: `${firstName} -

We're on in a few hours.

Today at ${sessionTime} ${sessionTimezone}

Meeting link: ${meetingLink}

Quick reminders:
- This is a conversation, not a presentation
- Chatham House rules: share what you learn, never who said it
- Come ready to talk about what's actually happening

See you soon.

Clive`,
    },
    'follow_up': {
      subject: 'Thanks for joining the Roundtable',
      body: `${firstName} -

Thanks for being part of today's conversation.

A few things:

1. If something came up that you'd like to explore further - whether it's about retention patterns, how to talk to leadership, or what Clover ERA does - just reply to this email.

2. If you know another manager who'd benefit from this kind of conversation, send them to cloverera.com/roundtable

3. I'll be running another session soon. If you want to join again or have someone specific in mind, let me know.

Thanks again for showing up and sharing.

Clive`,
    },
    'waitlisted': {
      subject: "Roundtable update - you're on the list",
      body: `${firstName} -

Thanks for applying. This cohort filled up, but you're on the list for the next one.

I run these regularly. You'll get first notice when the next date is set.

If timing is urgent and you want to talk about what's happening on your team sooner, reply to this email.

Clive`,
    },
    'declined': {
      subject: 'Roundtable application - not the right fit',
      body: `${firstName} -

Thanks for applying to the Retention Reality Roundtable.

This particular program is designed for managers at companies with 100+ employees, and based on your application it's not the right fit.

If your situation changes or I've misjudged the fit, reply and let me know.

Clive`,
    },
  };

  return templates[type] || templates['application_received'];
}

function getAdminNotificationTemplate(app: any, cohort: any) {
  const cohortInfo = cohort
    ? `${formatDate(cohort.date)} at ${cohort.time} ${cohort.timezone}`
    : 'No cohort selected';

  return {
    subject: `New Roundtable Application: ${app.full_name} @ ${app.company_name}`,
    body: `New application received for the Retention Reality Roundtable.

APPLICANT DETAILS
-----------------
Name: ${app.full_name}
Email: ${app.email}
Company: ${app.company_name}
Title: ${app.job_title}
Team Size: ${app.team_size}
LinkedIn: ${app.linkedin_url || 'Not provided'}

SESSION
-------
Cohort: ${cohortInfo}
Availability: ${app.availability_confirmed ? 'Confirmed' : 'Not confirmed'}

CHALLENGE
---------
${app.current_challenge || 'Not provided'}

---
Review and respond: https://cloverera.com/crm/roundtable-admin.html

Reply to this email to contact the applicant directly.`,
  };
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'TBA';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
