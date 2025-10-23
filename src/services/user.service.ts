import { User, UserRole, AuditAction, Prisma } from '@prisma/client';
import prisma from '../database/client';
import { hashPassword } from '../utils/password';
import { ConflictError, NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';
import { RBACService } from './rbac.service';
import { AuditService } from './audit.service';
import logger from '../utils/logger';

interface CreateUserParams {
  username: string;
  email: string;
  display_name: string;
  password: string;
  role: UserRole;
  createdById: string;
}

interface UpdateUserParams {
  username?: string;
  email?: string;
  display_name?: string;
  role?: UserRole;
}

interface ListUsersParams {
  q?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface AuthContext {
  ipAddress?: string;
  userAgent?: string;
}

export class UserService {
  /**
   * Create a new user with RBAC enforcement
   */
  static async createUser(
    params: CreateUserParams,
    context: AuthContext
  ): Promise<Omit<User, 'password_hash'>> {
    // Get creator
    const creator = await prisma.user.findUnique({
      where: { id: params.createdById },
    });

    if (!creator) {
      throw new NotFoundError('Creator user');
    }

    // Enforce RBAC: Can creator create this role?
    RBACService.enforceCanCreate(creator.role, params.role);

    // Check for existing username or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: params.username },
          { email: params.email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === params.username) {
        throw new ConflictError('Username already exists', { field: 'username' });
      }
      if (existingUser.email === params.email) {
        throw new ConflictError('Email already exists', { field: 'email' });
      }
    }

    // Hash password
    const passwordHash = await hashPassword(params.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: params.username,
        email: params.email,
        display_name: params.display_name,
        password_hash: passwordHash,
        role: params.role,
        created_by_id: params.createdById,
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: params.createdById,
      targetUserId: user.id,
      action: AuditAction.CREATE_USER,
      metadata: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({
      userId: user.id,
      username: user.username,
      role: user.role,
      createdBy: creator.username,
    }, 'User created');

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by ID with RBAC enforcement
   */
  static async getUserById(
    userId: string,
    actorId: string,
    actorRole: UserRole
  ): Promise<Omit<User, 'password_hash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        created_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Enforce RBAC: Can actor view this user?
    RBACService.enforceCanView(actorRole, actorId, userId, user.role);

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password_hash'>;
  }

  /**
   * List users with RBAC enforcement
   */
  static async listUsers(
    actorRole: UserRole,
    params: ListUsersParams
  ): Promise<{
    data: Omit<User, 'password_hash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Enforce RBAC: Can actor list users?
    RBACService.enforceCanListUsers(actorRole);

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // Search query
    if (params.q) {
      where.OR = [
        { username: { contains: params.q, mode: 'insensitive' } },
        { email: { contains: params.q, mode: 'insensitive' } },
        { display_name: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (params.role !== undefined) {
      where.role = params.role;
    }

    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }

    // Admin can only see cashier and inventory_manager
    if (actorRole === UserRole.admin) {
      where.role = {
        in: [UserRole.cashier, UserRole.inventory_manager],
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          display_name: true,
          role: true,
          is_active: true,
          created_by_id: true,
          created_at: true,
          updated_at: true,
          last_login_at: true,
          max_line_discount: true,
          max_cart_discount: true,
          can_approve_overrides: true,
          created_by: {
            select: {
              id: true,
              username: true,
              display_name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users as Omit<User, 'password_hash'>[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update user with RBAC enforcement
   */
  static async updateUser(
    userId: string,
    actorId: string,
    actorRole: UserRole,
    updates: UpdateUserParams,
    context: AuthContext
  ): Promise<Omit<User, 'password_hash'>> {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User');
    }

    // Enforce RBAC: Can actor update this user?
    RBACService.enforceCanUpdate(actorRole, actorId, userId, targetUser.role);

    // If updating self, restrict fields
    const isSelfUpdate = actorId === userId;
    if (isSelfUpdate) {
      // Self can only update display_name and username (not role)
      if (updates.role && updates.role !== targetUser.role) {
        throw new AuthorizationError('Cannot change your own role');
      }
    }

    // If updating role, enforce role change permission
    if (updates.role && updates.role !== targetUser.role) {
      RBACService.enforceCanChangeRole(actorRole);
      
      // Check if new role creation is allowed
      RBACService.enforceCanCreate(actorRole, updates.role);
    }

    // Check for username/email conflicts
    if (updates.username || updates.email) {
      const conflicts = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                updates.username ? { username: updates.username } : {},
                updates.email ? { email: updates.email } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          ],
        },
      });

      if (conflicts) {
        if (conflicts.username === updates.username) {
          throw new ConflictError('Username already exists', { field: 'username' });
        }
        if (conflicts.email === updates.email) {
          throw new ConflictError('Email already exists', { field: 'email' });
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // Audit log
    const changedFields = Object.keys(updates);
    await AuditService.createLog({
      actorUserId: actorId,
      targetUserId: userId,
      action: updates.role && updates.role !== targetUser.role 
        ? AuditAction.ROLE_CHANGE 
        : AuditAction.UPDATE_USER,
      metadata: {
        changes: updates,
        changedFields,
        oldRole: targetUser.role,
        newRole: updates.role,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({
      userId,
      actorId,
      changes: changedFields,
    }, 'User updated');

    const { password_hash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Update user status (activate/deactivate)
   */
  static async updateUserStatus(
    userId: string,
    actorId: string,
    actorRole: UserRole,
    isActive: boolean,
    context: AuthContext
  ): Promise<Omit<User, 'password_hash'>> {
    // Enforce RBAC: Can actor change status?
    RBACService.enforceCanChangeStatus(actorRole);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent self-deactivation
    if (actorId === userId && !isActive) {
      throw new AuthorizationError('Cannot deactivate your own account');
    }

    // Check for owner lockout prevention
    if (!isActive && user.role === UserRole.owner_ultimate_super_admin) {
      const activeOwnerCount = await prisma.user.count({
        where: {
          role: UserRole.owner_ultimate_super_admin,
          is_active: true,
          id: { not: userId },
        },
      });

      if (activeOwnerCount === 0) {
        throw new ValidationError('Cannot deactivate the last active owner');
      }
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { is_active: isActive },
    });

    // Revoke all refresh tokens if deactivating
    if (!isActive) {
      await prisma.refreshToken.deleteMany({
        where: { user_id: userId },
      });
    }

    // Audit log
    await AuditService.createLog({
      actorUserId: actorId,
      targetUserId: userId,
      action: isActive ? AuditAction.ACTIVATE_USER : AuditAction.DEACTIVATE_USER,
      metadata: {
        previous_status: user.is_active,
        new_status: isActive,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({
      userId,
      actorId,
      isActive,
    }, 'User status updated');

    const { password_hash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete user (soft delete preferred)
   */
  static async deleteUser(
    userId: string,
    actorId: string,
    actorRole: UserRole,
    context: AuthContext
  ): Promise<void> {
    // Enforce RBAC: Can actor delete users?
    RBACService.enforceCanDelete(actorRole);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent self-deletion
    if (actorId === userId) {
      throw new AuthorizationError('Cannot delete your own account');
    }

    // Check for owner lockout prevention
    if (user.role === UserRole.owner_ultimate_super_admin) {
      const activeOwnerCount = await prisma.user.count({
        where: {
          role: UserRole.owner_ultimate_super_admin,
          is_active: true,
          id: { not: userId },
        },
      });

      if (activeOwnerCount === 0) {
        throw new ValidationError('Cannot delete the last active owner');
      }
    }

    // Soft delete (deactivate)
    await prisma.user.update({
      where: { id: userId },
      data: { is_active: false },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { user_id: userId },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: actorId,
      targetUserId: userId,
      action: AuditAction.DELETE_USER,
      metadata: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({
      userId,
      actorId,
      username: user.username,
    }, 'User deleted (soft delete)');
  }

  /**
   * Get user statistics for dashboard
   */
  static async getUserStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<UserRole, number>;
    recentUsers: User[];
  }> {
    const [totalUsers, activeUsers, usersByRole, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          display_name: true,
          role: true,
          is_active: true,
          created_at: true,
          last_login_at: true,
        },
      }),
    ]);

    const usersByRoleMap: Record<string, number> = {};
    usersByRole.forEach(item => {
      usersByRoleMap[item.role] = item._count;
    });

    return {
      totalUsers,
      activeUsers,
      usersByRole: usersByRoleMap as Record<UserRole, number>,
      recentUsers: recentUsers as User[],
    };
  }
}

