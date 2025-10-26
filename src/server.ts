import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import path from 'path';
import config from './config';
import logger from './utils/logger';
import { connectDatabase, disconnectDatabase } from './database/client';
import { generalLimiter } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import auditRoutes from './routes/audit.routes';
import meRoutes from './routes/me.routes';
import productRoutes from './routes/product.routes';
import sessionRoutes from './routes/session.routes';
import inventoryRoutes from './routes/inventory.routes';
import salesRoutes from './routes/sales.routes';
import professionalPOSRoutes from './routes/professional-pos.routes';
import receiptAnalyticsRoutes from './routes/receipt-analytics.routes';
import ocrRoutes from './routes/ocr.routes';
import notificationRoutes from './routes/notification.routes';
import chatbotRoutes from './routes/chatbot.routes';
import brandingRoutes from './routes/branding.routes';
import licensingRoutes from './routes/licensing.routes';
import clientManagementRoutes from './routes/client-management.routes';
import clientMessagingRoutes from './routes/client-messaging.routes';
import clientNotificationRoutes from './routes/client-notifications.routes';
import clientSyncRoutes from './routes/client-sync.routes';
import advancedLicenseRoutes from './routes/advanced-license.routes';
import billingAnalyticsRoutes from './routes/billing-analytics.routes';
// import masterAnalyticsRoutes from './routes/master-analytics.routes';
import mvpSystemRoutes from './routes/mvp-system.routes';

// Bootstrap utilities
import prisma from './database/client';
import { StockMonitorService, NotificationCleanupService } from './services/stock-monitor.service';

const app = express();

// ===== MIDDLEWARE =====

// Security
app.use(helmet());
app.use(cors({
  origin: config.env === 'development' 
    ? '*' 
    : [
        'http://localhost:3000', 
        'http://localhost:5173',
        'https://ums.plivix-tech.com',
        process.env.CORS_ORIGIN!
      ],
  credentials: true,
}));

// Logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// ===== STATIC FILES =====

// Serve frontend static files
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// ===== ROUTES =====

const API_PREFIX = `/api/${config.apiVersion}`;

// Health check (no auth required)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
    environment: config.env,
  });
});

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/audit`, auditRoutes);
app.use(`${API_PREFIX}/me`, meRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/sessions`, sessionRoutes);
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/sales`, salesRoutes);
app.use(`${API_PREFIX}/professional-pos`, professionalPOSRoutes);
app.use(`${API_PREFIX}`, receiptAnalyticsRoutes);
app.use(`${API_PREFIX}/ocr`, ocrRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/chatbot`, chatbotRoutes);
app.use(`${API_PREFIX}/branding`, brandingRoutes);
app.use(`${API_PREFIX}/licensing`, licensingRoutes);
app.use(`${API_PREFIX}/client-management`, clientManagementRoutes);
app.use(`${API_PREFIX}/client-messaging`, clientMessagingRoutes);
app.use(`${API_PREFIX}/client-notifications`, clientNotificationRoutes);
app.use(`${API_PREFIX}/client-sync`, clientSyncRoutes);
app.use(`${API_PREFIX}/advanced-license`, advancedLicenseRoutes);
app.use(`${API_PREFIX}/billing-analytics`, billingAnalyticsRoutes);
// app.use(`${API_PREFIX}/master-analytics`, masterAnalyticsRoutes);
app.use(`${API_PREFIX}/mvp-system`, mvpSystemRoutes);

// Root info (API info)
app.get('/api', (_req, res) => {
  res.json({
    name: 'User Management System API',
    version: config.apiVersion,
      endpoints: {
        health: '/health',
        auth: `${API_PREFIX}/auth`,
        users: `${API_PREFIX}/users`,
        sessions: `${API_PREFIX}/sessions`,
        audit: `${API_PREFIX}/audit`,
        me: `${API_PREFIX}/me`,
        products: `${API_PREFIX}/products`,
        inventory: `${API_PREFIX}/inventory`,
        sales: `${API_PREFIX}/sales`,
        professionalPOS: `${API_PREFIX}/professional-pos`,
        receipts: `${API_PREFIX}/receipts`,
        analytics: `${API_PREFIX}/analytics`,
        settings: `${API_PREFIX}/settings`,
        ocr: `${API_PREFIX}/ocr`,
        notifications: `${API_PREFIX}/notifications`,
        chatbot: `${API_PREFIX}/chatbot`,
        branding: `${API_PREFIX}/branding`,
        licensing: `${API_PREFIX}/licensing`,
        clientManagement: `${API_PREFIX}/client-management`,
        clientMessaging: `${API_PREFIX}/client-messaging`,
        clientNotifications: `${API_PREFIX}/client-notifications`,
        clientSync: `${API_PREFIX}/client-sync`,
    advancedLicense: `${API_PREFIX}/advanced-license`,
    billingAnalytics: `${API_PREFIX}/billing-analytics`,
    // masterAnalytics: `${API_PREFIX}/master-analytics`,
    mvpSystem: `${API_PREFIX}/mvp-system`,
      },
  });
});

// ===== ERROR HANDLING =====

app.use(notFoundHandler);
app.use(errorHandler);

// Serve frontend for all non-API routes (SPA routing) - must be after error handlers
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ===== BOOTSTRAP =====

async function checkBootstrap() {
  try {
    const userCount = await prisma.user.count();
    
    if (userCount === 0 && config.bootstrap.enabled) {
      logger.warn('');
      logger.warn('═══════════════════════════════════════════════════════════');
      logger.warn('🚀 BOOTSTRAP MODE ENABLED - No users found in database');
      logger.warn('═══════════════════════════════════════════════════════════');
      logger.warn('');
      logger.warn('To create the first owner, make a POST request to:');
      logger.warn(`  ${API_PREFIX}/auth/register`);
      logger.warn('');
      logger.warn('With the following body:');
      logger.warn(JSON.stringify({
        username: 'admin',
        email: 'admin@example.com',
        display_name: 'System Administrator',
        password: 'YourSecurePassword123!',
        bootstrap_token: config.bootstrap.token,
      }, null, 2));
      logger.warn('');
      logger.warn('Example using curl:');
      logger.warn(`curl -X POST http://localhost:${config.port}${API_PREFIX}/auth/register \\`);
      logger.warn('  -H "Content-Type: application/json" \\');
      logger.warn('  -d \'{"username":"admin","email":"admin@example.com","display_name":"Admin","password":"SecurePass123!","bootstrap_token":"' + config.bootstrap.token + '"}\'');
      logger.warn('');
      logger.warn('═══════════════════════════════════════════════════════════');
      logger.warn('');
    } else if (userCount > 0) {
      logger.info(`✅ Database initialized with ${userCount} user(s)`);
    }
  } catch (error) {
    logger.error({ error }, 'Failed to check bootstrap status');
  }
}

// ===== SERVER STARTUP =====

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Check bootstrap status
    await checkBootstrap();

    // Start server
    app.listen(config.port, () => {
      logger.info('');
      logger.info('═══════════════════════════════════════════════════════════');
      logger.info(`🚀 Server started successfully`);
      logger.info(`📍 Environment: ${config.env}`);
      logger.info(`🌐 Server: http://localhost:${config.port}`);
      logger.info(`📡 API: http://localhost:${config.port}${API_PREFIX}`);
      logger.info(`🏥 Health: http://localhost:${config.port}/health`);
      logger.info('═══════════════════════════════════════════════════════════');
      logger.info('');

      // Start background services
      logger.info('🔧 Starting background services...');
      StockMonitorService.startMonitoring();
      NotificationCleanupService.startCleanup();
      logger.info('✅ Background services started');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// ===== GRACEFUL SHUTDOWN =====

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default app;

