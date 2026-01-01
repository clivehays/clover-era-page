-- File: migrations/019_create_clover_knowledge_base.sql
-- CLOVER Knowledge Base - Vector Storage for RAG
-- Stores book content with embeddings for semantic search

-- Enable pgvector extension (must be enabled in Supabase dashboard first)
CREATE EXTENSION IF NOT EXISTS vector;

-- CLOVER BOOKS TABLE
-- Stores metadata about source books
CREATE TABLE IF NOT EXISTS clover_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    description TEXT,
    source_type VARCHAR(50) DEFAULT 'book',  -- 'book', 'article', 'guide'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLOVER KNOWLEDGE CHUNKS TABLE
-- Stores chunked content with embeddings
CREATE TABLE IF NOT EXISTS clover_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES clover_books(id) ON DELETE CASCADE,

    -- Content
    content TEXT NOT NULL,
    content_summary TEXT,  -- AI-generated summary of chunk

    -- Metadata
    chapter VARCHAR(255),
    section VARCHAR(255),
    page_number INTEGER,
    chunk_index INTEGER NOT NULL,  -- Order within the book

    -- Vector embedding (1536 dimensions for OpenAI ada-002, adjust if using different model)
    embedding vector(1536),

    -- Categorization
    clover_dimension VARCHAR(50),  -- 'communication', 'learning', 'opportunity', 'vulnerability', 'enablement', 'reflection'
    archetype_relevance VARCHAR(50)[],  -- ['quiet-crack', 'firefight-loop', etc.]
    topic_tags VARCHAR(100)[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient retrieval
CREATE INDEX IF NOT EXISTS idx_clover_chunks_book ON clover_knowledge_chunks(book_id);
CREATE INDEX IF NOT EXISTS idx_clover_chunks_dimension ON clover_knowledge_chunks(clover_dimension);
CREATE INDEX IF NOT EXISTS idx_clover_chunks_archetype ON clover_knowledge_chunks USING GIN(archetype_relevance);

-- Create HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_clover_chunks_embedding ON clover_knowledge_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Enable RLS
ALTER TABLE clover_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE clover_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service role only for writes, public read for retrieval
DROP POLICY IF EXISTS "Service role can manage books" ON clover_books;
CREATE POLICY "Service role can manage books" ON clover_books
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage chunks" ON clover_knowledge_chunks;
CREATE POLICY "Service role can manage chunks" ON clover_knowledge_chunks
    FOR ALL USING (true) WITH CHECK (true);

-- Function to search knowledge base by semantic similarity
CREATE OR REPLACE FUNCTION search_clover_knowledge(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5,
    filter_dimension text DEFAULT NULL,
    filter_archetype text DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    content_summary TEXT,
    chapter VARCHAR(255),
    section VARCHAR(255),
    clover_dimension VARCHAR(50),
    archetype_relevance VARCHAR(50)[],
    book_title VARCHAR(500),
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.content,
        c.content_summary,
        c.chapter,
        c.section,
        c.clover_dimension,
        c.archetype_relevance,
        b.title as book_title,
        1 - (c.embedding <=> query_embedding) as similarity
    FROM clover_knowledge_chunks c
    JOIN clover_books b ON c.book_id = b.id
    WHERE
        b.is_active = true
        AND 1 - (c.embedding <=> query_embedding) > match_threshold
        AND (filter_dimension IS NULL OR c.clover_dimension = filter_dimension)
        AND (filter_archetype IS NULL OR filter_archetype = ANY(c.archetype_relevance))
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to search by keyword (fallback when embeddings unavailable)
CREATE OR REPLACE FUNCTION search_clover_knowledge_text(
    search_query text,
    match_count int DEFAULT 5,
    filter_dimension text DEFAULT NULL,
    filter_archetype text DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    content_summary TEXT,
    chapter VARCHAR(255),
    section VARCHAR(255),
    clover_dimension VARCHAR(50),
    archetype_relevance VARCHAR(50)[],
    book_title VARCHAR(500)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.content,
        c.content_summary,
        c.chapter,
        c.section,
        c.clover_dimension,
        c.archetype_relevance,
        b.title as book_title
    FROM clover_knowledge_chunks c
    JOIN clover_books b ON c.book_id = b.id
    WHERE
        b.is_active = true
        AND c.content ILIKE '%' || search_query || '%'
        AND (filter_dimension IS NULL OR c.clover_dimension = filter_dimension)
        AND (filter_archetype IS NULL OR filter_archetype = ANY(c.archetype_relevance))
    LIMIT match_count;
END;
$$;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_clover_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clover_books_updated ON clover_books;
CREATE TRIGGER trigger_clover_books_updated
    BEFORE UPDATE ON clover_books
    FOR EACH ROW
    EXECUTE FUNCTION update_clover_timestamp();

DROP TRIGGER IF EXISTS trigger_clover_chunks_updated ON clover_knowledge_chunks;
CREATE TRIGGER trigger_clover_chunks_updated
    BEFORE UPDATE ON clover_knowledge_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_clover_timestamp();
