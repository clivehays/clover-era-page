// API Route: Search CLOVER Knowledge Base
// POST /api/clover-knowledge-search
// Retrieves relevant methodology context for RAG

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Generate embedding for search query
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

// Semantic search using embeddings
async function semanticSearch(queryEmbedding, options = {}) {
    const {
        matchCount = 5,
        matchThreshold = 0.7,
        filterDimension = null,
        filterArchetype = null
    } = options;

    const { data, error } = await supabase.rpc('search_clover_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_dimension: filterDimension,
        filter_archetype: filterArchetype
    });

    if (error) {
        console.error('Semantic search error:', error);
        return [];
    }

    return data || [];
}

// Keyword-based fallback search
async function keywordSearch(query, options = {}) {
    const {
        matchCount = 5,
        filterDimension = null,
        filterArchetype = null
    } = options;

    // Extract key terms from query
    const terms = query.toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 3)
        .slice(0, 5);

    let allResults = [];

    for (const term of terms) {
        const { data, error } = await supabase.rpc('search_clover_knowledge_text', {
            search_query: term,
            match_count: matchCount,
            filter_dimension: filterDimension,
            filter_archetype: filterArchetype
        });

        if (!error && data) {
            allResults = [...allResults, ...data];
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

// Main search function that combines strategies
async function searchKnowledgeBase(query, options = {}) {
    // Try semantic search first
    const queryEmbedding = await generateQueryEmbedding(query);

    if (queryEmbedding) {
        const semanticResults = await semanticSearch(queryEmbedding, options);
        if (semanticResults.length > 0) {
            return {
                method: 'semantic',
                results: semanticResults
            };
        }
    }

    // Fall back to keyword search
    const keywordResults = await keywordSearch(query, options);
    return {
        method: 'keyword',
        results: keywordResults
    };
}

// Build context string from search results
function buildContextString(results) {
    if (!results || results.length === 0) {
        return null;
    }

    let context = '## CLOVER Framework Methodology Context\n\n';
    context += 'The following excerpts from the CLOVER ERA methodology are relevant to this analysis:\n\n';

    results.forEach((result, index) => {
        context += `### Source ${index + 1}`;
        if (result.book_title) {
            context += ` (${result.book_title}`;
            if (result.chapter) context += `, ${result.chapter}`;
            context += ')';
        }
        context += '\n';

        if (result.clover_dimension && result.clover_dimension !== 'general') {
            context += `**CLOVER Dimension:** ${result.clover_dimension.charAt(0).toUpperCase() + result.clover_dimension.slice(1)}\n`;
        }

        if (result.content_summary) {
            context += `**Summary:** ${result.content_summary}\n`;
        }

        context += `\n${result.content}\n\n`;
        context += '---\n\n';
    });

    return context;
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
        const {
            query,
            queries,  // Array of queries for multi-search
            matchCount = 5,
            matchThreshold = 0.7,
            filterDimension = null,
            filterArchetype = null,
            returnFormat = 'context'  // 'context' | 'raw'
        } = req.body;

        // Handle multiple queries
        if (queries && Array.isArray(queries)) {
            const allResults = [];

            for (const q of queries) {
                const searchResult = await searchKnowledgeBase(q, {
                    matchCount: Math.ceil(matchCount / queries.length),
                    matchThreshold,
                    filterDimension,
                    filterArchetype
                });
                allResults.push(...searchResult.results);
            }

            // Deduplicate
            const seen = new Set();
            const uniqueResults = allResults.filter(item => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            }).slice(0, matchCount);

            if (returnFormat === 'context') {
                return res.status(200).json({
                    context: buildContextString(uniqueResults),
                    resultCount: uniqueResults.length,
                    method: 'multi-query'
                });
            }

            return res.status(200).json({
                results: uniqueResults,
                method: 'multi-query'
            });
        }

        // Handle single query
        if (!query) {
            return res.status(400).json({ error: 'query or queries parameter is required' });
        }

        const searchResult = await searchKnowledgeBase(query, {
            matchCount,
            matchThreshold,
            filterDimension,
            filterArchetype
        });

        if (returnFormat === 'context') {
            return res.status(200).json({
                context: buildContextString(searchResult.results),
                resultCount: searchResult.results.length,
                method: searchResult.method
            });
        }

        return res.status(200).json({
            results: searchResult.results,
            method: searchResult.method
        });

    } catch (error) {
        console.error('Knowledge search error:', error);
        return res.status(500).json({ error: 'Failed to search knowledge base' });
    }
}

// Export helper for use by other API routes
export { searchKnowledgeBase, buildContextString };
