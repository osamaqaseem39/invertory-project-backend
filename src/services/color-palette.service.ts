import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple contrast calculation (replacing wcag-contrast)
function getContrast(color1: string, color2: string): number {
  const c1 = colord(color1);
  const c2 = colord(color2);
  const l1 = c1.toRgb().r * 0.299 + c1.toRgb().g * 0.587 + c1.toRgb().b * 0.114;
  const l2 = c2.toRgb().r * 0.299 + c2.toRgb().g * 0.587 + c2.toRgb().b * 0.114;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

extend([a11yPlugin]);

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface CompletePalette {
  primary: ColorPalette;
  secondary: ColorPalette;
  accent: ColorPalette;
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  gray: ColorPalette;
}

export class ColorPaletteService {
  /**
   * Generate complete color palette from primary color
   */
  static generateCompletePalette(primaryHex: string): CompletePalette {
    const primary = colord(primaryHex);
    const hsl = primary.toHsl();

    // Generate primary shades
    const primaryPalette = this.generateShades(primaryHex);

    // Generate secondary (analogous - 30° shift)
    const secondaryHue = (hsl.h + 30) % 360;
    const secondaryHex = colord({ h: secondaryHue, s: hsl.s, l: hsl.l }).toHex();
    const secondaryPalette = this.generateShades(secondaryHex);

    // Generate accent (complementary - 180° shift)
    const accentHue = (hsl.h + 180) % 360;
    const accentHex = colord({ h: accentHue, s: hsl.s, l: hsl.l }).toHex();
    const accentPalette = this.generateShades(accentHex);

    // Standard colors
    const successPalette = this.generateShades('#10B981'); // Green
    const warningPalette = this.generateShades('#F59E0B'); // Orange
    const errorPalette = this.generateShades('#EF4444'); // Red
    const grayPalette = this.generateShades('#6B7280'); // Gray

    return {
      primary: primaryPalette,
      secondary: secondaryPalette,
      accent: accentPalette,
      success: successPalette,
      warning: warningPalette,
      error: errorPalette,
      gray: grayPalette,
    };
  }

  /**
   * Generate shades (50-950) from a base color
   */
  static generateShades(baseHex: string): ColorPalette {
    const base = colord(baseHex);
    const hsl = base.toHsl();

    // Lightness adjustments for each shade
    const lightnessMap = {
      50: 95,
      100: 90,
      200: 80,
      300: 70,
      400: 60,
      500: hsl.l, // Base color
      600: Math.max(hsl.l - 10, 40),
      700: Math.max(hsl.l - 20, 30),
      800: Math.max(hsl.l - 30, 20),
      900: Math.max(hsl.l - 40, 10),
      950: Math.max(hsl.l - 50, 5),
    };

    const palette: any = {};

    for (const [shade, lightness] of Object.entries(lightnessMap)) {
      const color = colord({ h: hsl.h, s: hsl.s, l: lightness });
      palette[shade] = color.toHex();
    }

    return palette;
  }

  /**
   * Calculate text color (white or black) based on background
   */
  static calculateTextColor(backgroundHex: string): string {
    const contrast = getContrast(backgroundHex, '#FFFFFF');
    return contrast >= 4.5 ? '#FFFFFF' : '#000000';
  }

  /**
   * Generate state colors (hover, active, disabled)
   */
  static generateStateColors(baseHex: string) {
    const base = colord(baseHex);

    return {
      base: baseHex,
      hover: base.darken(0.1).toHex(),
      active: base.darken(0.2).toHex(),
      disabled: base.desaturate(0.5).lighten(0.2).toHex(),
      focus: base.lighten(0.1).toHex(),
      ring: base.alpha(0.5).toRgbString(),
    };
  }

  /**
   * Generate CSS variables from palette
   */
  static generateCSSVariables(palette: CompletePalette): string {
    let css = ':root {\n';

    // Primary colors
    for (const [shade, color] of Object.entries(palette.primary)) {
      css += `  --color-primary-${shade}: ${color};\n`;
    }

    // Secondary colors
    for (const [shade, color] of Object.entries(palette.secondary)) {
      css += `  --color-secondary-${shade}: ${color};\n`;
    }

    // Accent colors
    for (const [shade, color] of Object.entries(palette.accent)) {
      css += `  --color-accent-${shade}: ${color};\n`;
    }

    // Success colors
    for (const [shade, color] of Object.entries(palette.success)) {
      css += `  --color-success-${shade}: ${color};\n`;
    }

    // Warning colors
    for (const [shade, color] of Object.entries(palette.warning)) {
      css += `  --color-warning-${shade}: ${color};\n`;
    }

    // Error colors
    for (const [shade, color] of Object.entries(palette.error)) {
      css += `  --color-error-${shade}: ${color};\n`;
    }

    // Gray colors
    for (const [shade, color] of Object.entries(palette.gray)) {
      css += `  --color-gray-${shade}: ${color};\n`;
    }

    // Gradients
    css += `  --gradient-primary: linear-gradient(135deg, ${palette.primary[500]}, ${palette.secondary[500]});\n`;
    css += `  --gradient-accent: linear-gradient(135deg, ${palette.accent[500]}, ${palette.primary[500]});\n`;

    css += '}\n\n';

    // Utility classes
    css += this.generateUtilityClasses(palette);

    return css;
  }

  /**
   * Generate utility CSS classes
   */
  private static generateUtilityClasses(palette: CompletePalette): string {
    let css = '';

    // Background colors
    for (const [shade, color] of Object.entries(palette.primary)) {
      css += `.bg-primary-${shade} { background-color: ${color} !important; }\n`;
      css += `.text-primary-${shade} { color: ${color} !important; }\n`;
      css += `.border-primary-${shade} { border-color: ${color} !important; }\n`;
    }

    // Gradient classes
    css += `.gradient-primary { background: linear-gradient(135deg, ${palette.primary[500]}, ${palette.secondary[500]}); }\n`;
    css += `.gradient-accent { background: linear-gradient(135deg, ${palette.accent[500]}, ${palette.primary[500]}); }\n`;
    css += `.gradient-text { background: linear-gradient(135deg, ${palette.primary[600]}, ${palette.accent[600]}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }\n`;

    return css;
  }

  /**
   * Generate complete theme CSS
   */
  static async generateThemeCSS(profileId: string): Promise<string> {
    const profile = await prisma.brandingProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new Error('Branding profile not found');
    }

    // Generate complete palette
    const palette = this.generateCompletePalette(profile.primary_color);

    // Generate CSS
    let css = this.generateCSSVariables(palette);

    // Add custom styles
    css += `\n/* Custom Branding Styles */\n`;
    css += `body { font-family: ${this.getFontFamily(profile.font_family as any)}; }\n`;
    
    if (profile.theme_mode === 'DARK') {
      css += this.generateDarkModeStyles();
    }

    // Update profile with generated palette and CSS
    await prisma.brandingProfile.update({
      where: { id: profileId },
      data: {
        color_palette: palette as any,
        generated_css: css,
      },
    });

    return css;
  }

  /**
   * Get font family string
   */
  private static getFontFamily(font: string): string {
    const fontMap: Record<string, string> = {
      INTER: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      ROBOTO: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      OPEN_SANS: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      LATO: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      POPPINS: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      CAIRO: "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      AMIRI: "'Amiri', -apple-system, BlinkMacSystemFont, 'Segoe UI', serif",
    };

    return fontMap[font] || fontMap.INTER;
  }

  /**
   * Generate dark mode styles
   */
  private static generateDarkModeStyles(): string {
    return `
body.dark-mode {
  background-color: #1E293B;
  color: #F1F5F9;
}

.dark-mode .glass {
  background: rgba(30, 41, 59, 0.7);
  border-color: rgba(148, 163, 184, 0.2);
}

.dark-mode .bg-white {
  background-color: #334155 !important;
}
`;
  }

  /**
   * Check color accessibility
   */
  static checkAccessibility(backgroundHex: string, textHex: string): {
    contrast: number;
    isAccessible: boolean;
    wcagLevel: 'AAA' | 'AA' | 'A' | 'Fail';
  } {
    const contrast = getContrast(backgroundHex, textHex);

    let wcagLevel: 'AAA' | 'AA' | 'A' | 'Fail';
    if (contrast >= 7) {
      wcagLevel = 'AAA';
    } else if (contrast >= 4.5) {
      wcagLevel = 'AA';
    } else if (contrast >= 3) {
      wcagLevel = 'A';
    } else {
      wcagLevel = 'Fail';
    }

    return {
      contrast,
      isAccessible: contrast >= 4.5,
      wcagLevel,
    };
  }
}

