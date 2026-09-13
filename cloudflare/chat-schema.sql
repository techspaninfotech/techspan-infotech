-- Run once in the NEW techspan-chat D1 database Console.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS conversations (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
 phone TEXT NOT NULL, token_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL, last_activity INTEGER NOT NULL,
 admin_read_id INTEGER NOT NULL DEFAULT -1
);
CREATE TABLE IF NOT EXISTS messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 sender TEXT NOT NULL CHECK(sender IN ('guest','admin')),
 body TEXT NOT NULL, created_at INTEGER NOT NULL, client_id TEXT NOT NULL,
 UNIQUE(conversation_id, sender, client_id)
);
CREATE INDEX IF NOT EXISTS messages_thread ON messages(conversation_id,id);
CREATE INDEX IF NOT EXISTS conversations_activity ON conversations(last_activity);
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (
 key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_meta (
 key TEXT PRIMARY KEY, value INTEGER NOT NULL
);

