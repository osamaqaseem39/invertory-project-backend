import { UserRole } from '@prisma/client';
import { ProductRBACService } from '../services/product.rbac.service';

describe('ProductRBACService - Product Permissions', () => {
  describe('canCreate', () => {
    it('owner can create products', () => {
      expect(ProductRBACService.canCreate(UserRole.owner_ultimate_super_admin)).toBe(true);
    });

    it('admin can create products', () => {
      expect(ProductRBACService.canCreate(UserRole.admin)).toBe(true);
    });

    it('inventory_manager can create products', () => {
      expect(ProductRBACService.canCreate(UserRole.inventory_manager)).toBe(true);
    });

    it('cashier cannot create products', () => {
      expect(ProductRBACService.canCreate(UserRole.cashier)).toBe(false);
    });

    it('guest cannot create products', () => {
      expect(ProductRBACService.canCreate(UserRole.guest)).toBe(false);
    });
  });

  describe('canUpdate', () => {
    it('owner can update products', () => {
      expect(ProductRBACService.canUpdate(UserRole.owner_ultimate_super_admin)).toBe(true);
    });

    it('admin can update products', () => {
      expect(ProductRBACService.canUpdate(UserRole.admin)).toBe(true);
    });

    it('inventory_manager can update products', () => {
      expect(ProductRBACService.canUpdate(UserRole.inventory_manager)).toBe(true);
    });

    it('cashier cannot update products', () => {
      expect(ProductRBACService.canUpdate(UserRole.cashier)).toBe(false);
    });

    it('guest cannot update products', () => {
      expect(ProductRBACService.canUpdate(UserRole.guest)).toBe(false);
    });
  });

  describe('canArchive', () => {
    it('owner can archive products', () => {
      expect(ProductRBACService.canArchive(UserRole.owner_ultimate_super_admin)).toBe(true);
    });

    it('admin can archive products', () => {
      expect(ProductRBACService.canArchive(UserRole.admin)).toBe(true);
    });

    it('inventory_manager cannot archive products', () => {
      expect(ProductRBACService.canArchive(UserRole.inventory_manager)).toBe(false);
    });

    it('cashier cannot archive products', () => {
      expect(ProductRBACService.canArchive(UserRole.cashier)).toBe(false);
    });

    it('guest cannot archive products', () => {
      expect(ProductRBACService.canArchive(UserRole.guest)).toBe(false);
    });
  });

  describe('canRead', () => {
    it('all roles can read products', () => {
      expect(ProductRBACService.canRead(UserRole.owner_ultimate_super_admin)).toBe(true);
      expect(ProductRBACService.canRead(UserRole.admin)).toBe(true);
      expect(ProductRBACService.canRead(UserRole.inventory_manager)).toBe(true);
      expect(ProductRBACService.canRead(UserRole.cashier)).toBe(true);
      expect(ProductRBACService.canRead(UserRole.guest)).toBe(true);
    });
  });

  describe('getAllowedFields', () => {
    it('guest gets limited fields', () => {
      const fields = ProductRBACService.getAllowedFields(UserRole.guest);
      expect(fields).toContain('id');
      expect(fields).toContain('sku');
      expect(fields).toContain('name');
      expect(fields).toContain('price');
      expect(fields).not.toContain('cost');
      expect(fields).not.toContain('description');
    });

    it('other roles get all fields', () => {
      const ownerFields = ProductRBACService.getAllowedFields(UserRole.owner_ultimate_super_admin);
      expect(ownerFields).toContain('cost');
      expect(ownerFields).toContain('description');
      expect(ownerFields).toContain('images');

      const cashierFields = ProductRBACService.getAllowedFields(UserRole.cashier);
      expect(cashierFields).toContain('cost');
      expect(cashierFields).toContain('description');
    });
  });
});





