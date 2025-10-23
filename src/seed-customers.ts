import prisma from './database/client';
import logger from './utils/logger';

/**
 * Seed customers for POS system
 */
async function seedCustomers() {
  try {
    logger.info('🛒 Starting customer seed...');

    // Check if customers already exist
    const existingCustomerCount = await prisma.customer.count();
    if (existingCustomerCount > 0) {
      logger.warn(`⚠️  Database already has ${existingCustomerCount} customers. Skipping customer seed.`);
      logger.info('Customers already exist. To re-seed, delete existing customers first.');
      return;
    }

    // Get admin user for created_by_id
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (!adminUser) {
      logger.error('❌ Admin user not found. Please run main seed first: npm run db:seed');
      return;
    }

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
        created_by_id: adminUser.id,
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
        created_by_id: adminUser.id,
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
        created_by_id: adminUser.id,
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
        created_by_id: adminUser.id,
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
        created_by_id: adminUser.id,
      },
      {
        customer_number: 'CUST-0006',
        first_name: 'Sarah',
        last_name: 'Wilson',
        email: 'sarah.w@example.com',
        phone: '+1-555-0006',
        address_line1: '999 Park Ave',
        city: 'Boston',
        state: 'MA',
        postal_code: '02101',
        country: 'USA',
        is_active: true,
        created_by_id: adminUser.id,
      },
      {
        customer_number: 'CUST-0007',
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'michael.brown@example.com',
        phone: '+1-555-0007',
        company_name: 'Brown & Associates',
        address_line1: '777 Commerce St',
        city: 'Dallas',
        state: 'TX',
        postal_code: '75201',
        country: 'USA',
        credit_limit: 15000.00,
        payment_terms: 'Net 45',
        is_active: true,
        created_by_id: adminUser.id,
      },
      {
        customer_number: 'CUST-0008',
        first_name: 'Emily',
        last_name: 'Davis',
        email: 'emily.davis@example.com',
        phone: '+1-555-0008',
        address_line1: '444 Maple St',
        city: 'Seattle',
        state: 'WA',
        postal_code: '98101',
        country: 'USA',
        discount_percentage: 10.00,
        is_vip: true,
        is_active: true,
        created_by_id: adminUser.id,
      },
    ];

    for (const customerData of customers) {
      const customer = await prisma.customer.create({ data: customerData });
      logger.info(`✅ Created customer: ${customer.first_name} ${customer.last_name} (${customer.customer_number})`);
    }

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`✅ Successfully created ${customers.length} customers for POS system!`);
    logger.info('═══════════════════════════════════════════════════════════');

  } catch (error) {
    logger.error({ error }, '❌ Failed to seed customers');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCustomers();





