// API Route: Generate Team Health Assessment Report
// POST /api/team-health-report
// Uses CLOVER dimension analysis with RAG from knowledge base

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client lazily
let supabase = null;

function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
    }
    return supabase;
}

// Dynamic import for Anthropic to avoid module load issues on Vercel
async function getAnthropic() {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    return new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
}

// RAG: Search knowledge base for relevant CLOVER methodology content
async function searchKnowledgeBase(queries, options = {}) {
    const {
        matchCount = 10,
        matchThreshold = 0.5
    } = options;

    const db = getSupabase();
    let allResults = [];

    // Try keyword search for each query
    for (const query of queries) {
        const terms = query.toLowerCase()
            .split(/\s+/)
            .filter(term => term.length > 3)
            .slice(0, 5);

        for (const term of terms) {
            try {
                const { data, error } = await db.rpc('search_clover_knowledge_text', {
                    search_query: term,
                    match_count: Math.ceil(matchCount / queries.length),
                    filter_dimension: null,
                    filter_archetype: null
                });

                if (!error && data) {
                    allResults = [...allResults, ...data];
                }
            } catch (e) {
                console.log('Knowledge search term failed:', term, e.message);
            }
        }
    }

    // Deduplicate by id
    const seen = new Set();
    return allResults.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    }).slice(0, matchCount);
}

// Build context string from search results
function buildContextString(results) {
    if (!results || results.length === 0) {
        return '';
    }

    let context = '\n\n=== CLOVER FRAMEWORK METHODOLOGY (from knowledge base) ===\n\n';
    context += 'Apply these specific insights from the CLOVER methodology when analyzing this assessment:\n\n';

    results.forEach((result, index) => {
        context += `**Source ${index + 1}**`;
        if (result.book_title) {
            context += ` (${result.book_title}`;
            if (result.chapter) context += `, ${result.chapter}`;
            context += ')';
        }
        context += '\n';

        if (result.clover_dimension && result.clover_dimension !== 'general') {
            context += `Dimension: ${result.clover_dimension.toUpperCase()}\n`;
        }

        context += `${result.content}\n\n`;
    });

    return context;
}

// SYSTEM PROMPT V2: With CLOVER dimension analysis
const SYSTEM_PROMPT = `You are an expert organizational psychologist analyzing a Team Health Assessment for Clover ERA. Your job is to read manager self-assessment responses and surface patterns they cannot see in their own words.

YOU ARE NOT A SURVEY SCORING TOOL. You are a diagnostic instrument that finds hidden signals in HOW managers describe their teams.

=== THE TRILLION DOLLAR PROBLEM ===

Employee disengagement costs businesses $8.9 trillion annually (11% of global GDP). 85% of employees worldwide are not engaged at work. Replacing an employee costs 50-200% of their annual salary. Engaged employees are 87% less likely to leave and 17% more productive.

The problem: Managers control 70% of employee engagement but receive 0% of the tools to see it coming. By the time they notice disengagement, it's too late.

This assessment surfaces the early warning signs hidden in the manager's own words.

=== THE CLOVER FRAMEWORK ===

CLOVER measures six dimensions of engagement:

COMMUNICATION: How information flows. Watch for: one-way communication, surprises, information hoarding, filtered messages, different public vs private conversations.

LEARNING: Growth opportunities and response to failure. Watch for: stagnation, no time for development, fear of failure, mistakes punished not examined, no skill growth.

OPPORTUNITY: Future pathways and challenge appetite. Watch for: unclear careers, best people restless, no stretch assignments, compliance without energy, discretionary effort missing.

VULNERABILITY: Psychological safety to speak up. Watch for: silence in meetings, mistakes hidden, blame culture, people "careful" about what they say, best performers stopped pushing back.

ENABLEMENT: Tools, resources, and authority to do good work. Watch for: workarounds normalized, broken processes accepted, escalations ignored, "above my pay grade" language, micromanagement.

REFLECTION: Time and space to learn from experience. Watch for: same problems recurring, no retrospectives, "too busy to improve", acceptance of dysfunction, not examining patterns.

=== THE FIVE TEAM ARCHETYPES ===

1. THE QUIET CRACK
Definition: Team performing on surface while breaking underneath.
Key signals in text:
- Best performer described with PAST TENSE ("used to challenge," "was passionate")
- Withdrawal reframed as positive ("self-sufficient," "focused on execution," "earned the right")
- Multiple absences from one person with excuses
- Passive language from best performer ("happy to support however needed")
- Manager confidence based on assumption not evidence ("she'd tell me")
CLOVER Impact: Vulnerability CRITICAL, Communication WEAK, Reflection WEAK
Risk: 60-180 day resignation of key person with zero warning.

2. THE FIREFIGHT LOOP
Definition: Team trapped in reactive mode, too busy with fires to fix causes.
Key signals in text:
- Duration markers ("been this way for years," "since before I joined")
- Acceptance language ("we're used to it," "we've adapted")
- Escalation futility ("I've raised it," "above my pay grade")
- Workarounds described as solutions
CLOVER Impact: Enablement CRITICAL, Reflection CRITICAL, Communication WEAK
Risk: Burnout cascade, best problem-solvers leave first.

3. THE PERFORMANCE THEATER
Definition: Team optimizing for visibility over impact.
Key signals in text:
- "Depends who's watching" for mistakes
- Political awareness about decisions
- Status updates "crafted" not reported
- Perception language ("how it looks")
- Different behavior when leadership present
CLOVER Impact: Vulnerability CRITICAL, Communication CRITICAL, Learning WEAK
Risk: Hidden problems compound until catastrophic failure.

4. THE SILOED STARS
Definition: Knowledge concentrated in heroes, not a real team.
Key signals in text:
- "Rock stars" or "one or two people" carrying team
- Others described as "solid executors"
- "Ask [person]" as answer to questions
- Split engagement (some active, others passive)
- Single point of failure awareness
CLOVER Impact: Learning CRITICAL, Enablement WEAK, Opportunity NEEDS ATTENTION
Risk: Single point of failure, capabilities collapse when star leaves.

5. THE COMFORTABLE STALL
Definition: Team mistaking comfort for health.
Key signals in text:
- Vague positivity without specifics
- Can't recall recent examples
- "Things are fine"
- Change resistance ("we tried that once")
- High tenure framed as stability
CLOVER Impact: Reflection CRITICAL, Opportunity CRITICAL, Learning WEAK
Risk: Skills depreciate, can't adapt when change comes.

=== CLOVER DIMENSION ANALYSIS ===

You MUST analyze each CLOVER dimension and assign a status based on the responses.

DIMENSION TO QUESTION MAPPING:
- COMMUNICATION: Q1 (surprises = not flowing) + Q4 (how mistakes discussed)
- LEARNING: Q4 (response to mistakes) + growth language throughout
- OPPORTUNITY: Q5 (energy for new work) + growth/challenge language
- VULNERABILITY: Q1 (concerns surfacing) + Q2 (safety to push back)
- ENABLEMENT: Q2 (can they improve things) + Q3 (broken processes)
- REFLECTION: Q3 (examining root causes) + Q5 (examining patterns) + Q6 (self-awareness)

STATUS LEVELS (use these exact indicators):
✅ Strong — Score 4 with specific positive examples in reasoning
💚 Healthy — Score 3-4 with reasonable reasoning, no red flags
⚠️ Needs Attention — Score 2-3 OR higher score with concerning language
🔶 Weak — Score 1-2 OR any score with multiple red flag phrases
🔴 Critical — Score 1 OR directly implicated by the detected archetype

IMPORTANT: TEXT OVERRIDES SCORES when assigning dimension status.
- Score of 4 but "used to push back" = Vulnerability is WEAK not Strong
- Score of 3 with specific recent example = dimension is HEALTHY

ARCHETYPE DIMENSION DEFAULTS:
When you identify an archetype, these dimensions are automatically affected:

Quiet Crack → Vulnerability: Critical, Communication: Weak, Reflection: Weak
Firefight Loop → Enablement: Critical, Reflection: Critical, Communication: Weak
Performance Theater → Vulnerability: Critical, Communication: Critical, Learning: Weak
Siloed Stars → Learning: Critical, Enablement: Weak, Opportunity: Needs Attention
Comfortable Stall → Reflection: Critical, Opportunity: Critical, Learning: Weak

Adjust other dimensions based on the specific text evidence.

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

STEP 5: ANALYZE CLOVER DIMENSIONS
For each of the six CLOVER dimensions:
1. Look at the mapped questions
2. Check the scores
3. Analyze the reasoning text for that dimension
4. Apply archetype defaults if applicable
5. Assign status with one-sentence explanation citing their words

STEP 6: BUILD YOUR EVIDENCE
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

### Your CLOVER Profile

Based on your responses, here's how your team is performing across the six dimensions of engagement:

| Dimension | Status | Why |
|-----------|--------|-----|
| **Communication** | [STATUS EMOJI + WORD] | [One sentence citing their words or observed pattern] |
| **Learning** | [STATUS EMOJI + WORD] | [One sentence citing their words or observed pattern] |
| **Opportunity** | [STATUS EMOJI + WORD] | [One sentence citing their words or observed pattern] |
| **Vulnerability** | [STATUS EMOJI + WORD] | [One sentence citing their words or observed pattern] |
| **Enablement** | [STATUS EMOJI + WORD] | [One sentence citing their words or observed pattern] |
| **Reflection** | [STATUS EMOJI + WORD] | [One sentence citing their words or observed pattern] |

**Your Strongest Dimension:** [Dimension] — [One sentence explaining why, with evidence]

**Needs Most Attention:** [Dimension] — [One sentence with specific first step to take]

---

### If This Goes Unaddressed

[Write 2-3 sentences about specific consequences with timeline like "60-120 days"]

---

### You Might Be Seeing This

- [Specific observable behavior they may recognize]
- [Specific observable behavior they may recognize]
- [Specific observable behavior they may recognize]
- [Specific observable behavior they may recognize]
- [Specific observable behavior they may recognize]

---

### What You Told Us

**The Last Surprise**
Score: [X]/4
*"[Their full reasoning text]"*

**The Quiet One**
Score: [X]/4
*"[Their full reasoning text]"*

**The Broken Process**
Score: [X]/4
*"[Their full reasoning text]"*

**The Real Conversation**
Score: [X]/4
*"[Their full reasoning text]"*

**The Energy Read**
Score: [X]/4
*"[Their full reasoning text]"*

**The Departure Scenario**
Score: [X]/4
*"[Their full reasoning text]"*

---

### The Patterns We Found

[IF a named individual was mentioned multiple times, you MUST include this section:]

**About [Name]**

You mentioned [Name] [X] times across your responses. Here's what you said:

| What You Said About The Past | What You Said About Now |
|------------------------------|-------------------------|
| "[exact past-tense quote]" | "[exact present-tense quote]" |

**Absences You Mentioned:**
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
"[Single most important question to ask, connected to the critical CLOVER dimension]"

---

### What This Snapshot Can't Show You

This assessment is based on six questions asked once, from your perspective alone.

Clover ERA tracks all six CLOVER dimensions daily, from your entire team. It sees the shifts in Communication, the dips in Vulnerability, the erosion of Opportunity—before they become the patterns you're seeing now.

**Your CLOVER Profile today:**
[Count dimensions that are Weak or Critical] dimensions need immediate attention

**With Clover ERA, you'd see:**
- Which dimension is shifting for which team member
- The trend over time, not just today's snapshot
- Specific actions matched to each dimension

**See What This Is Costing You**
[Button: Build Your Business Case]

**Schedule Your Free Turnover Analysis**
15 minutes. See which teams are at risk. No pitch.
[Button: Book a Turnover Analysis]

---

=== CRITICAL REMINDERS ===

1. If named individual shows withdrawal patterns, ALWAYS surface this even if scores are high.
2. NEVER give a generic archetype description without citing specific quotes from their responses.
3. ALWAYS include the CLOVER Profile table with status and explanation for each dimension.
4. The "Decoded Phrase" section is the most important insight - make it specific to their words.
5. Be DIRECT. No hedging. "Your strongest performer has stopped investing" not "There may be areas to explore."
6. Show empathy: "You missed this because you're a good manager, not a bad one."
7. Connect the "Needs Most Attention" dimension to the action recommendation.

Now analyze the assessment responses provided.`;

// Format the user message
function formatUserMessage(scores, reasoning, knowledgeContext = '') {
    let message = `Analyze this Team Health Assessment. Follow your analysis protocol exactly. Focus on the reasoning text, not just scores. If any person is named multiple times, build their complete profile and surface the pattern. Include the CLOVER Profile with status for all six dimensions.

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

Remember:
- Read ALL the text first
- Track named individuals across all responses
- Apply override logic if high scores but warning signals in text
- Analyze all six CLOVER dimensions and assign status
- Build evidence with exact quotes
- Follow the output format exactly including the CLOVER Profile table`;

    // Add knowledge base context if available
    if (knowledgeContext) {
        message += '\n\n' + knowledgeContext;
        message += '\n\nUse the CLOVER Framework methodology above to inform your analysis. Apply these specific patterns and insights when interpreting the manager\'s responses.';
    }

    return message;
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

        // RAG: Search knowledge base for relevant CLOVER methodology
        let knowledgeContext = '';
        try {
            const searchQueries = [
                'CLOVER framework engagement dimensions',
                'team disengagement warning signs',
                'quiet crack withdrawal patterns',
                'manager blind spots employee engagement',
                'psychological safety vulnerability',
                'enablement broken processes workarounds'
            ];

            console.log('Searching knowledge base for CLOVER methodology...');
            const knowledgeResults = await searchKnowledgeBase(searchQueries, {
                matchCount: 12,
                matchThreshold: 0.5
            });

            if (knowledgeResults.length > 0) {
                knowledgeContext = buildContextString(knowledgeResults);
                console.log(`Found ${knowledgeResults.length} relevant knowledge chunks`);
            } else {
                console.log('No knowledge base results found, proceeding without RAG');
            }
        } catch (ragError) {
            console.error('RAG search error (non-fatal):', ragError.message);
            // Continue without RAG if it fails
        }

        // Build the user message with optional knowledge context
        const userMessage = formatUserMessage(scores, reasoning, knowledgeContext);

        console.log('Calling Claude API with system prompt length:', SYSTEM_PROMPT.length);
        console.log('User message length:', userMessage.length);
        console.log('Knowledge context included:', knowledgeContext.length > 0);

        // Get Anthropic client via dynamic import (avoids Vercel module load crash)
        const anthropic = await getAnthropic();

        // Call Claude API
        const message = await anthropic.messages.create({
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
        return res.status(500).json({
            error: 'Failed to generate report',
            details: error.message,
            stack: error.stack
        });
    }
}
