/**
 * SQLite Database Adapter
 * Implementation of DatabaseAdapter for SQLite using better-sqlite3
 */

import Database from 'better-sqlite3';
import { DatabaseAdapter, DatabaseConfig, DatabaseError, QueryResult } from './adapter';
import * as path from 'path';
import * as fs from 'fs';

export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;
  private isConnectedFlag: boolean = false;
  private lastInsertId: number = 0;
  private affectedRows: number = 0;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Connect to SQLite database
   */
  async connect(): Promise<void> {
    try {
      // Ensure database directory exists
      if (this.config.path) {
        const dbDir = path.dirname(this.config.path);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
      }

      this.db = new Database(this.config.path || './data/inventory.db');

      // Enable foreign key constraints
      this.db.pragma('foreign_keys = ON');

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');
      
      // Set synchronous mode for better performance
      this.db.pragma('synchronous = NORMAL');
      
      // Set cache size
      this.db.pragma('cache_size = 10000');
      
      // Set temp store to memory
      this.db.pragma('temp_store = MEMORY');

      this.isConnectedFlag = true;
      console.log('✅ Connected to SQLite database');

    } catch (error) {
      throw new DatabaseError(`Connection error: ${error}`);
    }
  }

  /**
   * Execute a query and return results
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }

    try {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params) as T[];
      return rows;
    } catch (err: any) {
      throw new DatabaseError(`Query failed: ${err.message}`, err.code, sql, params);
    }
  }

  /**
   * Execute a single query and return the first result
   */
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }

    try {
      const stmt = this.db.prepare(sql);
      const row = stmt.get(...params) as T | undefined;
      return row || null;
    } catch (err: any) {
      throw new DatabaseError(`Query failed: ${err.message}`, err.code, sql, params);
    }
  }

  /**
   * Execute a query that doesn't return data
   */
  async execute(sql: string, params: any[] = []): Promise<{ lastInsertId?: number; changes: number }> {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);
      
      this.lastInsertId = result.lastInsertRowid as number;
      this.affectedRows = result.changes;
      
      return {
        lastInsertId: this.lastInsertId,
        changes: this.affectedRows
      };
    } catch (err: any) {
      throw new DatabaseError(`Execute failed: ${err.message}`, err.code, sql, params);
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }

    const transaction = this.db.transaction(() => {
      return callback();
    });

    try {
      return await transaction();
    } catch (error) {
      throw new DatabaseError(`Transaction failed: ${error}`);
    }
  }

  /**
   * Run database migrations
   */
  async migrate(): Promise<void> {
    console.log('🔄 Running SQLite migrations...');
    
    try {
      // Check if migrations table exists
      const migrationsTableExists = await this.queryOne(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
      );

      if (!migrationsTableExists) {
        console.log('📋 Creating migrations table...');
        await this.execute(`
          CREATE TABLE migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            checksum TEXT
          )
        `);
      }

      // Get applied migrations
      const appliedMigrations = await this.query<{ version: string }>(
        'SELECT version FROM migrations ORDER BY version'
      );
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));

      // Get migration files
      const migrationsDir = path.join(__dirname, '../../database/migrations');
      
      if (!fs.existsSync(migrationsDir)) {
        console.log('⚠️  No migrations directory found');
        return;
      }

      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      let appliedCount = 0;

      for (const file of migrationFiles) {
        const version = file.split('_')[0];
        
        if (appliedVersions.has(version)) {
          console.log(`⏭️  Skipping ${file} (already applied)`);
          continue;
        }

        console.log(`🔄 Applying migration: ${file}`);
        
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          await this.executeRaw(migrationSQL);
          appliedCount++;
          console.log(`✅ Applied migration: ${file}`);
        } catch (error) {
          console.error(`❌ Failed to apply migration ${file}:`, error);
          throw error;
        }
      }

      console.log(`✅ Migration completed. Applied ${appliedCount} migrations.`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw new DatabaseError(`Migration failed: ${error}`);
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      this.db.close();
      this.isConnectedFlag = false;
      this.db = null;
      console.log('✅ Database connection closed');
    } catch (error) {
      throw new DatabaseError(`Failed to close database: ${error}`);
    }
  }

  /**
   * Get database connection info
   */
  getConnectionInfo(): { type: string; version: string; path?: string } {
    return {
      type: 'sqlite',
      version: '3.x',
      path: this.config.path
    };
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.isConnectedFlag && this.db !== null;
  }

  /**
   * Execute raw SQL (for migrations, etc.)
   */
  async executeRaw(sql: string): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }

    try {
      this.db.exec(sql);
    } catch (err: any) {
      throw new DatabaseError(`Raw SQL execution failed: ${err.message}`, err.code, sql);
    }
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<void> {
    await this.execute('BEGIN TRANSACTION');
  }

  /**
   * Commit a transaction
   */
  async commit(): Promise<void> {
    await this.execute('COMMIT');
  }

  /**
   * Rollback a transaction
   */
  async rollback(): Promise<void> {
    await this.execute('ROLLBACK');
  }

  /**
   * Get last insert ID
   */
  getLastInsertId(): number {
    return this.lastInsertId;
  }

  /**
   * Get number of affected rows
   */
  getAffectedRows(): number {
    return this.affectedRows;
  }

  /**
   * Backup database to file
   */
  async backup(backupPath: string): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }

    try {
      const sourcePath = this.config.path || './data/inventory.db';
      
      // Create backup directory if it doesn't exist
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Copy database file
      fs.copyFileSync(sourcePath, backupPath);
      console.log(`✅ Database backed up to: ${backupPath}`);
    } catch (error) {
      throw new DatabaseError(`Backup failed: ${error}`);
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    tables: number;
    totalSize: number;
    recordCounts: { [table: string]: number };
  }> {
    const tables = await this.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    const recordCounts: { [table: string]: number } = {};
    
    for (const table of tables) {
      const result = await this.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${table.name}`);
      recordCounts[table.name] = result?.count || 0;
    }

    // Get database file size
    const dbPath = this.config.path || './data/inventory.db';
    const stats = fs.statSync(dbPath);
    const totalSize = stats.size;

    return {
      tables: tables.length,
      totalSize,
      recordCounts
    };
  }

  /**
   * Optimize database (VACUUM, ANALYZE)
   */
  async optimize(): Promise<void> {
    console.log('🔧 Optimizing database...');
    
    try {
      await this.execute('VACUUM');
      await this.execute('ANALYZE');
      console.log('✅ Database optimized');
    } catch (error) {
      throw new DatabaseError(`Optimization failed: ${error}`);
    }
  }

  /**
   * Check database integrity
   */
  async checkIntegrity(): Promise<boolean> {
    const result = await this.queryOne<{ integrity_check: string }>('PRAGMA integrity_check');
    return result?.integrity_check === 'ok';
  }
}
