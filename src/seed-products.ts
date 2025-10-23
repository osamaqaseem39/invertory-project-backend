import prisma from './database/client';
import logger from './utils/logger';

/**
 * Seed database with demo products
 */
async function seedProducts() {
  try {
    logger.info('🛍️  Starting product seed...');

    // Get owner user to set as creator
    const owner = await prisma.user.findFirst({
      where: { role: 'owner_ultimate_super_admin' },
    });

    if (!owner) {
      logger.error('No owner user found. Please seed users first.');
      return;
    }

    // Check if products already exist
    const existingProductCount = await prisma.product.count();
    if (existingProductCount > 0) {
      logger.warn(`⚠️  Database already has ${existingProductCount} products. Skipping product seed.`);
      return;
    }

    // Demo products with realistic data
    const products = [
      {
        sku: 'LAPTOP-001',
        barcode: '1234567890123',
        name: 'Dell XPS 13 Laptop',
        description: 'Ultra-thin 13-inch laptop with Intel i7, 16GB RAM, 512GB SSD',
        brand: 'Dell',
        category: 'Electronics',
        price: 1299.99,
        cost: 950.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/laptop1/400/400', is_primary: true },
          { url: 'https://picsum.photos/seed/laptop2/400/400', is_primary: false },
        ],
      },
      {
        sku: 'PHONE-001',
        barcode: '2345678901234',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 chip, 256GB storage',
        brand: 'Apple',
        category: 'Electronics',
        price: 999.99,
        cost: 750.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/phone1/400/400', is_primary: true },
        ],
      },
      {
        sku: 'CHAIR-001',
        barcode: '3456789012345',
        name: 'Ergonomic Office Chair',
        description: 'Comfortable ergonomic chair with lumbar support',
        brand: 'Herman Miller',
        category: 'Furniture',
        price: 599.99,
        cost: 350.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/chair1/400/400', is_primary: true },
        ],
      },
      {
        sku: 'DESK-001',
        barcode: '4567890123456',
        name: 'Standing Desk',
        description: 'Adjustable height standing desk, 60x30 inches',
        brand: 'Uplift',
        category: 'Furniture',
        price: 799.99,
        cost: 500.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/desk1/400/400', is_primary: true },
          { url: 'https://picsum.photos/seed/desk2/400/400', is_primary: false },
        ],
      },
      {
        sku: 'MOUSE-001',
        barcode: '5678901234567',
        name: 'Logitech MX Master 3',
        description: 'Advanced wireless mouse with ergonomic design',
        brand: 'Logitech',
        category: 'Electronics',
        price: 99.99,
        cost: 60.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/mouse1/400/400', is_primary: true },
        ],
      },
      {
        sku: 'MONITOR-001',
        barcode: '6789012345678',
        name: 'LG UltraWide Monitor 34"',
        description: '34-inch ultrawide monitor, 3440x1440 resolution',
        brand: 'LG',
        category: 'Electronics',
        price: 699.99,
        cost: 450.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/monitor1/400/400', is_primary: true },
        ],
      },
      {
        sku: 'BOOK-001',
        name: 'Clean Code by Robert Martin',
        description: 'A handbook of agile software craftsmanship',
        brand: 'Prentice Hall',
        category: 'Books',
        price: 39.99,
        cost: 20.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/book1/400/400', is_primary: true },
        ],
      },
      {
        sku: 'HEADPHONE-001',
        barcode: '7890123456789',
        name: 'Sony WH-1000XM5',
        description: 'Industry-leading noise canceling headphones',
        brand: 'Sony',
        category: 'Electronics',
        price: 399.99,
        cost: 250.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/headphone1/400/400', is_primary: true },
        ],
      },
      {
        sku: 'COFFEE-001',
        name: 'Premium Coffee Beans',
        description: 'Arabica coffee beans from Colombia, 1kg pack',
        brand: 'Starbucks',
        category: 'Food & Beverage',
        price: 24.99,
        cost: 12.00,
        uom: 'kg',
        images: [
          { url: 'https://picsum.photos/seed/coffee1/400/400', is_primary: true },
        ],
      },
      {
        sku: 'BACKPACK-001',
        barcode: '8901234567890',
        name: 'Travel Backpack 40L',
        description: 'Durable travel backpack with laptop compartment',
        brand: 'North Face',
        category: 'Accessories',
        price: 129.99,
        cost: 70.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/backpack1/400/400', is_primary: true },
        ],
      },
      {
        sku: 'WATCH-001',
        barcode: '9012345678901',
        name: 'Smart Watch Series 9',
        description: 'Latest smartwatch with health tracking',
        brand: 'Apple',
        category: 'Electronics',
        price: 399.99,
        cost: 280.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/watch1/400/400', is_primary: true },
        ],
      },
      {
        sku: 'NOTEBOOK-001',
        name: 'Moleskine Classic Notebook',
        description: 'Hard cover notebook, ruled, 240 pages',
        brand: 'Moleskine',
        category: 'Stationery',
        price: 19.99,
        cost: 8.00,
        uom: 'unit',
        images: [
          { url: 'https://picsum.photos/seed/notebook1/400/400', is_primary: true },
        ],
      },
    ];

    // Create products
    for (const productData of products) {
      const product = await prisma.product.create({
        data: {
          sku: productData.sku,
          barcode: productData.barcode,
          name: productData.name,
          description: productData.description,
          brand: productData.brand,
          category_id: null,
          stock_quantity: 100,
          reorder_level: 20,
          reorder_quantity: 50,
          price: productData.price,
          cost: productData.cost,
          uom: productData.uom,
          created_by_id: owner.id,
          images: {
            create: productData.images,
          },
        },
      });

      logger.info(`✅ Created product: ${product.sku} - ${product.name}`);
    }

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('🎉 Products seeded successfully!');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
    logger.info(`Total products created: ${products.length}`);
    logger.info('Categories: Electronics, Furniture, Books, Food & Beverage, Accessories, Stationery');
    logger.info('Brands: Dell, Apple, Herman Miller, Logitech, LG, Sony, Starbucks, North Face, Moleskine');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');

  } catch (error) {
    logger.error({ error }, '❌ Failed to seed products');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();

