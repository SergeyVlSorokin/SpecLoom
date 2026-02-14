import Database from 'better-sqlite3';
import { SpecNode, NodeType } from '../../core/domain/SpecNode.js';

export class GraphDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS links (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relation_type TEXT NOT NULL,
        PRIMARY KEY (source_id, target_id, relation_type)
      );
    `);
  }

  public upsertNode(node: SpecNode) {
    const stmt = this.db.prepare(`
      INSERT INTO nodes (id, type, content, hash)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        content = excluded.content,
        hash = excluded.hash
    `);
    stmt.run(node.id, node.type, JSON.stringify(node.content), node.hash);
  }

  public getNode(id: string): SpecNode | undefined {
    const stmt = this.db.prepare('SELECT * FROM nodes WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return new SpecNode(row.id, row.type as NodeType, JSON.parse(row.content));
  }

  public addLink(sourceId: string, targetId: string, relationType: string) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO links (source_id, target_id, relation_type)
      VALUES (?, ?, ?)
    `);
    stmt.run(sourceId, targetId, relationType);
  }

  public getTraceTargets(id: string): string[] {
    const stmt = this.db.prepare('SELECT target_id FROM links WHERE source_id = ?');
    return stmt.all(id).map((row: any) => row.target_id);
  }

  public getTraceSources(id: string): string[] {
    const stmt = this.db.prepare('SELECT source_id FROM links WHERE target_id = ?');
    return stmt.all(id).map((row: any) => row.source_id);
  }

  public getAllNodeIds(): string[] {
    const stmt = this.db.prepare('SELECT id FROM nodes');
    return stmt.all().map((row: any) => row.id);
  }

  public getAllNodes(): SpecNode[] {
    const stmt = this.db.prepare('SELECT * FROM nodes');
    const rows = stmt.all() as any[];
    return rows.map(row => new SpecNode(row.id, row.type as NodeType, JSON.parse(row.content)));
  }

  public getNodeCountsByType(): Record<string, number> {
    const stmt = this.db.prepare('SELECT type, COUNT(*) as count FROM nodes GROUP BY type');
    const rows = stmt.all() as { type: string; count: number }[];
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.type] = row.count;
    }
    return counts;
  }

  public deleteNodesByType(type: string) {
    const stmt = this.db.prepare('DELETE FROM nodes WHERE type = ?');
    stmt.run(type);
  }

  public getTaskStatusCounts(): Record<string, number> {
    // We need to parse the JSON content to get the status field.
    // SQLite's JSON support (json_extract) would be ideal, but for better-sqlite3 without extensions, 
    // we might have to do it in JS if the volume is low, or assume strict structure.
    // However, better-sqlite3 usually compiles with json1 extension by default.
    try {
      const stmt = this.db.prepare("SELECT json_extract(content, '$.status') as status, COUNT(*) as count FROM nodes WHERE type = 'execution_task' GROUP BY status");
      const rows = stmt.all() as { status: string; count: number }[];
      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[row.status || 'Pending'] = row.count;
      }
      return counts;
    } catch (e) {
      // Fallback if json_extract fails
      const stmt = this.db.prepare("SELECT content FROM nodes WHERE type = 'execution_task'");
      const rows = stmt.all() as { content: string }[];
      const counts: Record<string, number> = {};
      for (const row of rows) {
        const content = JSON.parse(row.content);
        const status = content.status || 'Pending';
        counts[status] = (counts[status] || 0) + 1;
      }
      return counts;
    }
  }

  public removeLinksBySource(sourceId: string) {
    const stmt = this.db.prepare('DELETE FROM links WHERE source_id = ?');
    stmt.run(sourceId);
  }

  public getAllLinks(): { source_id: string; target_id: string; relation_type: string }[] {
    const stmt = this.db.prepare('SELECT * FROM links');
    return stmt.all() as any;
  }

  public close() {
    this.db.close();
  }
}
