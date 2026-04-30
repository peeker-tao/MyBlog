ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published';

UPDATE posts SET status = 'published' WHERE status IS NULL;
