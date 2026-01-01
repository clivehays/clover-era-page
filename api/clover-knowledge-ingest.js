// API Route: Ingest CLOVER Framework Content
// POST /api/clover-knowledge-ingest
// Protected endpoint for uploading and processing book content

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

// Dynamic import for Anthropic to avoid module load issues
async function getAnthropic() {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    return new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
}

// Chunk size configuration
const CHUNK_SIZE = 1500;  // Characters per chunk
const CHUNK_OVERLAP = 200;  // Overlap between chunks for context continuity

// Split content into overlapping chunks
function chunkContent(content, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    const chunks = [];
    let start = 0;

    while (start < content.length) {
        let end = start + chunkSize;

        // Try to find a natural break point (paragraph or sentence)
        if (end < content.length) {
            // Look for paragraph break
            const paragraphBreak = content.lastIndexOf('\n\n', end);
            if (paragraphBreak > start + chunkSize / 2) {
                end = paragraphBreak;
            } else {
                // Look for sentence break
                const sentenceBreak = content.lastIndexOf('. ', end);
                if (sentenceBreak > start + chunkSize / 2) {
                    end = sentenceBreak + 1;
                }
            }
        }

        chunks.push({
            content: content.slice(start, end).trim(),
            startIndex: start,
            endIndex: end
        });

        start = end - overlap;
        if (start < 0) start = 0;
        if (start >= content.length) break;
    }

    return chunks;
}

// Generate embedding using Anthropic (via a small model call to extract semantic meaning)
// Note: Anthropic doesn't have a direct embedding API, so we use OpenAI-compatible embeddings
// For production, you'd use OpenAI's ada-002 or similar
async function generateEmbedding(text) {
    // If you have OPENAI_API_KEY set, use OpenAI embeddings
    if (process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: text.slice(0, 8000)  // Limit input size
            })
        });

        const data = await response.json();
        if (data.data && data.data[0]) {
            return data.data[0].embedding;
        }
    }

    // Fallback: Return null if no embedding API available
    // The system will use text-based search instead
    return null;
}

// Use Claude to categorize content and generate summary
async function analyzeChunk(content) {
    const prompt = `Analyze this content from the CLOVER Framework methodology and provide:
1. A 1-2 sentence summary
2. Which CLOVER dimension(s) it relates to (Communication, Learning, Opportunity, Vulnerability, Enablement, Reflection)
3. Which team archetypes it's most relevant to (quiet-crack, firefight-loop, performance-theater, siloed-stars, comfortable-stall)
4. 2-4 topic tags

Content:
"""
${content.slice(0, 3000)}
"""

Respond in JSON format:
{
    "summary": "...",
    "primary_dimension": "communication|learning|opportunity|vulnerability|enablement|reflection|general",
    "archetype_relevance": ["quiet-crack", ...],
    "topic_tags": ["...", "..."]
}`;

    try {
        const anthropic = await getAnthropic();
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }]
        });

        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (error) {
        console.error('Error analyzing chunk:', error);
    }

    return {
        summary: null,
        primary_dimension: 'general',
        archetype_relevance: [],
        topic_tags: []
    };
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if ADMIN_API_KEY is configured
    if (!process.env.ADMIN_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: ADMIN_API_KEY not set in environment variables' });
    }

    // Basic auth check - in production, use proper authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized - invalid API key' });
    }

    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Supabase not configured' });
    }

    try {
        const { action, bookData, content, bookId, chapter, section, pageStart } = req.body;

        // Action: Create a new book entry
        if (action === 'create_book') {
            const { title, author, description, source_type } = bookData;

            const { data, error } = await getSupabase()
                .from('clover_books')
                .insert({
                    title,
                    author,
                    description,
                    source_type: source_type || 'book'
                })
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json({
                success: true,
                book: data,
                message: `Book "${title}" created. Use the book ID to add content.`
            });
        }

        // Action: Add content to a book (chunked automatically)
        if (action === 'add_content') {
            if (!bookId || !content) {
                return res.status(400).json({ error: 'bookId and content are required' });
            }

            // Verify book exists
            const { data: book, error: bookError } = await getSupabase()
                .from('clover_books')
                .select('id, title')
                .eq('id', bookId)
                .single();

            if (bookError || !book) {
                return res.status(404).json({ error: 'Book not found' });
            }

            // Get current max chunk index for this book
            const { data: existingChunks } = await getSupabase()
                .from('clover_knowledge_chunks')
                .select('chunk_index')
                .eq('book_id', bookId)
                .order('chunk_index', { ascending: false })
                .limit(1);

            let startIndex = existingChunks && existingChunks.length > 0
                ? existingChunks[0].chunk_index + 1
                : 0;

            // Chunk the content
            const chunks = chunkContent(content);
            const results = [];

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];

                // Analyze chunk for metadata
                const analysis = await analyzeChunk(chunk.content);

                // Generate embedding
                const embedding = await generateEmbedding(chunk.content);

                // Calculate approximate page number
                const approxPage = pageStart
                    ? pageStart + Math.floor(chunk.startIndex / 2000)
                    : null;

                // Insert chunk
                const { data, error } = await getSupabase()
                    .from('clover_knowledge_chunks')
                    .insert({
                        book_id: bookId,
                        content: chunk.content,
                        content_summary: analysis.summary,
                        chapter: chapter || null,
                        section: section || null,
                        page_number: approxPage,
                        chunk_index: startIndex + i,
                        embedding: embedding,
                        clover_dimension: analysis.primary_dimension,
                        archetype_relevance: analysis.archetype_relevance,
                        topic_tags: analysis.topic_tags
                    })
                    .select('id')
                    .single();

                if (error) {
                    console.error('Error inserting chunk:', error);
                    results.push({ index: i, error: error.message });
                } else {
                    results.push({ index: i, id: data.id, success: true });
                }
            }

            const successCount = results.filter(r => r.success).length;

            return res.status(200).json({
                success: true,
                book: book.title,
                chunksCreated: successCount,
                totalChunks: chunks.length,
                results: results
            });
        }

        // Action: List all books
        if (action === 'list_books') {
            const { data, error } = await getSupabase()
                .from('clover_books')
                .select(`
                    id,
                    title,
                    author,
                    description,
                    source_type,
                    is_active,
                    created_at,
                    clover_knowledge_chunks(count)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                // Check if the table doesn't exist
                if (error.message.includes('does not exist') || error.code === '42P01') {
                    return res.status(500).json({
                        error: 'Database tables not found. Please run the migration (019_create_clover_knowledge_base.sql) in Supabase SQL Editor first.',
                        details: error.message
                    });
                }
                throw error;
            }

            return res.status(200).json({ books: data || [] });
        }

        // Action: Get book details with chunk count
        if (action === 'get_book') {
            if (!bookId) {
                return res.status(400).json({ error: 'bookId is required' });
            }

            const { data: book, error: bookError } = await getSupabase()
                .from('clover_books')
                .select('*')
                .eq('id', bookId)
                .single();

            if (bookError || !book) {
                return res.status(404).json({ error: 'Book not found' });
            }

            const { count } = await getSupabase()
                .from('clover_knowledge_chunks')
                .select('*', { count: 'exact', head: true })
                .eq('book_id', bookId);

            return res.status(200).json({
                book: {
                    ...book,
                    chunk_count: count
                }
            });
        }

        // Action: Delete a book and all its chunks
        if (action === 'delete_book') {
            if (!bookId) {
                return res.status(400).json({ error: 'bookId is required' });
            }

            const { error } = await getSupabase()
                .from('clover_books')
                .delete()
                .eq('id', bookId);

            if (error) throw error;

            return res.status(200).json({
                success: true,
                message: 'Book and all associated content deleted'
            });
        }

        return res.status(400).json({ error: 'Invalid action. Use: create_book, add_content, list_books, get_book, delete_book' });

    } catch (error) {
        console.error('Knowledge ingest error:', error);
        return res.status(500).json({ error: 'Failed to process request', details: error.message });
    }
}
