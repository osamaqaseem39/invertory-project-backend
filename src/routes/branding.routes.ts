import { Router } from 'express';
import { BrandingService } from '../services/branding.service';
import { ColorPaletteService } from '../services/color-palette.service';
import { ReceiptBrandingService } from '../services/receipt-branding.service';
import { ThemePresetService } from '../services/theme-preset.service';
import { uploadProductImage } from '../middleware/upload.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  createBrandingSchema,
  updateBrandingSchema,
  applyPresetSchema,
  createPresetSchema,
} from '../validators/branding.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// RBAC helper
const requireRole = (allowedRoles: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
    }
    next();
  };
};

const ADMIN_ROLES = [UserRole.owner_ultimate_super_admin, UserRole.admin];

/**
 * GET /api/v1/branding/active
 * Get active branding profile (available to all)
 */
router.get('/active', async (_req: any, res) => {
  try {
    const branding = await BrandingService.getActiveBranding();
    return res.status(200).json({ data: branding });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_BRANDING_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/branding
 * List all branding profiles (admin only)
 */
router.get('/', requireRole(ADMIN_ROLES), async (_req: any, res) => {
  try {
    const brandings = await BrandingService.listBrandings();
    return res.status(200).json({ data: brandings });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'LIST_BRANDING_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/branding
 * Create branding profile (admin only)
 */
router.post('/', requireRole(ADMIN_ROLES), validateBody(createBrandingSchema), async (req: any, res) => {
  try {
    const branding = await BrandingService.createBranding({
      ...req.body,
      created_by_id: req.user.id,
    });

    return res.status(201).json({
      message: 'Branding profile created',
      data: branding,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'CREATE_BRANDING_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * PATCH /api/v1/branding/:id
 * Update branding profile (admin only)
 */
router.patch('/:id', requireRole(ADMIN_ROLES), validateBody(updateBrandingSchema), async (req: any, res) => {
  try {
    const branding = await BrandingService.updateBranding(req.params.id, req.body, req.user.id);

    return res.status(200).json({
      message: 'Branding profile updated',
      data: branding,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'UPDATE_BRANDING_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/branding/:id/logo
 * Upload logo (admin only)
 */
router.post(
  '/:id/logo',
  requireRole(ADMIN_ROLES),
  uploadProductImage.single('logo'),
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No logo file uploaded',
          },
        });
      }

      const branding = await BrandingService.uploadLogo(req.params.id, req.file);

      return res.status(200).json({
        message: 'Logo uploaded successfully',
        data: branding,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: {
          code: 'LOGO_UPLOAD_FAILED',
          message: error.message,
        },
      });
    }
  }
);

/**
 * POST /api/v1/branding/:id/activate
 * Set branding as active (admin only)
 */
router.post('/:id/activate', requireRole(ADMIN_ROLES), async (req: any, res) => {
  try {
    const branding = await BrandingService.setActive(req.params.id);

    return res.status(200).json({
      message: 'Branding activated',
      data: branding,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'ACTIVATE_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * DELETE /api/v1/branding/:id
 * Delete branding profile (admin only)
 */
router.delete('/:id', requireRole(ADMIN_ROLES), async (req: any, res) => {
  try {
    const branding = await BrandingService.deleteBranding(req.params.id);

    return res.status(200).json({
      message: 'Branding profile deleted',
      data: branding,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/branding/:id/generate-css
 * Generate theme CSS (admin only)
 */
router.post('/:id/generate-css', requireRole(ADMIN_ROLES), async (req: any, res) => {
  try {
    const css = await ColorPaletteService.generateThemeCSS(req.params.id);

    return res.status(200).json({
      message: 'CSS generated',
      data: { css },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'CSS_GENERATION_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/branding/theme-presets
 * Get all theme presets (available to all)
 */
router.get('/theme-presets', async (_req: any, res) => {
  try {
    const presets = await ThemePresetService.getAllPresets();
    return res.status(200).json({ data: presets });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_PRESETS_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/branding/theme-presets
 * Create custom theme preset (admin only)
 */
router.post('/theme-presets', requireRole(ADMIN_ROLES), validateBody(createPresetSchema), async (req: any, res) => {
  try {
    const preset = await ThemePresetService.createCustomPreset({
      ...req.body,
      created_by_id: req.user.id,
    });

    return res.status(201).json({
      message: 'Theme preset created',
      data: preset,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'CREATE_PRESET_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/branding/:id/apply-preset
 * Apply theme preset to branding profile (admin only)
 */
router.post('/:id/apply-preset', requireRole(ADMIN_ROLES), validateBody(applyPresetSchema), async (req: any, res) => {
  try {
    const branding = await ThemePresetService.applyPreset(req.body.presetId, req.params.id);

    return res.status(200).json({
      message: 'Theme preset applied',
      data: branding,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'APPLY_PRESET_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/branding/theme-presets/seed
 * Seed built-in theme presets (admin only)
 */
router.post('/theme-presets/seed', requireRole(ADMIN_ROLES), async (_req: any, res) => {
  try {
    const created = await ThemePresetService.seedBuiltinThemes();

    return res.status(201).json({
      message: `${created.length} built-in themes created`,
      data: created,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'SEED_THEMES_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/branding/receipt-preview
 * Get receipt branding data
 */
router.get('/receipt-preview', async (_req: any, res) => {
  try {
    const branding = await ReceiptBrandingService.getBrandingForReceipt();
    return res.status(200).json({ data: branding });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_RECEIPT_BRANDING_FAILED',
        message: error.message,
      },
    });
  }
});

export default router;

