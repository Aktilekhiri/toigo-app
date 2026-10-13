-- Chakyr database (Cloudflare D1). Already applied to chakyr-db; keep for re-creating.
CREATE TABLE IF NOT EXISTS invitations (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, key_hash TEXT NOT NULL, data TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rsvps (id INTEGER PRIMARY KEY AUTOINCREMENT, invitation_id INTEGER NOT NULL, name TEXT NOT NULL, attending INTEGER NOT NULL, guests INTEGER NOT NULL DEFAULT 1, note TEXT, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_rsvps_inv ON rsvps(invitation_id);
CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, invitation_id INTEGER, mime TEXT NOT NULL, bytes BLOB NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_photos_inv ON photos(invitation_id);
CREATE TABLE IF NOT EXISTS rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, reset_at INTEGER NOT NULL);
-- v2: personal guest links
CREATE TABLE IF NOT EXISTS guests (id INTEGER PRIMARY KEY AUTOINCREMENT, invitation_id INTEGER NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, opens INTEGER NOT NULL DEFAULT 0, opened_at INTEGER, created_at INTEGER NOT NULL, UNIQUE(invitation_id, code));
CREATE INDEX IF NOT EXISTS idx_guests_inv ON guests(invitation_id);
ALTER TABLE rsvps ADD COLUMN guest_id INTEGER;
ALTER TABLE guests ADD COLUMN seat TEXT;
