import argon2 from 'argon2';
import { ValidationError } from './errors';

/**
 * Password policy: minimum 10 characters, mixed case + digit or symbol
 */
export const validatePasswordPolicy = (password: string): void => {
  if (password.length < 10) {
    throw new ValidationError('Password must be at least 10 characters long');
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase || !hasLowerCase) {
    throw new ValidationError('Password must contain both uppercase and lowercase letters');
  }

  if (!hasDigit && !hasSymbol) {
    throw new ValidationError('Password must contain at least one digit or symbol');
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  validatePasswordPolicy(password);
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
};

export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
};





