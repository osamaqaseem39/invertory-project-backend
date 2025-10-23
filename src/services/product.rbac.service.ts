import { UserRole } from '@prisma/client';
import { AuthorizationError } from '../utils/errors';

/**
 * Product RBAC Service
 * Enforces role-based permissions for product operations
 */
export class ProductRBACService {
  /**
   * Roles that can create products
   */
  private static readonly CAN_CREATE_ROLES: UserRole[] = [
    UserRole.owner_ultimate_super_admin,
    UserRole.admin,
    UserRole.inventory_manager,
  ];

  /**
   * Roles that can update products
   */
  private static readonly CAN_UPDATE_ROLES: UserRole[] = [
    UserRole.owner_ultimate_super_admin,
    UserRole.admin,
    UserRole.inventory_manager,
  ];

  /**
   * Roles that can archive/restore products
   */
  private static readonly CAN_ARCHIVE_ROLES: UserRole[] = [
    UserRole.owner_ultimate_super_admin,
    UserRole.admin,
  ];

  /**
   * Check if role can create products
   */
  static canCreate(role: UserRole): boolean {
    return this.CAN_CREATE_ROLES.includes(role);
  }

  /**
   * Check if role can update products
   */
  static canUpdate(role: UserRole): boolean {
    return this.CAN_UPDATE_ROLES.includes(role);
  }

  /**
   * Check if role can archive products
   */
  static canArchive(role: UserRole): boolean {
    return this.CAN_ARCHIVE_ROLES.includes(role);
  }

  /**
   * Check if role can view products (all roles can, but with different projections)
   */
  static canRead(_role: UserRole): boolean {
    return true; // All roles can read
  }

  /**
   * Get allowed fields for a role
   */
  static getAllowedFields(role: UserRole): string[] {
    // Guest gets limited fields
    if (role === UserRole.guest) {
      return ['id', 'sku', 'name', 'brand', 'category', 'price', 'is_active'];
    }

    // Everyone else gets full access
    return ['id', 'sku', 'barcode', 'name', 'description', 'brand', 'category', 'price', 'cost', 'uom', 'is_active', 'is_archived', 'created_at', 'updated_at', 'created_by', 'updated_by', 'images'];
  }

  /**
   * Enforce create permission
   */
  static enforceCanCreate(role: UserRole): void {
    if (!this.canCreate(role)) {
      throw new AuthorizationError('You do not have permission to create products');
    }
  }

  /**
   * Enforce update permission
   */
  static enforceCanUpdate(role: UserRole): void {
    if (!this.canUpdate(role)) {
      throw new AuthorizationError('You do not have permission to update products');
    }
  }

  /**
   * Enforce archive permission
   */
  static enforceCanArchive(role: UserRole): void {
    if (!this.canArchive(role)) {
      throw new AuthorizationError('You do not have permission to archive products');
    }
  }
}

