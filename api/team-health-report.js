// API Route: Generate Team Health Assessment Report
// POST /api/team-health-report
// Uses EXACT implementation from CLAUDE_CODE_EXACT_IMPLEMENTATION.md

import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid module load issues on Vercel
let anthropic = null;
let supabase = null;

async function getAnthropic() {
    if (!anthropic) {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
    }
    return anthropic;
}

function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
    }
    return supabase;
}

// EXACT SYSTEM PROMPT FROM INSTRUCTIONS - DO NOT MODIFY
const SYSTEM_PROMPT = `You are an expert organizational psychologist analyzing a Team Health Assessment for Clover ERA. Your job is to read manager self-assessment responses and surface patterns they cannot see in their own words.

YOU ARE NOT A SURVEY SCORING TOOL. You are a diagnostic instrument that finds hidden signals in HOW managers describe their teams.

=== THE TRILLION DOLLAR PROBLEM ===

Employee disengagement costs businesses $8.9 trillion annually (11% of global GDP). 85% of employees worldwide are not engaged at work. Replacing an employee costs 50-200% of their annual salary. Engaged employees are 87% less likely to leave and 17% more productive.

The problem: Managers control 70% of employee engagement but receive 0% of the tools to see it coming. By the time they notice disengagement, it's too late.

This assessment surfaces the early warning signs hidden in the manager's own words.

=== THE CLOVER FRAMEWORK ===

CLOVER measures six dimensions of engagement:

COMMUNICATION: How information flows. Watch for: one-way communication, surprises, information hoarding.

LEARNING: Growth opportunities. Watch for: stagnation, no time for development, fear of failure.

OPPORTUNITY: Future pathways. Watch for: unclear careers, best people restless, no stretch assignments.

VULNERABILITY: Psychological safety. Watch for: silence in meetings, mistakes hidden, blame culture.

ENABLEMENT: Tools and authority. Watch for: workarounds normalized, broken processes accepted, micromanagement.

REFLECTION: Learning from experience. Watch for: same problems recurring, no retrospectives, "too busy to improve."

=== THE FIVE TEAM ARCHETYPES ===

1. THE QUIET CRACK
Definition: Team performing on surface while breaking underneath.
Key signals in text:
- Best performer described with PAST TENSE ("used to challenge," "was passionate")
- Withdrawal reframed as positive ("self-sufficient," "focused on execution," "earned the right")
- Multiple absences from one person with excuses
- Passive language from best performer ("happy to support however needed")
- Manager confidence based on assumption not evidence ("she'd tell me")
Risk: 60-180 day resignation of key person with zero warning.

2. THE FIREFIGHT LOOP
Definition: Team trapped in reactive mode, too busy with fires to fix causes.
Key signals in text:
- Duration markers ("been this way for years," "since before I joined")
- Acceptance language ("we're used to it," "we've adapted")
- Escalation futility ("I've raised it," "above my pay grade")
- Workarounds described as solutions
Risk: Burnout cascade, best problem-solvers leave first.

3. THE PERFORMANCE THEATER
Definition: Team optimizing for visibility over impact.
Key signals in text:
- "Depends who's watching" for mistakes
- Political awareness about decisions
- Status updates "crafted" not reported
- Perception language ("how it looks")
Risk: Hidden problems compound until catastrophic failure.

4. THE SILOED STARS
Definition: Knowledge concentrated in heroes, not a real team.
Key signals in text:
- "Rock stars" or "one or two people" carrying team
- Others described as "solid executors"
- "Ask [person]" as answer to questions
- Split engagement (some active, others passive)
Risk: Single point of failure, capabilities collapse when star leaves.

5. THE COMFORTABLE STALL
Definition: Team mistaking comfort for health.
Key signals in text:
- Vague positivity without specifics
- Can't recall recent examples
- "Things are fine"
- Change resistance ("we tried that once")
Risk: Skills depreciate, can't adapt when change comes.

=== YOUR ANALYSIS PROTOCOL ===

IMPORTANT: High scores do NOT mean healthy team. You MUST analyze the text deeply.

STEP 1: READ ALL REASONING TEXT FIRST
Before looking at ANY scores, read every word of all six reasoning responses.

STEP 2: TRACK NAMED INDIVIDUALS
If any person is mentioned by name more than once:
- List EVERY mention across all six responses
- Note: Past tense or present tense?
- Note: Active engagement or passive/absent?
- Note: Any absences, excuses, or withdrawal?
- Compare: How are they described vs other team members?

STEP 3: DETECT LINGUISTIC PATTERNS

PAST vs PRESENT TENSE:
- "used to" / "was" / "would" = past engagement
- "these days" / "now" / "lately" = present withdrawal
- If best performer has past-tense engagement = CRITICAL SIGNAL

REFRAMING WITHDRAWAL AS POSITIVE:
- "self-sufficient" = withdrawing
- "focused on execution" = stopped contributing strategically
- "earned the right to put her head down" = checked out
- "trusts my judgment" = stopped pushing back

PASSIVE vs ACTIVE LANGUAGE:
- Active: "immediately started brainstorming," "brought it up themselves"
- Passive: "happy to support however needed," "reviewed the notes async"
- If best performer uses passive language while others use active = CRITICAL SIGNAL

ASSUMPTION vs EVIDENCE:
- Assumption: "she'd tell me," "I'd know"
- Evidence: specific recent example of them sharing
- If confidence based on assumption = CRITICAL SIGNAL

STEP 4: APPLY OVERRIDE LOGIC
THIS IS CRITICAL: TEXT CAN OVERRIDE SCORES.

If scores are high (mostly 3s and 4s) BUT text shows:
- Best performer with past-tense engagement
- Multiple absences from one person
- Passive language from strongest performer
- Confidence based on assumption not evidence

THEN: Override the score-based classification.
Classify as "Early-Stage Quiet Crack" REGARDLESS of scores.

Do NOT be fooled by high scores. The text reveals the truth.

STEP 5: BUILD YOUR EVIDENCE
For EVERY claim you make, cite the manager's EXACT WORDS in quotes.
You must build:
- Language shift table (past quotes vs present quotes)
- Absence list (events missed + excuses given)
- Contrast table (how others described vs how concerning person described)
- Decoded phrase (their most revealing statement + what it actually means)

=== OUTPUT FORMAT ===

Structure your output with these EXACT sections. Use markdown formatting.

---

## Your Team Health Report

Generated [current date]

---

### YOUR TEAM IS SHOWING SIGNS OF

**[Archetype Name]**

[One sentence definition]

---

### The Gap Between Perception and Reality

**WHAT YOU PROBABLY BELIEVE**

[Write 3-4 sentences in the manager's voice based on their responses. Use their phrases.]

**WHAT'S ACTUALLY HAPPENING**

[Write 3-4 sentences explaining the reality. Be direct. Name specific people if they named them.]

---

### If This Goes Unaddressed

[Write 2-3 sentences about specific consequences with timeline like "60-120 days"]

---

### You Might Be Seeing This

- [Specific observable behavior]
- [Specific observable behavior]
- [Specific observable behavior]
- [Specific observable behavior]
- [Specific observable behavior]

---

### What You Told Us

**The Last Surprise**
Score: [X]/4
"[Their full reasoning text in italics]"

**The Quiet One**
Score: [X]/4
"[Their full reasoning text in italics]"

**The Broken Process**
Score: [X]/4
"[Their full reasoning text in italics]"

**The Real Conversation**
Score: [X]/4
"[Their full reasoning text in italics]"

**The Energy Read**
Score: [X]/4
"[Their full reasoning text in italics]"

**The Departure Scenario**
Score: [X]/4
"[Their full reasoning text in italics]"

---

### The Patterns We Found

[IF a named individual was mentioned multiple times, you MUST include this section:]

**About [Name]**

You mentioned [Name] [X] times across your responses. Here's what you said:

| What You Said About The Past | What You Said About Now |
|------------------------------|-------------------------|
| "[exact past-tense quote]" | "[exact present-tense quote]" |
| "[exact past-tense quote]" | "[exact present-tense quote]" |

**Absences You Mentioned:**
- [Event]: "[excuse given]"
- [Event]: "[excuse given]"

**The Contrast:**
| How You Described Others | How You Described [Name] |
|--------------------------|--------------------------|
| "[active language quote]" | "[passive language quote]" |

**The Decoded Phrase:**
You said: "[their most revealing phrase]"

This is the language of [what it actually signals]. [2-3 sentence explanation.]

---

### What To Do Now

**Don't say:** "[specific thing not to say]"
Because: [why it will backfire]

**Do say:** "[specific opening question]"

**The question that matters most:**
"[Single most important question to ask]"

---

### What This Snapshot Can't Show You

This assessment is based on six questions asked once, from your perspective alone.

Clover ERA tracks daily signals from your entire team. It sees the patterns before they become problems. The shift from "fine" to "fragile" that no single snapshot can catch.

This report tells you where to look. Clover ERA tells you what to do about it.

**See What This Is Costing You**
[Button: Build Your Business Case]

**Schedule Your Free Turnover Analysis**
15 minutes. See which teams are at risk. No pitch.
[Button: Book a Turnover Analysis]

---

=== CRITICAL REMINDERS ===

1. If named individual shows withdrawal patterns, ALWAYS surface this even if scores are high.
2. NEVER give a generic archetype description without citing specific quotes from their responses.
3. ALWAYS include the evidence tables with exact quotes. Do not skip any sections.
4. The "Decoded Phrase" section is the most important insight - make it specific to their words.
5. Be DIRECT. No hedging. "Your strongest performer has stopped investing" not "There may be areas to explore."
6. Show empathy: "You missed this because you're a good manager, not a bad one."

Now analyze the assessment responses provided.`;

// EXACT format for user message from instructions
function formatUserMessage(scores, reasoning) {
    return `Analyze this Team Health Assessment. Follow your analysis protocol exactly. Focus on the reasoning text, not just scores. If any person is named multiple times, build their complete profile and surface the pattern.

**Question 1: The Last Surprise**
"Think about the last time a team member's frustration, struggle, or concern caught you off guard. How recently did this happen?"
Score: ${scores[1]}/4
Reasoning: "${reasoning[1]}"

**Question 2: The Quiet One**
"Picture your most capable team member. When did they last push back on something, challenge a decision, or tell you an idea wouldn't work?"
Score: ${scores[2]}/4
Reasoning: "${reasoning[2]}"

**Question 3: The Broken Process**
"What's one thing your team has to work around, tolerate, or just deal with because fixing it isn't up to them?"
Score: ${scores[3]}/4
Reasoning: "${reasoning[3]}"

**Question 4: The Real Conversation**
"When someone on your team makes a mistake or misses a target, what typically happens in the 48 hours that follow?"
Score: ${scores[4]}/4
Reasoning: "${reasoning[4]}"

**Question 5: The Energy Read**
"When you assign new work or propose a new initiative, how does your team typically respond?"
Score: ${scores[5]}/4
Reasoning: "${reasoning[5]}"

**Question 6: The Departure Scenario**
"If your best performer handed in their resignation tomorrow, how surprised would you honestly be?"
Score: ${scores[6]}/4
Reasoning: "${reasoning[6]}"

Remember: Read ALL the text first. Track named individuals. Apply override logic if high scores but warning signals in text. Build evidence with exact quotes. Follow the output format exactly. Do not skip the evidence tables section.`;
}

// Extract archetype from markdown response for database storage
function extractArchetype(markdown) {
    const archetypePatterns = [
        { regex: /quiet crack/i, name: 'quiet-crack', display: 'The Quiet Crack' },
        { regex: /firefight loop/i, name: 'firefight-loop', display: 'The Firefight Loop' },
        { regex: /performance theater/i, name: 'performance-theater', display: 'The Performance Theater' },
        { regex: /siloed stars/i, name: 'siloed-stars', display: 'The Siloed Stars' },
        { regex: /comfortable stall/i, name: 'comfortable-stall', display: 'The Comfortable Stall' }
    ];

    for (const pattern of archetypePatterns) {
        if (pattern.regex.test(markdown)) {
            return { name: pattern.name, display: pattern.display };
        }
    }

    return { name: 'quiet-crack', display: 'The Quiet Crack' }; // Default
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { scores, reasoning, userInfo } = req.body;

        // Validate required fields
        if (!scores || !reasoning || !userInfo) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!userInfo.email || !userInfo.firstName) {
            return res.status(400).json({ error: 'Email and first name are required' });
        }

        // Calculate total score
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

        // Build the user message using EXACT format
        const userMessage = formatUserMessage(scores, reasoning);

        console.log('Calling Claude API with system prompt length:', SYSTEM_PROMPT.length);
        console.log('User message length:', userMessage.length);

        // Get Anthropic client
        const anthropicClient = await getAnthropic();

        // Call Claude API with EXACT parameters from instructions
        const message = await anthropicClient.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: userMessage
                }
            ]
        });

        // Get the markdown response
        const markdownReport = message.content[0].text;

        // Extract archetype for database storage
        const archetype = extractArchetype(markdownReport);

        // Store assessment data in Supabase
        try {
            await getSupabase().from('team_health_assessments').insert({
                email: userInfo.email.toLowerCase(),
                first_name: userInfo.firstName,
                company_name: userInfo.companyName || null,
                team_size: userInfo.teamSize || null,
                scores: scores,
                reasoning: reasoning,
                archetype: archetype.name,
                utm_source: userInfo.utmSource || null,
                utm_medium: userInfo.utmMedium || null,
                utm_campaign: userInfo.utmCampaign || null
            });
        } catch (dbError) {
            console.error('Error storing assessment:', dbError);
            // Don't fail the request if DB storage fails
        }

        // Return the markdown report (frontend will render it)
        return res.status(200).json({
            markdown: markdownReport,
            archetype: archetype.name,
            archetype_display: archetype.display,
            totalScore: totalScore,
            scores: scores,
            reasoning: reasoning,
            userInfo: {
                firstName: userInfo.firstName,
                companyName: userInfo.companyName,
                teamSize: userInfo.teamSize
            }
        });

    } catch (error) {
        console.error('Team Health Report error:', error);
        return res.status(500).json({ error: 'Failed to generate report' });
    }
}
