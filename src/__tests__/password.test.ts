import { hashPassword, verifyPassword, validatePasswordPolicy } from '../utils/password';
import { ValidationError } from '../utils/errors';

describe('Password utilities', () => {
  describe('validatePasswordPolicy', () => {
    it('should accept valid passwords', () => {
      expect(() => validatePasswordPolicy('ValidPass123')).not.toThrow();
      expect(() => validatePasswordPolicy('StrongP@ssw0rd')).not.toThrow();
      expect(() => validatePasswordPolicy('MySecurePass2023!')).not.toThrow();
    });

    it('should reject passwords shorter than 10 characters', () => {
      expect(() => validatePasswordPolicy('Short1A')).toThrow(ValidationError);
      expect(() => validatePasswordPolicy('Abc123')).toThrow(ValidationError);
    });

    it('should reject passwords without uppercase', () => {
      expect(() => validatePasswordPolicy('lowercase123')).toThrow(ValidationError);
    });

    it('should reject passwords without lowercase', () => {
      expect(() => validatePasswordPolicy('UPPERCASE123')).toThrow(ValidationError);
    });

    it('should reject passwords without digit or symbol', () => {
      expect(() => validatePasswordPolicy('NoDigitOrSymbol')).toThrow(ValidationError);
    });

    it('should accept passwords with symbols instead of digits', () => {
      expect(() => validatePasswordPolicy('ValidPass!@#')).not.toThrow();
    });
  });

  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify valid passwords', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      
      const isValid = await verifyPassword(hash, password);
      expect(isValid).toBe(true);
    });

    it('should reject invalid passwords', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(hash, 'WrongPassword123');
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      
      // But both should verify
      expect(await verifyPassword(hash1, password)).toBe(true);
      expect(await verifyPassword(hash2, password)).toBe(true);
    });
  });
});





