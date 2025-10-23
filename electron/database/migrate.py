#!/usr/bin/env python3
"""
SQLite Database Migration Script
Converts PostgreSQL Prisma schema to SQLite and migrates data
"""

import sqlite3
import os
import json
import sys
from datetime import datetime
from pathlib import Path

class SQLiteMigrator:
    def __init__(self, db_path: str = "./data/inventory.db"):
        self.db_path = db_path
        self.db_dir = os.path.dirname(db_path)
        # Fix migrations path to be relative to the script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.migrations_dir = os.path.join(script_dir, "migrations")
        
        # Ensure directories exist
        os.makedirs(self.db_dir, exist_ok=True)
        os.makedirs(self.migrations_dir, exist_ok=True)
        
        self.conn = None
        
    def connect(self):
        """Connect to SQLite database"""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA foreign_keys = ON")
            print(f"✅ Connected to SQLite database: {self.db_path}")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            sys.exit(1)
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("✅ Database connection closed")
    
    def run_migrations(self):
        """Run all pending migrations"""
        print("🔄 Running database migrations...")
        
        # Get list of migration files
        migration_files = sorted([f for f in os.listdir(self.migrations_dir) if f.endswith('.sql')])
        
        if not migration_files:
            print("❌ No migration files found")
            return False
        
        # Check which migrations have been applied
        applied_migrations = self.get_applied_migrations()
        
        for migration_file in migration_files:
            migration_version = migration_file.split('_')[0]
            
            if migration_version in applied_migrations:
                print(f"⏭️  Skipping {migration_file} (already applied)")
                continue
            
            print(f"🔄 Applying migration: {migration_file}")
            
            try:
                migration_path = os.path.join(self.migrations_dir, migration_file)
                with open(migration_path, 'r') as f:
                    migration_sql = f.read()
                
                # Execute migration
                self.conn.executescript(migration_sql)
                self.conn.commit()
                
                print(f"✅ Applied migration: {migration_file}")
                
            except Exception as e:
                print(f"❌ Failed to apply migration {migration_file}: {e}")
                self.conn.rollback()
                return False
        
        print("✅ All migrations completed successfully")
        return True
    
    def get_applied_migrations(self):
        """Get list of applied migrations"""
        try:
            cursor = self.conn.execute("SELECT version FROM migrations")
            return {row[0] for row in cursor.fetchall()}
        except sqlite3.OperationalError:
            # migrations table doesn't exist yet
            return set()
    
    def create_database(self):
        """Create database with initial schema"""
        print("🏗️  Creating SQLite database...")
        
        try:
            # Run all migrations
            success = self.run_migrations()
            
            if success:
                print("✅ Database created successfully")
                self.show_database_info()
            else:
                print("❌ Database creation failed")
                
            return success
            
        except Exception as e:
            print(f"❌ Database creation failed: {e}")
            return False
    
    def show_database_info(self):
        """Show database information"""
        try:
            cursor = self.conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            print(f"\n📊 Database Information:")
            print(f"   📁 Database: {self.db_path}")
            print(f"   📋 Tables: {len(tables)}")
            print(f"   🗂️  Tables: {', '.join(tables[:10])}{'...' if len(tables) > 10 else ''}")
            
            # Show record counts for main tables
            main_tables = ['users', 'products', 'categories', 'customers', 'suppliers']
            print(f"\n📈 Record Counts:")
            for table in main_tables:
                if table in tables:
                    cursor = self.conn.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    print(f"   {table}: {count} records")
            
            # Show applied migrations
            cursor = self.conn.execute("SELECT version, name, applied_at FROM migrations ORDER BY version")
            migrations = cursor.fetchall()
            
            print(f"\n🔄 Applied Migrations:")
            for migration in migrations:
                print(f"   {migration[0]} - {migration[1]} ({migration[2]})")
                
        except Exception as e:
            print(f"⚠️  Could not show database info: {e}")
    
    def backup_database(self, backup_path: str = None):
        """Create backup of database"""
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"{self.db_path}.backup_{timestamp}"
        
        try:
            import shutil
            shutil.copy2(self.db_path, backup_path)
            print(f"✅ Database backed up to: {backup_path}")
            return backup_path
        except Exception as e:
            print(f"❌ Backup failed: {e}")
            return None
    
    def restore_database(self, backup_path: str):
        """Restore database from backup"""
        try:
            import shutil
            shutil.copy2(backup_path, self.db_path)
            print(f"✅ Database restored from: {backup_path}")
            return True
        except Exception as e:
            print(f"❌ Restore failed: {e}")
            return False
    
    def export_data(self, export_path: str = None):
        """Export data to JSON format"""
        if not export_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            export_path = f"./exports/inventory_data_{timestamp}.json"
        
        os.makedirs(os.path.dirname(export_path), exist_ok=True)
        
        try:
            cursor = self.conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            export_data = {}
            
            for table in tables:
                cursor = self.conn.execute(f"SELECT * FROM {table}")
                rows = cursor.fetchall()
                
                # Convert rows to dictionaries
                table_data = []
                for row in rows:
                    table_data.append(dict(row))
                
                export_data[table] = table_data
            
            with open(export_path, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)
            
            print(f"✅ Data exported to: {export_path}")
            return export_path
            
        except Exception as e:
            print(f"❌ Export failed: {e}")
            return None
    
    def import_data(self, import_path: str):
        """Import data from JSON format"""
        try:
            with open(import_path, 'r') as f:
                import_data = json.load(f)
            
            # Disable foreign key constraints during import
            self.conn.execute("PRAGMA foreign_keys = OFF")
            
            for table_name, table_data in import_data.items():
                if not table_data:
                    continue
                
                # Get column names
                cursor = self.conn.execute(f"PRAGMA table_info({table_name})")
                columns = [row[1] for row in cursor.fetchall()]
                
                # Insert data
                for row_data in table_data:
                    # Filter data to match table columns
                    filtered_data = {k: v for k, v in row_data.items() if k in columns}
                    
                    if filtered_data:
                        placeholders = ', '.join(['?' for _ in filtered_data])
                        columns_str = ', '.join(filtered_data.keys())
                        values = list(filtered_data.values())
                        
                        sql = f"INSERT OR REPLACE INTO {table_name} ({columns_str}) VALUES ({placeholders})"
                        self.conn.execute(sql, values)
            
            # Re-enable foreign key constraints
            self.conn.execute("PRAGMA foreign_keys = ON")
            self.conn.commit()
            
            print(f"✅ Data imported from: {import_path}")
            return True
            
        except Exception as e:
            print(f"❌ Import failed: {e}")
            self.conn.rollback()
            return False

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='SQLite Database Migration Tool')
    parser.add_argument('--db-path', default='./data/inventory.db', help='Database file path')
    parser.add_argument('--action', choices=['create', 'migrate', 'backup', 'restore', 'export', 'import', 'info'], 
                       default='create', help='Action to perform')
    parser.add_argument('--backup-path', help='Backup file path')
    parser.add_argument('--export-path', help='Export file path')
    parser.add_argument('--import-path', help='Import file path')
    
    args = parser.parse_args()
    
    migrator = SQLiteMigrator(args.db_path)
    
    try:
        migrator.connect()
        
        if args.action == 'create':
            migrator.create_database()
        elif args.action == 'migrate':
            migrator.run_migrations()
        elif args.action == 'backup':
            migrator.backup_database(args.backup_path)
        elif args.action == 'restore':
            if not args.backup_path:
                print("❌ Backup path required for restore")
                sys.exit(1)
            migrator.restore_database(args.backup_path)
        elif args.action == 'export':
            migrator.export_data(args.export_path)
        elif args.action == 'import':
            if not args.import_path:
                print("❌ Import path required for import")
                sys.exit(1)
            migrator.import_data(args.import_path)
        elif args.action == 'info':
            migrator.show_database_info()
    
    finally:
        migrator.close()

if __name__ == "__main__":
    main()
