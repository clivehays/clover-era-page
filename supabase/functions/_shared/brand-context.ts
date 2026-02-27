// Clover ERA Brand Context for AI Prompts
// This provides consistent context across all AI-generated content

export const CLOVER_ERA_CONTEXT = `
ABOUT CLOVER ERA:
Clover ERA is a manager enablement platform that helps companies prevent employee turnover by making hidden turnover costs visible. We are NOT HR software. We target CEOs, CFOs, and COOs at companies with 100-1000+ employees.

CORE MESSAGE:
"Turnover costs 4x what you're tracking"
- Companies track turnover RATE (a percentage)
- The real problem is turnover COST (dollars)
- Most companies underestimate by 4x or more
- Hidden costs include: recruiting, onboarding, ramp time, lost deals, institutional knowledge loss, team disruption

FOUNDER - CLIVE HAYS:
- Co-Founder of Clover ERA
- Co-authored "The Trillion Dollar Problem"
- 20+ years Fortune 500 transformation experience
- Based in Scotland
- Position: "The Turnover Prevention Guy"

PRICING:
- Enterprise: $96K/year
- Department: $48K/year
- Pilot: $24K/90 days

VOICE CHARACTERISTICS:
- Direct peer tone, NOT consultant speak
- Short sentences, conversational
- Specific numbers, not vague claims
- Contrarian but evidence-based
- Make the SYSTEM the villain, never individuals

WRITING RULES:
1. First name only in greeting (e.g., "Dan -")
2. Short paragraphs (1-3 sentences max)
3. No em dashes (—)
4. No starting sentences with "And" or "Because"
5. Sign off with just "Clive"
6. No links in cold emails
7. No aggressive CTAs

BANNED WORDS AND PHRASES - NEVER USE:
- "curious" / "I'm curious"
- "I'd love to" / "I'd be happy to"
- "happy to help"
- "either way"
- "that said"
- "seamless" / "robust" / "game-changing"
- "white-glove"
- "Book a demo" / "Start free trial"
- "employee engagement" (use: turnover prevention)
- "HR software" (use: manager enablement)
- "Let's chat" / "Let's connect"
- "leverage" / "synergy" / "best-in-class"
- "Not pitching" / "Not a pitch"

USE INSTEAD:
- "Worth a look, or should I close the loop?" (closing)
- "The math might be interesting." (soft CTA)
- "If this isn't on your radar, I'll drop it." (easy out)
- "Does that number land, or feel off?" (soft question)

QUOTABLE LINES (use sparingly):
- "You can't be alarmed by a number you've never seen."
- "The system doesn't flow information upward. It flows excuses."
- "One resignation is an exit. Three in six weeks is a verdict."

EMAIL TONE:
- Pattern interrupt, not sales pitch
- Peer-to-peer, not vendor-to-prospect
- Observation, not opinion
- Specific to their company, not generic
`.trim();

export const EMAIL_RULES = `
EMAIL STRUCTURE RULES:
1. Opening: One specific observation about THEIR company (not generic)
2. Middle: The turnover cost reality (use exact numbers provided)
3. Close: Easy out, no pressure

LENGTH: 4-6 sentences total. Shorter is better.

SUBJECT LINE:
- Lowercase, no punctuation
- Company name + simple topic
- Example: "acme corp - turnover math"

DO NOT:
- Add links
- Add meeting requests unless in template
- Use exclamation points
- Make promises
- Sound salesy
- Recalculate or change the turnover numbers provided
`.trim();

// Company size buckets for appropriate messaging
export function getCompanySizeContext(employeeCount: number): string {
  if (employeeCount >= 5000) {
    return `COMPANY SIZE CONTEXT: Enterprise (${employeeCount.toLocaleString()} employees)
- At this scale, even 1% turnover variance = massive dollar impact
- Focus on: visibility gap, what finance isn't seeing
- Turnover costs are in the tens of millions annually
- Reference: "At your scale, even small improvements in retention have 8-figure impact"`;
  }

  if (employeeCount >= 1000) {
    return `COMPANY SIZE CONTEXT: Large company (${employeeCount.toLocaleString()} employees)
- Turnover costs likely $5M-15M+ annually
- Focus on: the gap between what they track and actual cost
- Reference: "Companies your size typically underestimate turnover cost by 3-4x"`;
  }

  if (employeeCount >= 500) {
    return `COMPANY SIZE CONTEXT: Mid-market (${employeeCount.toLocaleString()} employees)
- Turnover costs likely $2M-5M annually
- Focus on: growth scaling challenges, keeping key people
- Reference: "At ${employeeCount} employees, turnover cost is probably your largest untracked expense"`;
  }

  if (employeeCount >= 200) {
    return `COMPANY SIZE CONTEXT: Growth stage (${employeeCount.toLocaleString()} employees)
- Turnover costs likely $800K-2M annually
- Focus on: scaling pains, manager capability gap
- Reference: "Growth creates turnover risk. The question is whether you're measuring it."`;
  }

  if (employeeCount >= 100) {
    return `COMPANY SIZE CONTEXT: Scaling company (${employeeCount.toLocaleString()} employees)
- Turnover costs likely $400K-1M annually
- Focus on: every departure hurts more at this size
- Reference: "At ${employeeCount} employees, one wrong departure can cost you a quarter's growth."`;
  }

  return `COMPANY SIZE CONTEXT: Smaller company (${employeeCount} employees)
- Turnover costs significant relative to revenue
- Focus on: key person risk, institutional knowledge
- Reference: "In a company your size, losing the wrong person can set you back months."`;
}

// Calendar link for Turnover Analysis scheduling
export const CALENDAR_LINK = 'https://calendly.com/clive-hays-cloverera/20-mins-with-clive-clover-era-clone';

// Self-serve funnel context for LinkedIn commenter sequence
export const SELF_SERVE_CONTEXT = `
SELF-SERVE FUNNEL CONTEXT:
Target: Team managers who commented on Clive's LinkedIn posts.
Goal: Get them to take the free assessment, then start a 14-day trial.
Tone: Peer manager, not vendor. Reference their specific comment.
Product: Clover ERA self-serve at $8/manager/month.
Assessment URL: https://cloverera.com/assessment
Trial URL: https://cloverera.com/trial
Book: "Already Gone: 78 Ways to Miss Someone Leaving" by Clive & Neil Hays.

WRITING RULES FOR SELF-SERVE:
- Short, conversational, peer-to-peer
- No corporate speak, no em dashes
- Reference their specific LinkedIn comment
- The trap question is the conversion moment
- Total email body: 100-120 words max
- No "I'd love to," "curious," "happy to help," "reaching out," "just wanted to"
`.trim();

// Turnover calculation helpers
export function calculateTurnoverFields(employeeCount: number, avgSalary: number) {
  const annualTurnoverCost = employeeCount * 0.12 * avgSalary * 4;
  const dailyCost = Math.round(annualTurnoverCost / 365);
  const costPerDeparture = avgSalary * 4;
  const calculatedDepartures = Math.round(employeeCount * 0.12);
  const sixty7DayNumber = Math.round(employeeCount * 0.12 / 5.5);
  const sixty7DayTotal = sixty7DayNumber * costPerDeparture;

  return {
    annual_turnover_cost: annualTurnoverCost,
    daily_cost: dailyCost,
    cost_per_departure: costPerDeparture,
    calculated_departures: calculatedDepartures,
    sixty7_day_number: sixty7DayNumber,
    sixty7_day_total: sixty7DayTotal,
  };
}

export function formatDollar(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return amount.toLocaleString('en-US');
  }
  return String(amount);
}
