import { PrismaClient, NotificationType, NotificationPriority, UserRole, NotificationChannel } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNotificationParams {
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  metadata?: any;
  userId?: string;
  roleTarget?: UserRole;
  channels?: NotificationChannel[];
  createdById?: string;
  expiresAt?: Date;
}

export class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification(params: CreateNotificationParams) {
    const notification = await prisma.notification.create({
      data: {
        type: params.type,
        priority: params.priority || NotificationPriority.MEDIUM,
        title: params.title,
        message: params.message,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        action_url: params.actionUrl,
        metadata: params.metadata,
        user_id: params.userId,
        role_target: params.roleTarget,
        channels: params.channels || [NotificationChannel.IN_APP],
        created_by_id: params.createdById,
        expires_at: params.expiresAt,
      },
    });

    return notification;
  }

  /**
   * Create stock alert notification
   */
  static async createStockAlert(params: {
    productId: string;
    productName: string;
    productSku: string;
    currentStock: number;
    reorderLevel: number;
    alertType: NotificationType;
  }) {
    const { productId, productName, productSku, currentStock, reorderLevel, alertType } = params;

    // Determine priority based on stock level
    let priority: NotificationPriority;
    let title: string;

    if (currentStock === 0) {
      priority = NotificationPriority.CRITICAL;
      title = `🚨 OUT OF STOCK: ${productName}`;
    } else if (currentStock <= reorderLevel * 0.25) {
      priority = NotificationPriority.HIGH;
      title = `⚠️ CRITICAL LOW STOCK: ${productName}`;
    } else if (currentStock <= reorderLevel * 0.5) {
      priority = NotificationPriority.HIGH;
      title = `⚠️ LOW STOCK: ${productName}`;
    } else {
      priority = NotificationPriority.MEDIUM;
      title = `📦 Stock Alert: ${productName}`;
    }

    const message = `Stock level is ${currentStock} units (Reorder at: ${reorderLevel}). SKU: ${productSku}. Please reorder soon.`;

    // Create notification for inventory roles
    await this.createNotification({
      type: alertType,
      priority,
      title,
      message,
      resourceType: 'product',
      resourceId: productId,
      actionUrl: `/products/${productId}`,
      metadata: {
        product_sku: productSku,
        current_stock: currentStock,
        reorder_level: reorderLevel,
      },
      roleTarget: UserRole.inventory_manager,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });

    // Also notify owner and admin
    await this.createNotification({
      type: alertType,
      priority,
      title,
      message,
      resourceType: 'product',
      resourceId: productId,
      actionUrl: `/products/${productId}`,
      metadata: {
        product_sku: productSku,
        current_stock: currentStock,
        reorder_level: reorderLevel,
      },
      roleTarget: UserRole.owner_ultimate_super_admin,
      channels: [NotificationChannel.IN_APP],
    });

    await this.createNotification({
      type: alertType,
      priority,
      title,
      message,
      resourceType: 'product',
      resourceId: productId,
      actionUrl: `/products/${productId}`,
      metadata: {
        product_sku: productSku,
        current_stock: currentStock,
        reorder_level: reorderLevel,
      },
      roleTarget: UserRole.admin,
      channels: [NotificationChannel.IN_APP],
    });
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, filters?: {
    isRead?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
    page?: number;
    limit?: number;
  }) {
    const { isRead, type, priority, page = 1, limit = 50 } = filters || {};

    // Get user's role to include role-targeted notifications
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const where: any = {
      OR: [
        { user_id: userId },
        { role_target: user.role },
      ],
      is_dismissed: false,
    };

    if (isRead !== undefined) where.is_read = isRead;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    // Exclude expired notifications
    where.OR.push({
      expires_at: null,
    });
    where.OR.push({
      expires_at: {
        gt: new Date(),
      },
    });

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      unread: await prisma.notification.count({
        where: {
          OR: [
            { user_id: userId },
            { role_target: user.role },
          ],
          is_read: false,
          is_dismissed: false,
        },
      }),
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, _userId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return await prisma.notification.updateMany({
      where: {
        OR: [
          { user_id: userId },
          { role_target: user.role },
        ],
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  /**
   * Dismiss notification
   */
  static async dismissNotification(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        is_dismissed: true,
        dismissed_at: new Date(),
      },
    });
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await prisma.notification.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
        is_dismissed: true,
      },
    });
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return 0;
    }

    return await prisma.notification.count({
      where: {
        OR: [
          { user_id: userId },
          { role_target: user.role },
        ],
        is_read: false,
        is_dismissed: false,
      },
    });
  }
}

/**
 * Stock Alert Service
 */
export class StockAlertService {
  /**
   * Create or update stock alert configuration
   */
  static async configureAlert(params: {
    productId: string;
    alertType: NotificationType;
    threshold: number;
    notifyRoles?: UserRole[];
    cooldownHours?: number;
    createdById: string;
  }) {
    const { productId, alertType, threshold, notifyRoles, cooldownHours, createdById } = params;

    // Check if alert already exists
    const existing = await prisma.stockAlert.findUnique({
      where: {
        product_id_alert_type: {
          product_id: productId,
          alert_type: alertType,
        },
      },
    });

    if (existing) {
      // Update existing alert
      return await prisma.stockAlert.update({
        where: { id: existing.id },
        data: {
          threshold,
          notify_roles: notifyRoles || existing.notify_roles,
          cooldown_hours: cooldownHours || existing.cooldown_hours,
        },
      });
    } else {
      // Create new alert
      return await prisma.stockAlert.create({
        data: {
          product_id: productId,
          alert_type: alertType,
          threshold,
          notify_roles: notifyRoles || [UserRole.owner_ultimate_super_admin, UserRole.admin, UserRole.inventory_manager],
          cooldown_hours: cooldownHours || 24,
          created_by_id: createdById,
        },
      });
    }
  }

  /**
   * Check stock levels and trigger alerts
   */
  static async checkStockLevels(): Promise<number> {
    let alertsTriggered = 0;

    // Get all products with low stock
    const lowStockProducts = await prisma.product.findMany({
      where: {
        is_active: true,
        is_archived: false,
        stock_quantity: {
          lte: prisma.product.fields.reorder_level,
        },
      },
      include: {
        stock_alerts: {
          where: {
            is_active: true,
          },
        },
      },
    });

    for (const product of lowStockProducts) {
      // Determine alert type based on stock level
      let alertType: NotificationType;
      if (product.stock_quantity === 0) {
        alertType = NotificationType.STOCK_OUT;
      } else if (product.stock_quantity <= product.reorder_level * 0.25) {
        alertType = NotificationType.STOCK_CRITICAL;
      } else if (product.stock_quantity <= product.reorder_level * 0.5) {
        alertType = NotificationType.STOCK_LOW;
      } else {
        alertType = NotificationType.STOCK_REORDER;
      }

      // Check if we should trigger alert (cooldown check)
      const shouldTrigger = await this.shouldTriggerAlert(product.id, alertType);

      if (shouldTrigger) {
        // Create notification
        await NotificationService.createStockAlert({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          currentStock: product.stock_quantity,
          reorderLevel: product.reorder_level,
          alertType,
        });

        // Update alert trigger timestamp
        await this.updateAlertTrigger(product.id, alertType);

        alertsTriggered++;
      }
    }

    return alertsTriggered;
  }

  /**
   * Check if alert should be triggered (cooldown check)
   */
  private static async shouldTriggerAlert(productId: string, alertType: NotificationType): Promise<boolean> {
    const alert = await prisma.stockAlert.findUnique({
      where: {
        product_id_alert_type: {
          product_id: productId,
          alert_type: alertType,
        },
      },
    });

    if (!alert) {
      // Create default alert config
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { created_by_id: true },
      });

      if (product) {
        await this.configureAlert({
          productId,
          alertType,
          threshold: 0, // Will be set based on reorder_level
          createdById: product.created_by_id,
        });
      }

      return true; // Trigger on first detection
    }

    if (!alert.is_active) {
      return false;
    }

    if (!alert.last_triggered_at) {
      return true; // Never triggered before
    }

    // Check cooldown
    const hoursSinceLastTrigger =
      (Date.now() - alert.last_triggered_at.getTime()) / 1000 / 60 / 60;

    return hoursSinceLastTrigger >= alert.cooldown_hours;
  }

  /**
   * Update alert trigger timestamp
   */
  private static async updateAlertTrigger(productId: string, alertType: NotificationType) {
    await prisma.stockAlert.updateMany({
      where: {
        product_id: productId,
        alert_type: alertType,
      },
      data: {
        last_triggered_at: new Date(),
        trigger_count: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get stock alerts for a product
   */
  static async getProductAlerts(productId: string) {
    return await prisma.stockAlert.findMany({
      where: { product_id: productId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Disable stock alert
   */
  static async disableAlert(alertId: string) {
    return await prisma.stockAlert.update({
      where: { id: alertId },
      data: { is_active: false },
    });
  }

  /**
   * Enable stock alert
   */
  static async enableAlert(alertId: string) {
    return await prisma.stockAlert.update({
      where: { id: alertId },
      data: { is_active: true },
    });
  }
}

/**
 * Notification Preference Service
 */
export class NotificationPreferenceService {
  /**
   * Get user's notification preferences
   */
  static async getPreferences(userId: string) {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { user_id: userId },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          user_id: userId,
          enable_in_app: true,
          enable_email: true,
          enable_sms: false,
          enable_push: false,
          stock_alerts: true,
          po_alerts: true,
          payment_alerts: true,
          system_alerts: true,
        },
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(userId: string, preferences: {
    enable_in_app?: boolean;
    enable_email?: boolean;
    enable_sms?: boolean;
    enable_push?: boolean;
    stock_alerts?: boolean;
    po_alerts?: boolean;
    payment_alerts?: boolean;
    system_alerts?: boolean;
    quiet_hours_start?: number;
    quiet_hours_end?: number;
    daily_digest?: boolean;
    digest_time?: number;
  }) {
    return await prisma.notificationPreference.upsert({
      where: { user_id: userId },
      update: preferences,
      create: {
        user_id: userId,
        ...preferences,
      },
    });
  }

  /**
   * Check if user should receive notification
   */
  static async shouldNotifyUser(userId: string, type: NotificationType, channel: NotificationChannel): Promise<boolean> {
    const prefs = await this.getPreferences(userId);

    // Check channel enabled
    if (channel === NotificationChannel.IN_APP && !prefs.enable_in_app) return false;
    if (channel === NotificationChannel.EMAIL && !prefs.enable_email) return false;
    if (channel === NotificationChannel.SMS && !prefs.enable_sms) return false;
    if (channel === NotificationChannel.PUSH && !prefs.enable_push) return false;

    // Check notification type enabled
    if (type.toString().includes('STOCK') && !prefs.stock_alerts) return false;
    if (type.toString().includes('PO') && !prefs.po_alerts) return false;
    if (type.toString().includes('PAYMENT') && !prefs.payment_alerts) return false;
    if (type === NotificationType.SYSTEM_ALERT && !prefs.system_alerts) return false;

    // Check quiet hours
    if (prefs.quiet_hours_start !== null && prefs.quiet_hours_end !== null) {
      const currentHour = new Date().getHours();
      if (
        currentHour >= prefs.quiet_hours_start &&
        currentHour < prefs.quiet_hours_end
      ) {
        return false;
      }
    }

    return true;
  }
}

