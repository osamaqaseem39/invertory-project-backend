import { PrismaClient } from '@prisma/client';
import { ThemePresetService } from './services/theme-preset.service';

const prisma = new PrismaClient();

async function seedBranding() {
  console.log('🎨 Seeding branding system...\n');

  try {
    // 1. Seed built-in theme presets
    console.log('📦 Creating built-in theme presets...');
    const themes = await ThemePresetService.seedBuiltinThemes();
    console.log(`✅ Created ${themes.length} built-in themes\n`);

    // 2. Get admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['owner_ultimate_super_admin', 'admin'] },
      },
    });

    if (!adminUser) {
      console.log('⚠️  No admin user found. Skipping default branding profile creation.');
      return;
    }

    // 3. Check if branding profile already exists
    const existingBranding = await prisma.brandingProfile.findFirst();

    if (existingBranding) {
      console.log('✅ Branding profile already exists. Skipping creation.\n');
      return;
    }

    // 4. Create default branding profile
    console.log('🏢 Creating default branding profile...');
    const defaultBranding = await prisma.brandingProfile.create({
      data: {
        company_name: 'Inventory Pro',
        company_name_ar: 'برو المخزون',
        tagline: 'Professional Inventory & POS System',
        primary_color: '#3B82F6',
        secondary_color: '#8B5CF6',
        accent_color: '#EC4899',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        font_family: 'INTER',
        theme_mode: 'LIGHT',
        receipt_footer_text: 'Thank you for your business!',
        receipt_logo_position: 'CENTER',
        invoice_template: 'modern',
        is_active: true,
        is_default: true,
        created_by_id: adminUser.id,
      },
    });

    console.log(`✅ Default branding profile created (ID: ${defaultBranding.id})\n`);

    console.log('✅ Branding system seeded successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding branding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder
seedBranding()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });





