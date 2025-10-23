/**
 * Database Adapter Interface
 * Provides a unified interface for different database implementations
 */

export interface DatabaseAdapter {
  /**
   * Connect to the database
   */
  connect(): Promise<void>;

  /**
   * Execute a query and return results
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * Execute a single query and return the first result
   */
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;

  /**
   * Execute a query that doesn't return data (INSERT, UPDATE, DELETE)
   */
  execute(sql: string, params?: any[]): Promise<{ lastInsertId?: number; changes: number }>;

  /**
   * Execute multiple queries in a transaction
   */
  transaction<T>(callback: () => Promise<T>): Promise<T>;

  /**
   * Run database migrations
   */
  migrate(): Promise<void>;

  /**
   * Close the database connection
   */
  close(): Promise<void>;

  /**
   * Get database connection info
   */
  getConnectionInfo(): {
    type: string;
    version: string;
    path?: string;
  };

  /**
   * Check if database is connected
   */
  isConnected(): boolean;

  /**
   * Execute raw SQL (for migrations, etc.)
   */
  executeRaw(sql: string): Promise<void>;

  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit a transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback a transaction
   */
  rollback(): Promise<void>;

  /**
   * Get last insert ID
   */
  getLastInsertId(): number;

  /**
   * Get number of affected rows
   */
  getAffectedRows(): number;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql';
  path?: string; // For SQLite
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  pool?: {
    min?: number;
    max?: number;
  };
}

/**
 * Query result interface
 */
export interface QueryResult<T = any> {
  data: T[];
  count: number;
  lastInsertId?: number;
  changes?: number;
}

/**
 * Migration interface
 */
export interface Migration {
  version: string;
  name: string;
  up: string;
  down?: string;
  checksum?: string;
}

/**
 * Database error class
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public sql?: string,
    public params?: any[]
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Database connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * Database adapter factory
 */
export class DatabaseAdapterFactory {
  /**
   * Create a database adapter based on configuration
   */
  static create(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'sqlite':
        return new SQLiteAdapter(config);
      case 'postgresql':
        throw new DatabaseError('PostgreSQL adapter not implemented yet');
      case 'mysql':
        throw new DatabaseError('MySQL adapter not implemented yet');
      default:
        throw new DatabaseError(`Unsupported database type: ${config.type}`);
    }
  }
}

// Import implementations
import { SQLiteAdapter } from './sqlite-adapter';
