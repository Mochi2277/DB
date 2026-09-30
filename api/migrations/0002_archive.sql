CREATE TABLE IF NOT EXISTS progress_archive (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 exam TEXT NOT NULL,
 payload TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY (user_id,exam)
);
