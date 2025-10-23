import { UserRole } from '@prisma/client';
import prisma from './database/client';
import { hashPassword } from './utils/password';
import logger from './utils/logger';

/**
 * Seed database with demo users
 */
async function seed() {
  try {
    logger.info('🌱 Starting database seed...');

    // Check if users already exist
    const existingUserCount = await prisma.user.count();
    if (existingUserCount > 0) {
      logger.warn(`⚠️  Database already has ${existingUserCount} users. Skipping seed.`);
      logger.info('To reset and re-seed, run: npm run db:reset');
      return;
    }

    // Create owner
    const ownerPassword = await hashPassword('Owner@123456');
    const owner = await prisma.user.create({
      data: {
        username: 'owner',
        email: 'owner@example.com',
        display_name: 'System Owner',
        password_hash: ownerPassword,
        role: UserRole.owner_ultimate_super_admin,
      },
    });

    logger.info(`✅ Created owner: ${owner.username}`);

    // Create master admin
    const masterAdminPassword = await hashPassword('MasterAdmin@123456');
    const masterAdmin = await prisma.user.create({
      data: {
        username: 'master_admin',
        email: 'master@example.com',
        display_name: 'Master Administrator',
        password_hash: masterAdminPassword,
        role: UserRole.master_admin,
        created_by_id: owner.id,
      },
    });

    logger.info(`✅ Created master admin: ${masterAdmin.username}`);

    // Create admin
    const adminPassword = await hashPassword('Admin@123456');
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        display_name: 'System Admin',
        password_hash: adminPassword,
        role: UserRole.admin,
        created_by_id: owner.id,
      },
    });

    logger.info(`✅ Created admin: ${admin.username}`);

    // Create cashier
    const cashierPassword = await hashPassword('Cashier@123456');
    const cashier = await prisma.user.create({
      data: {
        username: 'cashier',
        email: 'cashier@example.com',
        display_name: 'John Cashier',
        password_hash: cashierPassword,
        role: UserRole.cashier,
        created_by_id: admin.id,
      },
    });

    logger.info(`✅ Created cashier: ${cashier.username}`);

    // Create inventory manager
    const inventoryPassword = await hashPassword('Inventory@123456');
    const inventoryManager = await prisma.user.create({
      data: {
        username: 'inventory_mgr',
        email: 'inventory@example.com',
        display_name: 'Jane Inventory',
        password_hash: inventoryPassword,
        role: UserRole.inventory_manager,
        created_by_id: admin.id,
      },
    });

    logger.info(`✅ Created inventory manager: ${inventoryManager.username}`);

    // Create guest
    const guestPassword = await hashPassword('Guest@123456');
    const guest = await prisma.user.create({
      data: {
        username: 'guest_user',
        email: 'guest@example.com',
        display_name: 'Guest User',
        password_hash: guestPassword,
        role: UserRole.guest,
        created_by_id: owner.id,
      },
    });

    logger.info(`✅ Created guest: ${guest.username}`);

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('🎉 Database seeded successfully!');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
    logger.info('Demo Users:');
    logger.info('');
    logger.info('1. Master Admin');
    logger.info('   Username: master_admin');
    logger.info('   Password: MasterAdmin@123456');
    logger.info('   Can: Manage all client instances, view cross-tenant data');
    logger.info('');
    logger.info('2. Owner (Ultimate Super Admin)');
    logger.info('   Username: owner');
    logger.info('   Password: Owner@123456');
    logger.info('   Can: Create/edit/delete anyone, including other owners');
    logger.info('');
    logger.info('3. Admin');
    logger.info('   Username: admin');
    logger.info('   Password: Admin@123456');
    logger.info('   Can: Create/edit cashiers and inventory managers');
    logger.info('');
    logger.info('4. Cashier');
    logger.info('   Username: cashier');
    logger.info('   Password: Cashier@123456');
    logger.info('   Can: View own profile only');
    logger.info('');
    logger.info('5. Inventory Manager');
    logger.info('   Username: inventory_mgr');
    logger.info('   Password: Inventory@123456');
    logger.info('   Can: View own profile only');
    logger.info('');
    logger.info('6. Guest');
    logger.info('   Username: guest_user');
    logger.info('   Password: Guest@123456');
    logger.info('   Can: View-only (own profile and public info)');
    logger.info('');

    // ===== SEED CUSTOMERS FOR POS SYSTEM =====
    logger.info('🛒 Seeding customers for POS...');
    
    const customers = [
      {
        customer_number: 'CUST-0001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0001',
        address_line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'USA',
        is_active: true,
        created_by_id: admin.id,
      },
      {
        customer_number: 'CUST-0002',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0002',
        address_line1: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        postal_code: '90001',
        country: 'USA',
        is_vip: true,
        is_active: true,
        created_by_id: admin.id,
      },
      {
        customer_number: 'CUST-0003',
        first_name: 'Robert',
        last_name: 'Johnson',
        email: 'robert.j@example.com',
        phone: '+1-555-0003',
        company_name: 'Tech Solutions Inc',
        address_line1: '789 Business Blvd',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60601',
        country: 'USA',
        credit_limit: 10000.00,
        payment_terms: 'Net 30',
        is_active: true,
        created_by_id: admin.id,
      },
      {
        customer_number: 'CUST-0004',
        first_name: 'Maria',
        last_name: 'Garcia',
        email: 'maria.garcia@example.com',
        phone: '+1-555-0004',
        address_line1: '321 Sunset Dr',
        city: 'Miami',
        state: 'FL',
        postal_code: '33101',
        country: 'USA',
        discount_percentage: 5.00,
        is_active: true,
        created_by_id: admin.id,
      },
      {
        customer_number: 'CUST-0005',
        first_name: 'David',
        last_name: 'Lee',
        email: 'david.lee@example.com',
        phone: '+1-555-0005',
        company_name: 'Lee Enterprises',
        address_line1: '555 Corporate Way',
        city: 'Houston',
        state: 'TX',
        postal_code: '77001',
        country: 'USA',
        credit_limit: 25000.00,
        payment_terms: 'Net 60',
        is_vip: true,
        is_active: true,
        created_by_id: admin.id,
      },
    ];

    for (const customerData of customers) {
      const customer = await prisma.customer.create({ data: customerData });
      logger.info(`✅ Created customer: ${customer.first_name} ${customer.last_name} (${customer.customer_number})`);
    }

    logger.info(`✅ Created ${customers.length} customers`);
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');

  } catch (error) {
    logger.error({ error }, '❌ Failed to seed database');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();

