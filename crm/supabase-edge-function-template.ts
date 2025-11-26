/**
 * Supabase Edge Function: Roundtable Email Automation
 *
 * This function handles all email automation for the Roundtable system.
 * Deploy with: supabase functions deploy roundtable-emails
 *
 * Required Environment Variables:
 * - RESEND_API_KEY: Your Resend API key
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (full access)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailRequest {
  type: string
  application_id: string
  cohort_id?: string
}

serve(async (req) => {
  try {
    const { type, application_id, cohort_id } = await req.json() as EmailRequest

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get application data
    const { data: app, error: appError } = await supabase
      .from('roundtable_applications')
      .select('*, roundtable_cohorts(*)')
      .eq('id', application_id)
      .single()

    if (appError || !app) {
      throw new Error('Application not found')
    }

    // Get cohort data if not included
    let cohort = app.roundtable_cohorts
    if (cohort_id && !cohort) {
      const { data: cohortData } = await supabase
        .from('roundtable_cohorts')
        .select('*')
        .eq('id', cohort_id)
        .single()
      cohort = cohortData
    }

    // Get email template based on type
    const emailTemplate = getEmailTemplate(type, app, cohort)

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Clive Hays <clive@cloverera.com>',
        to: app.email,
        subject: emailTemplate.subject,
        text: emailTemplate.body,
        reply_to: 'clive@cloverera.com'
      })
    })

    if (!response.ok) {
      throw new Error(`Resend API error: ${await response.text()}`)
    }

    const emailResult = await response.json()

    // Track email sent in database
    const currentEmails = app.emails_sent || []
    const updatedEmails = [
      ...currentEmails,
      {
        type,
        sent_at: new Date().toISOString(),
        email_id: emailResult.id
      }
    ]

    await supabase
      .from('roundtable_applications')
      .update({ emails_sent: updatedEmails })
      .eq('id', application_id)

    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailResult.id,
        type,
        to: app.email
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Email function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/**
 * Generate email templates based on type
 */
function getEmailTemplate(type: string, app: any, cohort: any) {
  const firstName = app.full_name.split(' ')[0]

  const templates: Record<string, { subject: string, body: string }> = {
    'application_received': {
      subject: 'Application received - Retention Reality Roundtable',
      body: `${firstName} -

Got your application. I review these personally, so give me 48 hours.

You'll hear back either way.

Clive`
    },

    'accepted': {
      subject: `You're in: Retention Reality Roundtable ${formatDate(cohort?.date)}`,
      body: `${firstName} -

You're confirmed for the Retention Reality Roundtable on ${formatDate(cohort?.date)} at ${cohort?.time} ${cohort?.timezone}.

Three things to know:

1. This is a conversation, not a presentation. Come ready to share what's actually happening on your team.

2. Chatham House rules apply. Share what you learn, never who said it.

3. There are 9 other managers in this cohort. Different companies, similar challenges. That's the point.

Meeting link: ${cohort?.zoom_link || 'Will be sent in calendar invite'}

See you there.

Clive`
    },

    'waitlisted': {
      subject: 'Roundtable update - you\'re on the list',
      body: `${firstName} -

Thanks for applying. This cohort filled up, but you're on the list for the next one.

I run these quarterly. You'll get first notice when the next date is set.

If timing is urgent and you want to talk about what's happening on your team sooner, reply to this email.

Clive`
    },

    'declined': {
      subject: 'Roundtable application - not the right fit',
      body: `${firstName} -

Thanks for applying to the Retention Reality Roundtable.

This particular program is designed for managers at mid-size tech companies, and based on your application it's not the right fit.

If your situation changes or I've misjudged the fit, reply and let me know.

Clive`
    },

    'reminder_2_days': {
      subject: `${getDayName(cohort?.date)}: One question to think about`,
      body: `${firstName} -

Quick reminder: Roundtable is ${getDayName(cohort?.date)} at ${cohort?.time} ${cohort?.timezone}.

One question to think about before we meet:

"When's the last time someone on your team gave notice and you genuinely didn't see it coming?"

If the answer is "recently," you're not alone. That's what we're talking about.

Meeting link: ${cohort?.zoom_link}

See you ${getDayName(cohort?.date)}.

Clive`
    },

    'reminder_1_hour': {
      subject: 'Starting in 1 hour',
      body: `${firstName} -

Roundtable starts in an hour.

Meeting link: ${cohort?.zoom_link}

See you soon.

Clive`
    },

    'post_event_recording': {
      subject: 'Roundtable recording + one framework',
      body: `${firstName} -

Thanks for showing up today and being real about what's happening on your team. That's rare.

Two things:

1. Recording is here: ${cohort?.recording_link || '[Recording will be uploaded within 24 hours]'} (for your eyes only, Chatham House applies)

2. The framework we discussed: ${cohort?.framework_pdf_link || '[Will be sent separately]'}

One question I'm thinking about after today's conversation:

If your CEO heard what you shared in that room, what would change?

If the answer is "something would actually change," I'm happy to have that conversation with them directly. Just reply and I'll reach out.

Either way, glad you were there.

Clive`
    },

    'follow_up_low_intent': {
      subject: 'Roundtable feedback',
      body: `${firstName} -

Thanks for joining ${getDayName(cohort?.date)}. Hope it was useful.

Quick question: What would have made it more valuable for you?

Trying to improve these for future cohorts. Any feedback helps.

Clive`
    }
  }

  return templates[type] || templates['application_received']
}

/**
 * Format date as "Thursday, December 4"
 */
function formatDate(dateString: string): string {
  if (!dateString) return 'TBA'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Get day name from date (e.g., "Thursday")
 */
function getDayName(dateString: string): string {
  if (!dateString) return 'the scheduled day'
  const date = new Date(dateString)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}
