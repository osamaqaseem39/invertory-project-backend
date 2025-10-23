import { StockAlertService, NotificationService } from './notification.service';
import * as cron from 'node-cron';

export class StockMonitorService {
  private static monitoringTask: ReturnType<typeof cron.schedule> | null = null;
  private static isRunning = false;

  /**
   * Start stock monitoring background job
   * Runs every 30 minutes
   */
  static startMonitoring() {
    if (this.isRunning) {
      console.log('📊 Stock monitoring is already running');
      return;
    }

    console.log('📊 Starting stock monitoring service...');

    // Run immediately on start
    this.checkStockLevels();

    // Schedule to run every 30 minutes
    this.monitoringTask = cron.schedule('*/30 * * * *', async () => {
      console.log('📊 Running scheduled stock level check...');
      await this.checkStockLevels();
    });

    this.isRunning = true;
    console.log('✅ Stock monitoring service started (runs every 30 minutes)');
  }

  /**
   * Stop stock monitoring
   */
  static stopMonitoring() {
    if (this.monitoringTask) {
      this.monitoringTask.stop();
      this.monitoringTask = null;
      this.isRunning = false;
      console.log('🛑 Stock monitoring service stopped');
    }
  }

  /**
   * Manually trigger stock level check
   */
  static async checkStockLevels(): Promise<{
    checked: number;
    alertsTriggered: number;
  }> {
    try {
      const startTime = Date.now();
      
      const alertsTriggered = await StockAlertService.checkStockLevels();
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Stock check completed in ${duration}ms. Alerts triggered: ${alertsTriggered}`);

      return {
        checked: 1, // Could track number of products checked
        alertsTriggered,
      };
    } catch (error) {
      console.error('❌ Stock monitoring error:', error);
      throw error;
    }
  }

  /**
   * Get monitoring status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: new Date().toISOString(),
      schedule: 'Every 30 minutes',
    };
  }
}

/**
 * Cleanup service for old notifications
 */
export class NotificationCleanupService {
  private static cleanupTask: ReturnType<typeof cron.schedule> | null = null;

  /**
   * Start notification cleanup job
   * Runs daily at 2 AM
   */
  static startCleanup() {
    console.log('🧹 Starting notification cleanup service...');

    // Schedule to run daily at 2 AM
    this.cleanupTask = cron.schedule('0 2 * * *', async () => {
      console.log('🧹 Running scheduled notification cleanup...');
      await this.cleanupOldNotifications();
    });

    console.log('✅ Notification cleanup service started (runs daily at 2 AM)');
  }

  /**
   * Stop cleanup service
   */
  static stopCleanup() {
    if (this.cleanupTask) {
      this.cleanupTask.stop();
      this.cleanupTask = null;
      console.log('🛑 Notification cleanup service stopped');
    }
  }

  /**
   * Clean up old notifications
   */
  static async cleanupOldNotifications() {
    try {
      const deleted = await NotificationService.deleteOldNotifications(30);
      console.log(`🧹 Cleaned up ${deleted.count} old notifications`);
      return deleted;
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      throw error;
    }
  }
}

