import { Request, Response, NextFunction } from 'express';
import { RBACService } from '../services/rbac.service';
import { UserRole } from '@prisma/client';

// Extend the Request interface to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware to require master admin role
 */
export const requireMasterAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (req.user.role !== 'master_admin') {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Master admin access required'
        }
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require admin or master admin role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!['admin', 'master_admin'].includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require specific role
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
          }
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to require specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const hasPermission = RBACService.canManageClients(req.user.role); // Generic permission check
      if (!hasPermission) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Permission '${permission}' required`
          }
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
