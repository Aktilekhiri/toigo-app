// Minimal Cloudflare D1 stand-in on node:sqlite, for tests only.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";

class Stmt {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...a) { return new Stmt(this.db, this.sql, a.map(v => (v === undefined ? null : v))); }
  async first() { return this.db.prepare(this.sql).get(...this.args) ?? null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
  async run() { const r = this.db.prepare(this.sql).run(...this.args); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; }
}
export function makeDB() {
  const db = new DatabaseSync(":memory:");
  db.exec(fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  return { prepare: sql => new Stmt(db, sql), batch: async list => Promise.all(list.map(s => s.run())), _db: db };
}
