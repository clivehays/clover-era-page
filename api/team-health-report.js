// API Route: Generate Team Health Assessment Report
// POST /api/team-health-report
// Enhanced with RAG - Retrieves CLOVER Framework context before analysis

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// RAG: Generate embedding for search query
async function generateQueryEmbedding(query) {
    if (process.env.OPENAI_API_KEY) {
        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'text-embedding-ada-002',
                    input: query.slice(0, 8000)
                })
            });

            const data = await response.json();
            if (data.data && data.data[0]) {
                return data.data[0].embedding;
            }
        } catch (error) {
            console.error('Error generating embedding:', error);
        }
    }
    return null;
}

// RAG: Search knowledge base for relevant CLOVER methodology content
async function searchCloverKnowledge(archetype, reasoningText) {
    try {
        // Build search queries based on detected patterns
        const queries = [
            `CLOVER framework ${archetype} team archetype detection patterns`,
            `team health assessment analysis methodology`,
            reasoningText.slice(0, 500) // Use part of their reasoning for semantic match
        ];

        let allResults = [];

        for (const query of queries) {
            const queryEmbedding = await generateQueryEmbedding(query);

            if (queryEmbedding) {
                // Semantic search
                const { data, error } = await supabase.rpc('search_clover_knowledge', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.65,
                    match_count: 3,
                    filter_archetype: archetype !== 'unknown' ? archetype : null
                });

                if (!error && data) {
                    allResults = [...allResults, ...data];
                }
            } else {
                // Fallback to keyword search
                const keywords = query.split(/\s+/).filter(w => w.length > 4).slice(0, 3);
                for (const keyword of keywords) {
                    const { data, error } = await supabase.rpc('search_clover_knowledge_text', {
                        search_query: keyword,
                        match_count: 2,
                        filter_archetype: archetype !== 'unknown' ? archetype : null
                    });

                    if (!error && data) {
                        allResults = [...allResults, ...data];
                    }
                }
            }
        }

        // Deduplicate by id
        const seen = new Set();
        const uniqueResults = allResults.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        }).slice(0, 8); // Limit to top 8 chunks

        return uniqueResults;
    } catch (error) {
        console.error('Error searching CLOVER knowledge:', error);
        return [];
    }
}

// RAG: Build context string from knowledge base results
function buildMethodologyContext(results) {
    if (!results || results.length === 0) {
        return '';
    }

    let context = '\n\n## CLOVER METHODOLOGY CONTEXT (Retrieved from Knowledge Base)\n\n';
    context += 'Apply the following methodology insights from the CLOVER ERA framework:\n\n';

    results.forEach((result, index) => {
        context += `### Insight ${index + 1}`;
        if (result.book_title) {
            context += ` (Source: ${result.book_title}`;
            if (result.chapter) context += `, ${result.chapter}`;
            context += ')';
        }
        context += '\n';

        if (result.clover_dimension && result.clover_dimension !== 'general') {
            context += `**CLOVER Dimension:** ${result.clover_dimension.charAt(0).toUpperCase() + result.clover_dimension.slice(1)}\n`;
        }

        if (result.archetype_relevance && result.archetype_relevance.length > 0) {
            context += `**Relevant Archetypes:** ${result.archetype_relevance.join(', ')}\n`;
        }

        context += `\n${result.content}\n\n---\n\n`;
    });

    context += 'Use this methodology context to inform your analysis. Cite specific framework concepts where applicable.\n';

    return context;
}

// Enhanced System Prompt - Text Analysis Priority
const SYSTEM_PROMPT = `You are an expert organizational psychologist analyzing a Team Health Assessment for Clover ERA. Your role is to surface patterns managers cannot see in their own words.

## YOUR CORE INSIGHT
Managers reveal truth in HOW they describe situations, not just how they score them. A manager scoring 4/4 while describing their best performer in past tense ("she USED TO challenge") has revealed something they don't know they've revealed.

You are NOT a survey scoring tool. You are a diagnostic instrument that reads between the lines.

## ANALYSIS PROTOCOL

### Phase 1: Score Pattern Check
Map scores to archetype detection matrix:
- Quiet Crack: Q2 (1-2) + Q5 (1-2) + Q6 (1-2)
- Firefight Loop: Q1 (1-2) + Q3 (1-2) + Q4 (1-2)
- Performance Theater: Q4 (1) + Q2 (1-2) + political language in reasoning
- Siloed Stars: Q1 (1-2) + Q2 (3-4) + Q5 (2) + "rock star" language
- Comfortable Stall: Q1 (3-4) + Q3 (3-4) + Q5 (2-3) + vague reasoning

### Phase 2: Deep Text Analysis (PRIORITY - THIS IS MOST IMPORTANT)
Analyze ALL reasoning text for:

**Temporal Shifts:**
- Past tense for engagement ("used to", "was", "would")
- Present tense for withdrawal ("these days", "now", "lately")
- Flag any best performer with past-tense engagement

**Reframing Patterns:**
- Withdrawal as independence ("self-sufficient", "head down", "focused on execution")
- Silence as trust ("trusts my judgment", "not the type to rock the boat")
- Compliance as professionalism ("reliable", "no drama", "team player")
- Absence with acceptable excuses

**Named Individual Tracking:**
- If someone is mentioned multiple times, track ALL mentions across responses
- Build profile of that person: behavior changes, absences, passive language
- This is critical - named individuals often reveal the real story

**Contrast Analysis:**
- Active language for some vs passive for others
- "Immediately started brainstorming" vs "happy to support however needed"
- "Real energy" vs "silence or resignation"

**Assumption Language:**
- "She'd tell me if something was off" (assumption, not evidence)
- "I'd know" (confidence without cited signals)
- "Things are fine" / "Everything's good" (vague positivity)

### Phase 3: Override Logic
TEXT ANALYSIS CAN OVERRIDE SCORE-BASED CLASSIFICATION.

If high scores (20+) + linguistic warning signals = Lead with what the text reveals, not the scores.

Example: 23/24 score but best performer shows:
- Past-tense engagement verbs
- Multiple absences mentioned
- Passive language vs others' active language
- "Just wants to focus on shipping" = disengagement signal

Override: Despite high scores, classify as "Early-Stage Quiet Crack" and lead with the hidden signal.

## ARCHETYPE DETECTION SIGNALS

**Quiet Crack:** Past-tense engagement + withdrawal reframed + absences + passive language from best performer + "she'd tell me" assumptions
**Firefight Loop:** Duration markers ("been this way for years") + acceptance ("we've adapted") + escalation futility + workarounds as solutions
**Performance Theater:** "Depends who's watching" + political language + perception focus + different behavior when leadership present
**Siloed Stars:** "Rock stars" / "one or two people" + split engagement + knowledge in individuals + "Ask [person]"
**Comfortable Stall:** Vague positivity + no specific examples + change resistance + high tenure as stability indicator

## OUTPUT FORMAT

You MUST respond with a valid JSON object. No markdown, no explanation, just JSON:

{
    "archetype": "quiet-crack" | "firefight-loop" | "performance-theater" | "siloed-stars" | "comfortable-stall",
    "archetype_display_name": "Quiet Crack" | "Firefight Loop" | "Performance Theater" | "Siloed Stars" | "Comfortable Stall",
    "archetype_subtitle": "One sentence describing what this archetype means for their team",
    "override_applied": true | false,
    "override_reason": "If override applied, explain why text analysis overrode scores" | null,
    "hook": "Opening line that grabs attention - either 'Your scores suggest a healthy team. Your words tell a different story.' for overrides, or archetype-specific opener",
    "scores_summary": {
        "total": number,
        "surface_read": "What a typical survey would conclude from these scores"
    },
    "named_individual": {
        "name": "Name if detected, null otherwise",
        "mentions": number,
        "pattern_detected": "withdrawal_reframed" | "past_tense_engagement" | "passive_participation" | null
    } | null,
    "evidence": {
        "language_shifts": [
            {"past_tense": "exact quote showing past tense", "present_tense": "exact quote showing present", "interpretation": "what this shift reveals"}
        ],
        "reframing_patterns": [
            {"quote": "exact quote", "what_they_think_it_means": "their interpretation", "what_it_actually_means": "the reality"}
        ],
        "absences_mentioned": [
            {"context": "what was missed", "excuse_given": "the rationalization"}
        ],
        "contrast_patterns": [
            {"engaged_description": "how engaged person described", "concerning_description": "how concerning person described"}
        ],
        "decoded_phrase": {
            "phrase": "their most revealing phrase",
            "meaning": "what it actually indicates"
        }
    },
    "manager_belief": "Direct quote from their responses showing what they believe",
    "reality": "2-3 sentences explaining what's actually happening, referencing their specific words",
    "risk": {
        "timeline": "60-90 days" | "90-180 days" | "6-12 months",
        "headline": "One sentence risk statement",
        "consequences": ["Specific consequence 1", "Specific consequence 2", "Specific consequence 3"]
    },
    "what_to_do": {
        "dont_say": "What NOT to say and why",
        "do_say": "What TO say with specific question",
        "key_question": "The one question that matters most"
    },
    "behaviors": ["Observable behavior 1", "Observable behavior 2", "Observable behavior 3", "Observable behavior 4", "Observable behavior 5"]
}

## TONE REQUIREMENTS
- Direct, not defensive - managers took this because they suspect something
- Evidence-based - every claim cites their exact words in quotes
- Specific, not generic - connect to THIS manager's responses
- Use team member's name if provided
- Short paragraphs (2-3 sentences)
- No hedging language ("might", "perhaps", "possibly")
- Empathetic framing: "You missed this because you're a good manager, not a bad one. Trust created the assumption."

## CRITICAL RULES
1. TEXT ANALYSIS TAKES PRIORITY OVER SCORES
2. Every claim must cite their exact words in quotes
3. If a person is named multiple times, build their full profile
4. Never generate a "healthy team" result - everyone suspects something is off
5. Be direct and confident, not hedged
6. Output ONLY valid JSON - no markdown, no explanation`;

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

        // Combine all reasoning text for RAG search
        const allReasoningText = Object.values(reasoning).join(' ');

        // Preliminary archetype guess based on scores (for RAG filtering)
        let preliminaryArchetype = 'unknown';
        if (scores[2] <= 2 && scores[5] <= 2) {
            preliminaryArchetype = 'quiet-crack';
        } else if (scores[3] <= 2 && scores[4] <= 2) {
            preliminaryArchetype = 'firefight-loop';
        } else if (scores[4] === 1) {
            preliminaryArchetype = 'performance-theater';
        } else if (scores[2] >= 3 && scores[5] === 2) {
            preliminaryArchetype = 'siloed-stars';
        } else if (scores[1] >= 3 && scores[3] >= 3) {
            preliminaryArchetype = 'comfortable-stall';
        }

        // RAG: Retrieve relevant CLOVER methodology context
        console.log('Searching CLOVER knowledge base for relevant context...');
        const knowledgeResults = await searchCloverKnowledge(preliminaryArchetype, allReasoningText);
        const methodologyContext = buildMethodologyContext(knowledgeResults);
        console.log(`Retrieved ${knowledgeResults.length} relevant knowledge chunks`);

        // Build the prompt for Claude
        const userPrompt = `Analyze this Team Health Assessment. Focus on linguistic patterns in the reasoning text. If a team member is named multiple times, build a complete profile. Surface what the manager cannot see in their own words.
${methodologyContext}

**Question 1: The Last Surprise** (Communication + Vulnerability)
"Think about the last time a team member's frustration, struggle, or concern caught you off guard. How recently did this happen?"
Score: ${scores[1]}/4
Reasoning: "${reasoning[1]}"

**Question 2: The Quiet One** (Vulnerability + Enablement)
"Picture your most capable team member. When did they last push back on something, challenge a decision, or tell you an idea wouldn't work?"
Score: ${scores[2]}/4
Reasoning: "${reasoning[2]}"

**Question 3: The Broken Process** (Enablement + Reflection)
"What's one thing your team has to work around, tolerate, or just deal with because fixing it isn't up to them?"
Score: ${scores[3]}/4
Reasoning: "${reasoning[3]}"

**Question 4: The Real Conversation** (Communication + Learning)
"When someone on your team makes a mistake or misses a target, what typically happens in the 48 hours that follow?"
Score: ${scores[4]}/4
Reasoning: "${reasoning[4]}"

**Question 5: The Energy Read** (Opportunity + Reflection)
"When you assign new work or propose a new initiative, how does your team typically respond?"
Score: ${scores[5]}/4
Reasoning: "${reasoning[5]}"

**Question 6: The Departure Scenario** (Opportunity + Learning)
"If your strongest performer told you tomorrow they'd been offered another role, how confident are you that you could change their mind?"
Score: ${scores[6]}/4
Reasoning: "${reasoning[6]}"

Total Score: ${totalScore}/24
Manager's name: ${userInfo.firstName}
Company: ${userInfo.companyName || "their company"}
Team size: ${userInfo.teamSize || "unknown"}

Remember: Analyze the REASONING TEXT deeply. Look for past-tense engagement, withdrawal reframing, named individuals, and contrast patterns. Text analysis can override score-based classification.`;

        // Call Claude API
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        });

        // Parse Claude's response
        let reportData;
        try {
            const responseText = message.content[0].text;
            // Clean any potential markdown code blocks
            const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
            reportData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Error parsing Claude response:', parseError);
            console.error('Raw response:', message.content[0].text);
            // Fallback to basic classification
            reportData = fallbackClassification(scores, reasoning, totalScore);
        }

        // Store assessment data in Supabase
        try {
            await supabase.from('team_health_assessments').insert({
                email: userInfo.email.toLowerCase(),
                first_name: userInfo.firstName,
                company_name: userInfo.companyName || null,
                team_size: userInfo.teamSize || null,
                scores: scores,
                reasoning: reasoning,
                archetype: reportData.archetype,
                utm_source: userInfo.utmSource || null,
                utm_medium: userInfo.utmMedium || null,
                utm_campaign: userInfo.utmCampaign || null
            });
        } catch (dbError) {
            console.error('Error storing assessment:', dbError);
            // Don't fail the request if DB storage fails
        }

        // Return the full report
        return res.status(200).json({
            ...reportData,
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

// Fallback classification when Claude API fails
function fallbackClassification(scores, reasoning, totalScore) {
    let archetype = 'quiet-crack';
    let archetype_display_name = 'Quiet Crack';

    // Performance Theater takes precedence when Q4 = 1
    if (scores[4] === 1) {
        archetype = 'performance-theater';
        archetype_display_name = 'Performance Theater';
    }
    // Quiet Crack when both Q2 and Q5 score low
    else if (scores[2] <= 2 && scores[5] <= 2) {
        archetype = 'quiet-crack';
        archetype_display_name = 'Quiet Crack';
    }
    // Firefight Loop when Q3 and Q4 both score low
    else if (scores[3] <= 2 && scores[4] <= 2) {
        archetype = 'firefight-loop';
        archetype_display_name = 'Firefight Loop';
    }
    // Siloed Stars when Q2 is high but Q5 shows split engagement
    else if (scores[2] >= 3 && scores[5] === 2) {
        archetype = 'siloed-stars';
        archetype_display_name = 'Siloed Stars';
    }
    // Comfortable Stall when scores are generally positive
    else if (scores[1] >= 3 && scores[3] >= 3 && scores[5] >= 2 && scores[5] <= 3) {
        archetype = 'comfortable-stall';
        archetype_display_name = 'Comfortable Stall';
    }

    // Archetype definitions for fallback
    const archetypeDefinitions = {
        'quiet-crack': {
            subtitle: 'A team that looks stable on the surface while key people are actively disengaging.',
            risk_timeline: '60-120 days',
            behaviors: [
                'Your strongest people have stopped suggesting improvements',
                'Meetings have gotten shorter because fewer people contribute',
                '"Sounds good" has become the default response to new initiatives',
                'One-on-ones feel productive but surface-level',
                "You're the last to know when someone's struggling"
            ]
        },
        'firefight-loop': {
            subtitle: 'A team trapped in constant reaction mode, where urgency has replaced strategy.',
            risk_timeline: '90-180 days',
            behaviors: [
                '"We\'ll fix it properly next time" has been said for months',
                'The same problems keep recurring in slightly different forms',
                'Strategic projects never get traction because something urgent always takes priority',
                'The team is tired in a way that weekends don\'t fix',
                'New hires either adapt to chaos quickly or leave within six months'
            ]
        },
        'performance-theater': {
            subtitle: 'A team where looking good has become more important than being good.',
            risk_timeline: '6-12 months',
            behaviors: [
                'Bad news reaches you late, reframed, or not at all',
                'The team presents polished updates but gets defensive when you probe',
                'Mistakes trigger blame-shifting rather than problem-solving',
                'People optimize for visibility, not impact',
                "There's a notable difference between how people talk in meetings vs. private conversations"
            ]
        },
        'siloed-stars': {
            subtitle: 'A team over-reliant on a few key individuals while others fade into the background.',
            risk_timeline: '60-90 days',
            behaviors: [
                'The same 2-3 people answer every question in meetings',
                'Knowledge exists only in individuals, not systems',
                '"Ask [person]" is the answer to most questions',
                'Vacation coverage is panic mode',
                'Some people could disappear for a week without anyone noticing'
            ]
        },
        'comfortable-stall': {
            subtitle: 'A team that has settled into mediocrity, mistaking comfort for health.',
            risk_timeline: '6-12 months',
            behaviors: [
                'Responses to new ideas: "we tried that once" or "that\'s not how we do things"',
                'Professional development is box-checking, not genuine interest',
                'Team rituals (meetings, processes) continue without examination',
                '"We\'ve always done it this way" is an acceptable answer',
                'Average tenure is high, but average ambition is low'
            ]
        }
    };

    const def = archetypeDefinitions[archetype];

    return {
        archetype: archetype,
        archetype_display_name: archetype_display_name,
        archetype_subtitle: def.subtitle,
        override_applied: false,
        override_reason: null,
        hook: `Based on your responses, your team is showing signs of ${archetype_display_name}.`,
        scores_summary: {
            total: totalScore,
            surface_read: totalScore >= 18 ? 'Above average team health' : totalScore >= 12 ? 'Mixed signals' : 'Areas of concern'
        },
        named_individual: null,
        evidence: {
            language_shifts: [],
            reframing_patterns: [],
            absences_mentioned: [],
            contrast_patterns: [],
            decoded_phrase: null
        },
        manager_belief: null,
        reality: `Your team is exhibiting patterns consistent with ${archetype_display_name}. ${def.subtitle}`,
        risk: {
            timeline: def.risk_timeline,
            headline: `Without intervention, this pattern typically escalates within ${def.risk_timeline}.`,
            consequences: ['Key talent departure', 'Declining team performance', 'Increased management burden']
        },
        what_to_do: {
            dont_say: "Avoid generic check-ins that don't create space for honest feedback.",
            do_say: "Create specific opportunities for team members to share concerns safely.",
            key_question: "What's one thing you've stopped raising because you figured it wouldn't change?"
        },
        behaviors: def.behaviors
    };
}
