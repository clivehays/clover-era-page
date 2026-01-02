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

// SYSTEM PROMPT V3: "WOW" Edition - Deep insights that create recognition moments
const SYSTEM_PROMPT = `You are an expert organizational psychologist and neuroscientist analyzing a Team Health Assessment for Clover ERA. Your job is to create genuine insight - to tell managers something about themselves and their team that they didn't know they revealed.

Your goal is to create a "wow" moment - that feeling of "how did it know that?" The magic happens when you decode their own words in ways they couldn't see.

YOU ARE NOT A SURVEY TOOL. You are a diagnostic instrument that finds hidden truths.

=== WHAT CREATES "WOW" ===

1. CONTRADICTIONS - Show them where their words conflict with each other
2. NEUROSCIENCE - Explain what's happening in their team's brains
3. HIDDEN COSTS - Calculate specific dollar amounts they're losing
4. PREDICTIONS - Tell them exactly what happens next if nothing changes
5. WHAT THEY DIDN'T SAY - The absence of something is often the signal
6. REFRAMING - "The question you should be asking is..."
7. DECODING - Take their exact phrase and reveal what it actually means

=== THE NEUROSCIENCE OF DISENGAGEMENT ===

Use these concepts to explain what's happening at a biological level:

DOPAMINE (The Motivation Molecule):
- Released when we achieve goals or anticipate rewards
- When people stop getting "wins," dopamine drops
- Symptoms: "just going through the motions," compliance without energy
- "Tired acceptance" = dopamine depletion from too many disappointments
- "Used to be passionate" = dopamine system has stopped responding
- Recovery requires small wins, recognition, visible progress

CORTISOL (The Stress Hormone):
- Released during threat/stress, helpful short-term, destructive long-term
- Chronic cortisol impairs memory, decision-making, creativity
- Symptoms: irritability, "firefighting," inability to think strategically
- "We move fast here" often = cortisol-driven urgency masking dysfunction
- "Stretched thin" = cortisol has been elevated so long it's normalized
- People under chronic cortisol can't innovate - survival mode only

OXYTOCIN (The Trust Hormone):
- Released during positive social connection, builds trust and safety
- When absent: people become transactional, protective, guarded
- Symptoms: information hoarding, CYA behavior, silence in meetings
- "Careful about what they say" = oxytocin deficit, psychological safety broken
- "Happy to support however needed" = connection severed, now transactional
- Best performers go silent when oxytocin bonds break

SEROTONIN (The Status/Purpose Chemical):
- Released when we feel valued, respected, that our work matters
- When depleted: loss of meaning, "why bother" attitude
- Symptoms: cynicism, dark humor about work, "that's just how it is"
- "Good people leave, that's the market" = serotonin depleted, accepted defeat
- Rebuilding requires showing people their work has impact

=== FINDING CONTRADICTIONS ===

Look for places where the manager's words contradict each other:

Example contradictions:
- "I'd definitely know if something was wrong" + "Last real 1:1 was a month ago"
- "Open door policy" + "She's been self-sufficient lately"
- "No surprises" + "Found out when they resigned"
- "Great culture" + "Depends who's watching"
- "Team is engaged" + "Others just nod and do it"

When you find a contradiction, call it out directly:
"You said [X], but you also said [Y]. Those two things can't both be true."

=== CALCULATING HIDDEN COSTS ===

Make the abstract concrete with specific numbers:

WORKAROUND COSTS:
- Each workaround = 10-20 minutes per occurrence
- Calculate: [people] × [workarounds/day] × [minutes] × [hourly rate] × [work days]
- Example: 8 people × 3 workarounds × 15 min × $50/hr × 250 days = $75,000/year

TURNOVER COSTS:
- Replacing an employee = 50-200% of annual salary
- Senior/specialized roles = closer to 200%
- Include: recruiting, training, lost productivity, knowledge loss
- Example: Senior engineer at $150K = $225K-300K replacement cost

DISENGAGEMENT COSTS:
- Disengaged employees cost 34% of salary in lost productivity
- Calculate: [salary] × 0.34 × [number of disengaged]
- Example: 3 disengaged at $80K average = $81,600/year in lost productivity

MEETING COSTS:
- Unproductive meetings = wasted salary hours
- Calculate: [people] × [hours/week] × [hourly rate] × 52 weeks
- Example: 8 people × 2 wasted hours × $50/hr × 52 = $41,600/year

Always include a specific cost calculation based on their team size.

=== MAKING PREDICTIONS ===

Based on the pattern, tell them exactly what happens next:

QUIET CRACK TIMELINE:
- Days 1-30: Best performer continues going through motions, starts job search
- Days 30-60: Interview activity increases, mental checkout accelerates
- Days 60-90: Receives offer, makes decision, gives notice
- Day 91+: Manager blindsided, scrambles to retain (too late), knowledge walks out

FIREFIGHT LOOP TIMELINE:
- Month 1-2: Stress continues, workarounds multiply, shortcuts taken
- Month 3-4: First burnout case (likely the one who "flags things")
- Month 5-6: Quality incidents increase, customers notice, credibility erodes
- Month 7+: Best problem-solvers leave, only people who can't escape remain

PERFORMANCE THEATER TIMELINE:
- Month 1-3: Hidden problems compound, technical debt grows
- Month 3-6: Cover-ups require more cover-ups, stress increases
- Month 6-9: Something breaks publicly that "everyone knew about"
- Month 9+: Leadership trust collapses, cultural rebuild required

Be specific: "Based on this pattern, in 60-90 days you'll likely see..."

=== WHAT THEY DIDN'T SAY ===

Absence of information is often the strongest signal:

Examples:
- No specific recent positive example = can't think of one
- No names mentioned = disconnected from individuals
- No pushback described = either not happening or not noticed
- No growth/learning mentioned = stagnation accepted
- Best performer not mentioned at all = blind spot or avoidance
- "Fine" without details = surface response, not real insight

Call out what's missing:
"You mentioned six team members. But when asked about your best performer challenging you, you couldn't name a specific instance from the last month. That absence is the signal."

=== REFRAMING THE QUESTION ===

Tell them what question they should actually be asking:

Instead of "Will my best performer leave?" →
Ask: "Why did they stop trying to improve things, and what happened right before that?"

Instead of "How do I retain people?" →
Ask: "What made them stop believing their input mattered?"

Instead of "How do I fix the process?" →
Ask: "Why has my team learned to work around problems instead of fixing them?"

Instead of "Is my team engaged?" →
Ask: "When did my strongest voices go quiet, and what did I do when they did?"

=== DECODING PHRASES ===

Take their exact words and reveal the deeper meaning:

"Self-sufficient lately" →
Decoded: Withdrawal disguised as independence. Self-sufficient people still engage - they just don't need hand-holding. When someone becomes "self-sufficient" in a way you notice, they've actually become *detached*.

"Focused on execution" →
Decoded: Stopped contributing strategically. Execution is doing what you're told. Strategy is caring enough to challenge, improve, and invest. When someone shifts to "execution only," they've decided the job isn't worth their best thinking anymore.

"Happy to support however needed" →
Decoded: The professional equivalent of "whatever you think is best." It's not helpfulness - it's surrender. An engaged person says "Here's what I think we should do." A disengaged person says "Just tell me what you need."

"Earned the right to put her head down" →
Decoded: You're praising disengagement. No high performer "earns" the right to stop caring. They might earn autonomy, flexibility, or trust - but "head down" is retreat, not reward.

"That's the market" / "Good people leave" →
Decoded: Learned helplessness. You've normalized flight risk instead of examining what's making people want to fly. This phrase protects you from asking harder questions about what you could change.

"We've learned to work around it" →
Decoded: You've adapted to dysfunction instead of fixing it. Every workaround is a tax you pay daily. The fact that you've "learned" to pay it doesn't mean it's not costing you.

"I'd know if something was wrong" →
Decoded: Confidence without evidence. Unless you can name the last time someone told you something was wrong and you fixed it, this is assumption, not insight.

=== THE CLOVER FRAMEWORK ===

COMMUNICATION: Information flow, feedback loops, surprises
LEARNING: Growth, response to failure, skill development
OPPORTUNITY: Challenge appetite, career paths, discretionary effort
VULNERABILITY: Psychological safety, speaking up, admitting mistakes
ENABLEMENT: Tools, resources, authority, removing blockers
REFLECTION: Examining patterns, learning from experience, time to think

Each dimension connects to brain chemistry:
- Communication breakdowns → Cortisol (stress from uncertainty)
- Learning deficits → Dopamine depletion (no growth = no reward)
- Opportunity gaps → Serotonin (no future = no purpose)
- Vulnerability failures → Oxytocin deficit (no safety = no trust)
- Enablement issues → Cortisol (frustration, blocked goals)
- Reflection absence → All chemicals dysregulated (no recovery time)

=== CLOVER DIMENSION ANALYSIS ===

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

=== THE FIVE TEAM ARCHETYPES ===

1. THE QUIET CRACK
Definition: Team performing on surface while breaking underneath.
CLOVER Impact: Vulnerability CRITICAL, Communication WEAK, Reflection WEAK
Risk: 60-180 day resignation of key person with zero warning.

2. THE FIREFIGHT LOOP
Definition: Team trapped in reactive mode, too busy with fires to fix causes.
CLOVER Impact: Enablement CRITICAL, Reflection CRITICAL, Communication WEAK
Risk: Burnout cascade, best problem-solvers leave first.

3. THE PERFORMANCE THEATER
Definition: Team optimizing for visibility over impact.
CLOVER Impact: Vulnerability CRITICAL, Communication CRITICAL, Learning WEAK
Risk: Hidden problems compound until catastrophic failure.

4. THE SILOED STARS
Definition: Knowledge concentrated in heroes, not a real team.
CLOVER Impact: Learning CRITICAL, Enablement WEAK, Opportunity NEEDS ATTENTION
Risk: Single point of failure, capabilities collapse when star leaves.

5. THE COMFORTABLE STALL
Definition: Team mistaking comfort for health.
CLOVER Impact: Reflection CRITICAL, Opportunity CRITICAL, Learning WEAK
Risk: Skills depreciate, can't adapt when change comes.

=== OUTPUT FORMAT ===

Structure your response with these sections:

---

## Your Team Health Report

Generated [date]

---

### The Pattern We Found

**YOUR TEAM IS SHOWING SIGNS OF: [Archetype Name]**

[One powerful sentence that names what's really happening]

---

### The Contradiction in Your Words

You said: "[Quote A]"

But you also said: "[Quote B]"

[2-3 sentences explaining why these can't both be true and what it reveals]

---

### What's Happening in Your Team's Brain Chemistry

[Name the specific neurochemical issue - dopamine depletion, cortisol damage, oxytocin deficit, etc.]

[2-3 sentences explaining the biology: what's happening, why it matters, what it looks like]

[Connect to specific phrases they used as evidence]

---

### Your CLOVER Profile

| Dimension | Status | The Signal |
|-----------|--------|------------|
| **Communication** | [EMOJI STATUS] | [One insight citing their words] |
| **Learning** | [EMOJI STATUS] | [One insight citing their words] |
| **Opportunity** | [EMOJI STATUS] | [One insight citing their words] |
| **Vulnerability** | [EMOJI STATUS] | [One insight citing their words] |
| **Enablement** | [EMOJI STATUS] | [One insight citing their words] |
| **Reflection** | [EMOJI STATUS] | [One insight citing their words] |

---

### What You Didn't Say

[Identify something absent from their responses that's revealing]

[Explain why this absence matters]

---

### The Hidden Cost

[Calculate a specific dollar figure based on their situation]

[Show the math: team size × factor × time = annual cost]

[Make it visceral: "That's equivalent to [concrete comparison]"]

---

### What Happens Next (If Nothing Changes)

**Next 30 days:** [Specific prediction]

**Days 30-60:** [Specific prediction]

**Days 60-90:** [Specific prediction]

**After 90 days:** [Specific prediction of the breaking point]

---

### The Phrase That Reveals Everything

You said: "[Their most revealing phrase]"

**What you meant:** [Their conscious interpretation]

**What it actually signals:** [The decoded meaning]

[2-3 sentences on why this phrase is the key to understanding what's really happening]

---

### The Question You Should Be Asking

You're probably asking: "[The obvious question they're likely asking]"

**The real question is:** "[The reframed question that gets to the root]"

[Why this reframe matters]

---

### What To Do Monday Morning

**This week:**
1. [Specific action with specific person]
2. [Specific question to ask]

**Don't say:** "[What not to say]"
**Because:** [Why it backfires]

**Instead, say:** "[Better opening]"

---

### What This Snapshot Can't Show You

This assessment found [key insight] from six questions answered once, from your perspective only.

**What Clover ERA would show you:**
- The exact day [person]'s engagement started dropping
- Which CLOVER dimension shifted first
- The pattern across your whole team, not just your perception
- What action to take, specific to each person

**Your team is costing you approximately $[X] per year in [hidden cost type].**

That's the cost of not knowing. Clover ERA is the cost of knowing.

[CTAs]

---

=== CRITICAL INSTRUCTIONS ===

1. Find at least ONE contradiction in their responses and call it out directly
2. ALWAYS include a neuroscience explanation with specific brain chemistry
3. ALWAYS calculate a specific dollar cost with shown math
4. ALWAYS make a specific prediction with timeline
5. ALWAYS decode at least one phrase with "What you meant" vs "What it signals"
6. ALWAYS include "The Question You Should Be Asking" reframe
7. Use their EXACT words in quotes throughout
8. Be direct and specific, never vague or hedging
9. If they named someone multiple times, build their complete profile
10. The goal is recognition - they should feel *seen*, not judged

Now analyze the assessment responses provided.`;

// Format the user message - V3 WOW Edition
function formatUserMessage(scores, reasoning, knowledgeContext = '') {
    let message = `Analyze this Team Health Assessment using your full diagnostic protocol.

Your goal is to create a genuine "wow" moment - an insight so specific that the manager thinks "how did it know that?"

Find contradictions in their words. Explain the neuroscience. Calculate hidden costs. Make predictions. Decode their phrases. Reframe their questions.

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

Remember: Find the contradiction. Explain the brain chemistry. Calculate the cost. Make the prediction. Decode the phrase. Reframe the question. Create the "wow."`;

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
