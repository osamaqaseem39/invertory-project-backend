import { UserRole } from '@prisma/client';
import { AuthorizationError } from '../utils/errors';

/**
 * RBAC Service - Role-Based Access Control
 * Enforces the role creation matrix and permission checks
 */

export class RBACService {
  /**
   * Role Creation Matrix
   * Defines which roles can create which other roles
   */
  private static readonly ROLE_CREATION_MATRIX: Record<UserRole, UserRole[]> = {
    master_admin: [
      UserRole.master_admin,
      UserRole.owner_ultimate_super_admin,
      UserRole.admin,
      UserRole.cashier,
      UserRole.inventory_manager,
      UserRole.guest,
    ],
    owner_ultimate_super_admin: [
      UserRole.owner_ultimate_super_admin,
      UserRole.admin,
      UserRole.cashier,
      UserRole.inventory_manager,
      UserRole.guest,
    ],
    admin: [
      UserRole.cashier,
      UserRole.inventory_manager,
    ],
    cashier: [],
    inventory_manager: [],
    guest: [],
  };

  /**
   * Role Hierarchy (higher number = more permissions)
   */
  private static readonly ROLE_HIERARCHY: Record<UserRole, number> = {
    master_admin: 150,
    owner_ultimate_super_admin: 100,
    admin: 50,
    inventory_manager: 20,
    cashier: 10,
    guest: 1,
  };

  /**
   * Check if a role can create another role
   */
  static canCreate(creatorRole: UserRole, targetRole: UserRole): boolean {
    const allowedRoles = this.ROLE_CREATION_MATRIX[creatorRole] || [];
    return allowedRoles.includes(targetRole);
  }

  /**
   * Check if a role can update another user
   * Owner can update anyone (including other owners)
   * Admin can update cashier/inventory_manager only
   * Others can only update themselves (limited fields)
   */
  static canUpdate(actorRole: UserRole, actorId: string, targetId: string, targetRole: UserRole): boolean {
    // Can always update self (limited fields enforced elsewhere)
    if (actorId === targetId) {
      return true;
    }

    // Owner can update anyone
    if (actorRole === UserRole.owner_ultimate_super_admin) {
      return true;
    }

    // Admin can update cashier and inventory_manager
    if (actorRole === UserRole.admin) {
      return targetRole === UserRole.cashier || targetRole === UserRole.inventory_manager;
    }

    return false;
  }

  /**
   * Check if a role can delete another user
   * Only owner can delete users
   */
  static canDelete(actorRole: UserRole): boolean {
    return actorRole === UserRole.owner_ultimate_super_admin;
  }

  /**
   * Check if a role can view another user
   * Owner can view all
   * Admin can view cashier/inventory_manager
   * Others can only view self
   */
  static canView(actorRole: UserRole, actorId: string, targetId: string, targetRole: UserRole): boolean {
    // Can always view self
    if (actorId === targetId) {
      return true;
    }

    // Owner can view all
    if (actorRole === UserRole.owner_ultimate_super_admin) {
      return true;
    }

    // Admin can view cashier and inventory_manager
    if (actorRole === UserRole.admin) {
      return targetRole === UserRole.cashier || targetRole === UserRole.inventory_manager;
    }

    return false;
  }

  /**
   * Check if a role can list users
   * Only owner and admin can list users
   */
  static canListUsers(actorRole: UserRole): boolean {
    return actorRole === UserRole.owner_ultimate_super_admin || actorRole === UserRole.admin;
  }

  /**
   * Check if a role can change another user's role
   * Only owner can change roles
   */
  static canChangeRole(actorRole: UserRole): boolean {
    return actorRole === UserRole.owner_ultimate_super_admin;
  }

  /**
   * Check if a role can activate/deactivate users
   * Only owner can change user status
   */
  static canChangeStatus(actorRole: UserRole): boolean {
    return actorRole === UserRole.owner_ultimate_super_admin;
  }

  /**
   * Check if a role can view audit logs
   * Only owner can view audit logs
   */
  static canViewAuditLogs(actorRole: UserRole): boolean {
    return actorRole === UserRole.owner_ultimate_super_admin;
  }

  /**
   * Get allowed roles that a creator can create
   */
  static getAllowedCreationRoles(creatorRole: UserRole): UserRole[] {
    return this.ROLE_CREATION_MATRIX[creatorRole] || [];
  }

  /**
   * Enforce creation permission (throws if not allowed)
   */
  static enforceCanCreate(creatorRole: UserRole, targetRole: UserRole): void {
    if (!this.canCreate(creatorRole, targetRole)) {
      throw new AuthorizationError(
        `Role '${creatorRole}' is not authorized to create users with role '${targetRole}'`
      );
    }
  }

  /**
   * Enforce update permission (throws if not allowed)
   */
  static enforceCanUpdate(actorRole: UserRole, actorId: string, targetId: string, targetRole: UserRole): void {
    if (!this.canUpdate(actorRole, actorId, targetId, targetRole)) {
      throw new AuthorizationError('You do not have permission to update this user');
    }
  }

  /**
   * Enforce delete permission (throws if not allowed)
   */
  static enforceCanDelete(actorRole: UserRole): void {
    if (!this.canDelete(actorRole)) {
      throw new AuthorizationError('Only owners can delete users');
    }
  }

  /**
   * Enforce view permission (throws if not allowed)
   */
  static enforceCanView(actorRole: UserRole, actorId: string, targetId: string, targetRole: UserRole): void {
    if (!this.canView(actorRole, actorId, targetId, targetRole)) {
      throw new AuthorizationError('You do not have permission to view this user');
    }
  }

  /**
   * Enforce list users permission (throws if not allowed)
   */
  static enforceCanListUsers(actorRole: UserRole): void {
    if (!this.canListUsers(actorRole)) {
      throw new AuthorizationError('You do not have permission to list users');
    }
  }

  /**
   * Enforce role change permission (throws if not allowed)
   */
  static enforceCanChangeRole(actorRole: UserRole): void {
    if (!this.canChangeRole(actorRole)) {
      throw new AuthorizationError('Only owners can change user roles');
    }
  }

  /**
   * Enforce status change permission (throws if not allowed)
   */
  static enforceCanChangeStatus(actorRole: UserRole): void {
    if (!this.canChangeStatus(actorRole)) {
      throw new AuthorizationError('Only owners can activate/deactivate users');
    }
  }

  /**
   * Enforce audit log view permission (throws if not allowed)
   */
  static enforceCanViewAuditLogs(actorRole: UserRole): void {
    if (!this.canViewAuditLogs(actorRole)) {
      throw new AuthorizationError('Only owners can view audit logs');
    }
  }

  /**
   * Compare role hierarchy
   */
  static isHigherOrEqualRole(role1: UserRole, role2: UserRole): boolean {
    return this.ROLE_HIERARCHY[role1] >= this.ROLE_HIERARCHY[role2];
  }

  /**
   * Check if a role can manage clients (master admin only)
   */
  static canManageClients(actorRole: UserRole): boolean {
    return actorRole === UserRole.master_admin;
  }

  /**
   * Check if a role can view client data (master admin only)
   */
  static canViewClientData(actorRole: UserRole): boolean {
    return actorRole === UserRole.master_admin;
  }

  /**
   * Check if a role can respond to client messages (master admin only)
   */
  static canRespondToMessages(actorRole: UserRole): boolean {
    return actorRole === UserRole.master_admin;
  }

  /**
   * Check if a role can manage billing (master admin only)
   */
  static canManageBilling(actorRole: UserRole): boolean {
    return actorRole === UserRole.master_admin;
  }

  /**
   * Enforce client management permission (throws if not allowed)
   */
  static enforceCanManageClients(actorRole: UserRole): void {
    if (!this.canManageClients(actorRole)) {
      throw new AuthorizationError('Only master admin can manage clients');
    }
  }

  /**
   * Enforce client data view permission (throws if not allowed)
   */
  static enforceCanViewClientData(actorRole: UserRole): void {
    if (!this.canViewClientData(actorRole)) {
      throw new AuthorizationError('Only master admin can view client data');
    }
  }

  /**
   * Enforce message response permission (throws if not allowed)
   */
  static enforceCanRespondToMessages(actorRole: UserRole): void {
    if (!this.canRespondToMessages(actorRole)) {
      throw new AuthorizationError('Only master admin can respond to messages');
    }
  }

  /**
   * Enforce billing management permission (throws if not allowed)
   */
  static enforceCanManageBilling(actorRole: UserRole): void {
    if (!this.canManageBilling(actorRole)) {
      throw new AuthorizationError('Only master admin can manage billing');
    }
  }
}





