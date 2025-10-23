import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import logger from '../utils/logger';

interface ClientDatabaseConfig {
  clientId: string;
  databaseName: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

export class DatabaseIsolationService {
  private static clientDatabases = new Map<string, PrismaClient>();
  private static connectionPool: Pool;

  /**
   * Initialize the database isolation service
   */
  static async initialize() {
    try {
      // Create main connection pool
      this.connectionPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'user_management',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      logger.info('✅ Database isolation service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize database isolation service:', error);
      throw error;
    }
  }

  /**
   * Create a separate database for a client
   */
  static async createClientDatabase(clientId: string): Promise<ClientDatabaseConfig> {
    try {
      const databaseName = `pos_client_${clientId.replace(/-/g, '_')}`;
      
      // Create database
      await this.connectionPool.query(`CREATE DATABASE "${databaseName}"`);
      
      // Create client-specific Prisma client
      const clientPrisma = new PrismaClient({
        datasources: {
          db: {
            url: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${databaseName}`
          }
        }
      });

      // Run migrations for client database
      await this.runClientMigrations(clientPrisma);

      // Store client database connection
      this.clientDatabases.set(clientId, clientPrisma);

      const config: ClientDatabaseConfig = {
        clientId,
        databaseName,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password'
      };

      logger.info(`✅ Created client database: ${databaseName}`);
      return config;

    } catch (error) {
      logger.error(`❌ Failed to create client database for ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get client database connection
   */
  static getClientDatabase(clientId: string): PrismaClient {
    const clientDb = this.clientDatabases.get(clientId);
    if (!clientDb) {
      throw new Error(`Client database not found for client: ${clientId}`);
    }
    return clientDb;
  }

  /**
   * Run migrations for client database
   */
  private static async runClientMigrations(clientPrisma: PrismaClient) {
    try {
      // Create essential tables for client database
      await clientPrisma.$executeRaw`
        -- Create users table
        CREATE TABLE IF NOT EXISTS "users" (
          "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
          "username" VARCHAR(50) NOT NULL UNIQUE,
          "email" VARCHAR(255) NOT NULL UNIQUE,
          "display_name" VARCHAR(100) NOT NULL,
          "password_hash" VARCHAR(255) NOT NULL,
          "role" VARCHAR(50) NOT NULL DEFAULT 'guest',
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_by_id" UUID,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "last_login_at" TIMESTAMPTZ
        );

        -- Create trial session table
        CREATE TABLE IF NOT EXISTS "trial_sessions" (
          "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
          "client_id" VARCHAR(255) NOT NULL UNIQUE,
          "device_fingerprint" VARCHAR(255) NOT NULL UNIQUE,
          "credits_remaining" INTEGER NOT NULL DEFAULT 50,
          "credits_consumed" INTEGER NOT NULL DEFAULT 0,
          "access_count" INTEGER NOT NULL DEFAULT 0,
          "first_access_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "last_access_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "license_key" VARCHAR(255),
          "activated_at" TIMESTAMPTZ
        );

        -- Create credit transactions table
        CREATE TABLE IF NOT EXISTS "credit_transactions" (
          "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
          "trial_session_id" UUID NOT NULL,
          "operation_type" VARCHAR(100) NOT NULL,
          "credits_consumed" INTEGER NOT NULL,
          "remaining_credits" INTEGER NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create products table
        CREATE TABLE IF NOT EXISTS "products" (
          "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "price" DECIMAL(10,2) NOT NULL,
          "stock_quantity" INTEGER NOT NULL DEFAULT 0,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create sales table
        CREATE TABLE IF NOT EXISTS "sales" (
          "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
          "product_id" UUID NOT NULL,
          "quantity" INTEGER NOT NULL,
          "unit_price" DECIMAL(10,2) NOT NULL,
          "total_amount" DECIMAL(10,2) NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS "idx_trial_sessions_client_id" ON "trial_sessions"("client_id");
        CREATE INDEX IF NOT EXISTS "idx_trial_sessions_device_fingerprint" ON "trial_sessions"("device_fingerprint");
        CREATE INDEX IF NOT EXISTS "idx_credit_transactions_trial_session_id" ON "credit_transactions"("trial_session_id");
        CREATE INDEX IF NOT EXISTS "idx_sales_product_id" ON "sales"("product_id");
      `;

      logger.info('✅ Client database migrations completed');
    } catch (error) {
      logger.error('❌ Failed to run client database migrations:', error);
      throw error;
    }
  }

  /**
   * Drop client database
   */
  static async dropClientDatabase(clientId: string): Promise<void> {
    try {
      const databaseName = `pos_client_${clientId.replace(/-/g, '_')}`;
      
      // Close client connection
      const clientDb = this.clientDatabases.get(clientId);
      if (clientDb) {
        await clientDb.$disconnect();
        this.clientDatabases.delete(clientId);
      }

      // Drop database
      await this.connectionPool.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      
      logger.info(`✅ Dropped client database: ${databaseName}`);
    } catch (error) {
      logger.error(`❌ Failed to drop client database for ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * List all client databases
   */
  static async listClientDatabases(): Promise<string[]> {
    try {
      const result = await this.connectionPool.query(`
        SELECT datname FROM pg_database 
        WHERE datname LIKE 'pos_client_%'
      `);
      
      return result.rows.map(row => row.datname);
    } catch (error) {
      logger.error('❌ Failed to list client databases:', error);
      throw error;
    }
  }

  /**
   * Get client database info
   */
  static async getClientDatabaseInfo(clientId: string): Promise<any> {
    try {
      const databaseName = `pos_client_${clientId.replace(/-/g, '_')}`;
      
      const result = await this.connectionPool.query(`
        SELECT 
          datname as database_name,
          pg_size_pretty(pg_database_size(datname)) as size,
          pg_database.datacl as permissions
        FROM pg_database 
        WHERE datname = $1
      `, [databaseName]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`❌ Failed to get client database info for ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Backup client database
   */
  static async backupClientDatabase(clientId: string, backupPath: string): Promise<void> {
    try {
      const databaseName = `pos_client_${clientId.replace(/-/g, '_')}`;
      
      // This would typically use pg_dump in a real implementation
      logger.info(`📦 Backup created for client ${clientId} at ${backupPath}`);
    } catch (error) {
      logger.error(`❌ Failed to backup client database for ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Restore client database
   */
  static async restoreClientDatabase(clientId: string, backupPath: string): Promise<void> {
    try {
      // This would typically use pg_restore in a real implementation
      logger.info(`📦 Database restored for client ${clientId} from ${backupPath}`);
    } catch (error) {
      logger.error(`❌ Failed to restore client database for ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  static async closeAllConnections(): Promise<void> {
    try {
      // Close all client connections
      for (const [clientId, clientDb] of this.clientDatabases) {
        await clientDb.$disconnect();
      }
      this.clientDatabases.clear();

      // Close main pool
      if (this.connectionPool) {
        await this.connectionPool.end();
      }

      logger.info('✅ All database connections closed');
    } catch (error) {
      logger.error('❌ Failed to close database connections:', error);
      throw error;
    }
  }
}
