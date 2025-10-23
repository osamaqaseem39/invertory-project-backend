/**
 * SQLite Database Adapter
 * Implementation of DatabaseAdapter for SQLite
 */

import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { DatabaseAdapter, DatabaseConfig, DatabaseError, QueryResult } from './adapter';
import * as path from 'path';
import * as fs from 'fs';

export class SQLiteAdapter implements DatabaseAdapter {
  private db: sqlite3.Database | null = null;
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
    return new Promise((resolve, reject) => {
      try {
        // Ensure database directory exists
        if (this.config.path) {
          const dbDir = path.dirname(this.config.path);
          if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
          }
        }

        this.db = new sqlite3.Database(
          this.config.path || './data/inventory.db',
          (err) => {
            if (err) {
              reject(new DatabaseError(`Failed to connect to SQLite: ${err.message}`));
              return;
            }

            // Enable foreign key constraints
            this.db!.exec('PRAGMA foreign_keys = ON', (err) => {
              if (err) {
                reject(new DatabaseError(`Failed to enable foreign keys: ${err.message}`));
                return;
              }

              this.isConnectedFlag = true;
              console.log('✅ Connected to SQLite database');
              resolve();
            });
          }
        );

        // Enable WAL mode for better concurrency
        this.db.exec('PRAGMA journal_mode = WAL');
        
        // Set synchronous mode for better performance
        this.db.exec('PRAGMA synchronous = NORMAL');
        
        // Set cache size
        this.db.exec('PRAGMA cache_size = 10000');
        
        // Set temp store to memory
        this.db.exec('PRAGMA temp_store = MEMORY');

      } catch (error) {
        reject(new DatabaseError(`Connection error: ${error}`));
      }
    });
  }

  /**
   * Execute a query and return results
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          reject(new DatabaseError(`Query failed: ${err.message}`, (err as any).code, sql, params));
          return;
        }
        resolve(rows as T[]);
      });
    });
  }

  /**
   * Execute a single query and return the first result
   */
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute a query that doesn't return data
   */
  async execute(sql: string, params: any[] = []): Promise<{ lastInsertId?: number; changes: number }> {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) {
          reject(new DatabaseError(`Execute failed: ${err.message}`, (err as any).code, sql, params));
          return;
        }
        
        resolve({
          lastInsertId: this.lastID,
          changes: this.changes
        });
      });
    });
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }

    return new Promise((resolve, reject) => {
      this.db!.serialize(() => {
        this.db!.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            reject(new DatabaseError(`Failed to begin transaction: ${err.message}`));
            return;
          }

          callback()
            .then((result) => {
              this.db!.run('COMMIT', (err) => {
                if (err) {
                  this.db!.run('ROLLBACK');
                  reject(new DatabaseError(`Failed to commit transaction: ${err.message}`));
                  return;
                }
                resolve(result);
              });
            })
            .catch((error) => {
              this.db!.run('ROLLBACK', () => {
                reject(error);
              });
            });
        });
      });
    });
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
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(new DatabaseError(`Failed to close database: ${err.message}`));
          return;
        }

        this.isConnectedFlag = false;
        this.db = null;
        console.log('✅ Database connection closed');
        resolve();
      });
    });
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

    return new Promise((resolve, reject) => {
      this.db!.exec(sql, (err) => {
        if (err) {
          reject(new DatabaseError(`Raw SQL execution failed: ${err.message}`, (err as any).code, sql));
          return;
        }
        resolve();
      });
    });
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

    return new Promise((resolve, reject) => {
      const sourcePath = this.config.path || './data/inventory.db';
      
      // Create backup directory if it doesn't exist
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Copy database file
      fs.copyFile(sourcePath, backupPath, (err) => {
        if (err) {
          reject(new DatabaseError(`Backup failed: ${err.message}`));
          return;
        }
        
        console.log(`✅ Database backed up to: ${backupPath}`);
        resolve();
      });
    });
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
