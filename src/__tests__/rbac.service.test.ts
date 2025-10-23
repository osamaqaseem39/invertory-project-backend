import { UserRole } from '@prisma/client';
import { RBACService } from '../services/rbac.service';

describe('RBACService - Role Creation Matrix', () => {
  describe('canCreate', () => {
    it('owner can create all roles', () => {
      const owner = UserRole.owner_ultimate_super_admin;
      expect(RBACService.canCreate(owner, UserRole.owner_ultimate_super_admin)).toBe(true);
      expect(RBACService.canCreate(owner, UserRole.admin)).toBe(true);
      expect(RBACService.canCreate(owner, UserRole.cashier)).toBe(true);
      expect(RBACService.canCreate(owner, UserRole.inventory_manager)).toBe(true);
      expect(RBACService.canCreate(owner, UserRole.guest)).toBe(true);
    });

    it('admin can create cashier and inventory_manager', () => {
      const admin = UserRole.admin;
      expect(RBACService.canCreate(admin, UserRole.owner_ultimate_super_admin)).toBe(false);
      expect(RBACService.canCreate(admin, UserRole.admin)).toBe(false);
      expect(RBACService.canCreate(admin, UserRole.cashier)).toBe(true);
      expect(RBACService.canCreate(admin, UserRole.inventory_manager)).toBe(true);
      expect(RBACService.canCreate(admin, UserRole.guest)).toBe(false);
    });

    it('cashier cannot create any users', () => {
      const cashier = UserRole.cashier;
      expect(RBACService.canCreate(cashier, UserRole.owner_ultimate_super_admin)).toBe(false);
      expect(RBACService.canCreate(cashier, UserRole.admin)).toBe(false);
      expect(RBACService.canCreate(cashier, UserRole.cashier)).toBe(false);
      expect(RBACService.canCreate(cashier, UserRole.inventory_manager)).toBe(false);
      expect(RBACService.canCreate(cashier, UserRole.guest)).toBe(false);
    });

    it('inventory_manager cannot create any users', () => {
      const im = UserRole.inventory_manager;
      expect(RBACService.canCreate(im, UserRole.owner_ultimate_super_admin)).toBe(false);
      expect(RBACService.canCreate(im, UserRole.admin)).toBe(false);
      expect(RBACService.canCreate(im, UserRole.cashier)).toBe(false);
      expect(RBACService.canCreate(im, UserRole.inventory_manager)).toBe(false);
      expect(RBACService.canCreate(im, UserRole.guest)).toBe(false);
    });

    it('guest cannot create any users', () => {
      const guest = UserRole.guest;
      expect(RBACService.canCreate(guest, UserRole.owner_ultimate_super_admin)).toBe(false);
      expect(RBACService.canCreate(guest, UserRole.admin)).toBe(false);
      expect(RBACService.canCreate(guest, UserRole.cashier)).toBe(false);
      expect(RBACService.canCreate(guest, UserRole.inventory_manager)).toBe(false);
      expect(RBACService.canCreate(guest, UserRole.guest)).toBe(false);
    });
  });

  describe('canUpdate', () => {
    const userId1 = '123e4567-e89b-12d3-a456-426614174000';
    const userId2 = '123e4567-e89b-12d3-a456-426614174001';

    it('users can always update themselves', () => {
      expect(RBACService.canUpdate(UserRole.guest, userId1, userId1, UserRole.guest)).toBe(true);
      expect(RBACService.canUpdate(UserRole.cashier, userId1, userId1, UserRole.cashier)).toBe(true);
    });

    it('owner can update anyone', () => {
      const owner = UserRole.owner_ultimate_super_admin;
      expect(RBACService.canUpdate(owner, userId1, userId2, UserRole.owner_ultimate_super_admin)).toBe(true);
      expect(RBACService.canUpdate(owner, userId1, userId2, UserRole.admin)).toBe(true);
      expect(RBACService.canUpdate(owner, userId1, userId2, UserRole.cashier)).toBe(true);
    });

    it('admin can update cashier and inventory_manager', () => {
      const admin = UserRole.admin;
      expect(RBACService.canUpdate(admin, userId1, userId2, UserRole.cashier)).toBe(true);
      expect(RBACService.canUpdate(admin, userId1, userId2, UserRole.inventory_manager)).toBe(true);
      expect(RBACService.canUpdate(admin, userId1, userId2, UserRole.owner_ultimate_super_admin)).toBe(false);
      expect(RBACService.canUpdate(admin, userId1, userId2, UserRole.admin)).toBe(false);
    });

    it('guest can only update self', () => {
      const guest = UserRole.guest;
      expect(RBACService.canUpdate(guest, userId1, userId1, UserRole.guest)).toBe(true);
      expect(RBACService.canUpdate(guest, userId1, userId2, UserRole.guest)).toBe(false);
    });
  });

  describe('Permission checks', () => {
    it('only owner can delete users', () => {
      expect(RBACService.canDelete(UserRole.owner_ultimate_super_admin)).toBe(true);
      expect(RBACService.canDelete(UserRole.admin)).toBe(false);
      expect(RBACService.canDelete(UserRole.cashier)).toBe(false);
      expect(RBACService.canDelete(UserRole.guest)).toBe(false);
    });

    it('only owner and admin can list users', () => {
      expect(RBACService.canListUsers(UserRole.owner_ultimate_super_admin)).toBe(true);
      expect(RBACService.canListUsers(UserRole.admin)).toBe(true);
      expect(RBACService.canListUsers(UserRole.cashier)).toBe(false);
      expect(RBACService.canListUsers(UserRole.guest)).toBe(false);
    });

    it('only owner can change roles', () => {
      expect(RBACService.canChangeRole(UserRole.owner_ultimate_super_admin)).toBe(true);
      expect(RBACService.canChangeRole(UserRole.admin)).toBe(false);
    });

    it('only owner can change status', () => {
      expect(RBACService.canChangeStatus(UserRole.owner_ultimate_super_admin)).toBe(true);
      expect(RBACService.canChangeStatus(UserRole.admin)).toBe(false);
    });

    it('only owner can view audit logs', () => {
      expect(RBACService.canViewAuditLogs(UserRole.owner_ultimate_super_admin)).toBe(true);
      expect(RBACService.canViewAuditLogs(UserRole.admin)).toBe(false);
    });
  });
});





