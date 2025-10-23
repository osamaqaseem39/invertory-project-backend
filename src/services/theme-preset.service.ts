import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ThemePresetService {
  /**
   * Create built-in theme presets
   */
  static async seedBuiltinThemes() {
    const builtinThemes = [
      {
        name: 'Ocean Blue (Default)',
        description: 'Professional blue theme with purple accents',
        primary_color: '#3B82F6',
        secondary_color: '#8B5CF6',
        accent_color: '#EC4899',
        is_builtin: true,
      },
      {
        name: 'Forest Green',
        description: 'Eco-friendly green theme',
        primary_color: '#10B981',
        secondary_color: '#059669',
        accent_color: '#F59E0B',
        is_builtin: true,
      },
      {
        name: 'Royal Purple',
        description: 'Modern purple and blue theme',
        primary_color: '#8B5CF6',
        secondary_color: '#6366F1',
        accent_color: '#EC4899',
        is_builtin: true,
      },
      {
        name: 'Sunset Orange',
        description: 'Warm orange and red theme',
        primary_color: '#F97316',
        secondary_color: '#EF4444',
        accent_color: '#FBBF24',
        is_builtin: true,
      },
      {
        name: 'Corporate Gray',
        description: 'Professional monochrome theme',
        primary_color: '#64748B',
        secondary_color: '#475569',
        accent_color: '#3B82F6',
        is_builtin: true,
      },
      {
        name: 'Mint Fresh',
        description: 'Light teal and cyan theme',
        primary_color: '#14B8A6',
        secondary_color: '#06B6D4',
        accent_color: '#10B981',
        is_builtin: true,
      },
      {
        name: 'Cherry Red',
        description: 'Bold red theme for impact',
        primary_color: '#EF4444',
        secondary_color: '#DC2626',
        accent_color: '#F97316',
        is_builtin: true,
      },
      {
        name: 'Midnight Dark',
        description: 'Dark theme with blue accents',
        primary_color: '#1E293B',
        secondary_color: '#334155',
        accent_color: '#3B82F6',
        is_builtin: true,
      },
    ];

    const created = [];

    for (const theme of builtinThemes) {
      // Check if already exists
      const existing = await prisma.themePreset.findFirst({
        where: {
          name: theme.name,
          is_builtin: true,
        },
      });

      if (!existing) {
        const preset = await prisma.themePreset.create({
          data: theme,
        });
        created.push(preset);
      }
    }

    return created;
  }

  /**
   * Get all theme presets
   */
  static async getAllPresets() {
    return await prisma.themePreset.findMany({
      where: { is_public: true },
      orderBy: [
        { is_builtin: 'desc' },
        { usage_count: 'desc' },
      ],
    });
  }

  /**
   * Apply theme preset to branding profile
   */
  static async applyPreset(presetId: string, profileId: string) {
    const preset = await prisma.themePreset.findUnique({
      where: { id: presetId },
    });

    if (!preset) {
      throw new Error('Theme preset not found');
    }

    // Update branding profile with preset colors
    const updated = await prisma.brandingProfile.update({
      where: { id: profileId },
      data: {
        primary_color: preset.primary_color,
        secondary_color: preset.secondary_color,
        accent_color: preset.accent_color,
        css_version: { increment: 1 },
      },
    });

    // Increment usage count
    await prisma.themePreset.update({
      where: { id: presetId },
      data: {
        usage_count: { increment: 1 },
      },
    });

    return updated;
  }

  /**
   * Create custom theme preset
   */
  static async createCustomPreset(params: {
    name: string;
    description?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    created_by_id: string;
  }) {
    return await prisma.themePreset.create({
      data: {
        ...params,
        is_builtin: false,
        is_public: false,
      },
    });
  }

  /**
   * Delete custom theme preset
   */
  static async deletePreset(presetId: string) {
    const preset = await prisma.themePreset.findUnique({
      where: { id: presetId },
    });

    if (!preset) {
      throw new Error('Theme preset not found');
    }

    if (preset.is_builtin) {
      throw new Error('Cannot delete built-in theme');
    }

    return await prisma.themePreset.delete({
      where: { id: presetId },
    });
  }
}





