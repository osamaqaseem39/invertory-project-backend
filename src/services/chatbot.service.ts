import { PrismaClient, ChatMessageRole } from '@prisma/client';
import Groq from 'groq-sdk';

const prisma = new PrismaClient();

// Initialize Groq client with free API (you can get API key from https://console.groq.com)
// For demo, using fallback mode with predefined responses
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'demo-mode';
const groq = GROQ_API_KEY !== 'demo-mode' ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// System knowledge base about POS and Inventory
const SYSTEM_CONTEXT = `You are a helpful AI assistant for an Inventory and POS Management System. 
You can answer questions about:

**INVENTORY MANAGEMENT:**
- Products: Add, edit, view, archive products. Each product has SKU, barcode, name, price, cost, stock levels
- Categories: Organize products into hierarchical categories
- Suppliers: Manage vendor information and contacts
- Stock Levels: Track stock_quantity, reorder_level, reorder_quantity, max_stock_level, location
- Stock Alerts: Automatic notifications when stock is low (≤ reorder_level)
- Stock Movements: Audit trail of all stock changes (IN, OUT, ADJUSTMENT, TRANSFER)
- Stock Adjustments: Manual stock corrections with approval workflow (PENDING → APPROVED/REJECTED)
- Purchase Orders (PO): Create PO → Submit → Approve → Receive goods
- Goods Receipt Notes (GRN): Receive stock against approved POs, update stock automatically
- OCR Scanner: Upload receipts/invoices to auto-extract products using OCR

**POINT OF SALE (POS):**
- POS Sessions: Start session with opening cash → Process sales → End session with closing cash
- Sales Transactions: Add products to cart, select customer, choose payment method (CASH, CARD, etc.)
- Customers: Individual and corporate customers with discount %, credit limits, VIP status
- Payments: Track payments with CASH, CARD, BANK_TRANSFER, CHECK, STORE_CREDIT
- Returns & Exchanges: Process refunds, partial returns, exchanges
- Receipts: Auto-generate, print, email, reprint receipts
- Cash Management: Paid In/Out, No Sale, Z-reports
- Discounts: Line-level and cart-level discounts with manager override
- Price Books: Promotional pricing, coupons, gift cards
- Loyalty Points: Earn and redeem points

**SALES & ANALYTICS:**
- Sales Orders: Create, confirm, process, ship, deliver orders
- Invoices: Generate invoices from sales orders
- Analytics: Sales trends, product performance, category analysis, payment methods
- Reports: Z-reports, X-reports, sales by hour, top items, discount leakage

**USER MANAGEMENT:**
- Roles: owner (full access), admin, inventory_manager, cashier, guest
- RBAC: Role-based access control for all features
- Sessions: Manage active sessions, revoke tokens
- 2FA: Two-factor authentication support
- Audit Logs: Complete audit trail of all actions

**NOTIFICATIONS:**
- Stock Alerts: Auto-notify when stock is low (every 30 min check)
- Purchase Orders: Approval notifications
- System Alerts: Updates and maintenance
- Preferences: Configure channels (in-app, email, SMS), quiet hours, daily digest

**TECHNICAL FEATURES:**
- Barcode Scanning: Camera-based barcode/QR scanning
- Multi-language: English and Arabic with RTL support
- Auto-numbering: PO, GRN, Invoice, Adjustment numbers
- Batch Operations: Bulk add products, bulk stock updates
- Offline Support: Works without internet

Be friendly, concise, and helpful. Provide step-by-step instructions when asked. 
If asked about a feature not in this system, politely say it's not available yet.
Always answer in the user's language (English or Arabic if they ask in Arabic).`;

// Predefined FAQ responses (fallback when AI API is not available)
const FAQ_RESPONSES: Record<string, string> = {
  // Products
  'how to add product': 'To add a product: 1) Go to Products page, 2) Click "Add New Product", 3) Fill required fields (SKU, Name, Price), 4) Upload images from device, 5) Set stock levels, 6) Click "Create Product".',
  'add product': 'Navigate to Products → Click "Add New Product" → Fill in SKU, Name, Price → Upload images → Set stock quantity and reorder level → Save.',
  'edit product': 'Go to Products page → Click on a product → Click "Edit" button → Modify fields → Click "Save Changes".',
  'stock alert': 'Stock alerts trigger automatically when stock drops to or below the reorder level. You\'ll see notifications in the bell icon (🔔). System checks every 30 minutes.',
  
  // POS
  'how to use pos': 'POS Flow: 1) Start Session (enter opening cash), 2) Scan/Search products and add to cart, 3) Select customer, 4) Enter payment amount, 5) Process Sale, 6) Print receipt, 7) End Session when done.',
  'start pos': 'Click "POS" in sidebar → Enter starting cash amount → Click "Start Session" → You can now process sales!',
  'process sale': 'Add products to cart (scan barcode or search) → Select customer (optional) → Choose payment method → Enter amount tendered → Click "Process Sale" → Receipt generated automatically.',
  'end session': 'Click "End Session" button in POS → Enter ending cash amount → System calculates difference → Session closed with summary.',
  
  // Stock
  'how to adjust stock': 'Go to Stock Adjustments → Click "Create Adjustment" → Select products → Enter new quantities → Add reason → Submit for approval.',
  'purchase order': 'Purchase Orders: 1) Go to Purchase Orders → 2) Click "Create PO" → 3) Select supplier → 4) Add items with quantities → 5) Submit → 6) Wait for approval → 7) Receive goods via GRN.',
  'receive goods': 'Goods Receipt: 1) Go to Goods Receipt page → 2) Select approved PO → 3) Enter received quantities → 4) Note damaged items → 5) Complete receipt → Stock updated automatically!',
  
  // OCR
  'scan receipt': 'OCR Scanner: 1) Click "📸 OCR Scanner" → 2) Upload receipt image/PDF → 3) Click "Upload & Process" → 4) Wait for extraction → 5) Review products → 6) Edit if needed → 7) Bulk add to inventory!',
  'upload image': 'Product images: On Add/Edit Product page, scroll to "Product Images" section → Drag & drop images or click to browse → Upload from device (no URLs!) → Max 5 images, first is primary.',
  
  // Notifications
  'notifications': 'Notifications show in the bell icon (🔔) in header. Click bell to see unread notifications. System auto-monitors stock every 30 minutes and alerts you when stock is low.',
  'notification settings': 'Go to Notifications → Click "⚙️ Settings" → Configure channels (email, SMS) → Set quiet hours → Enable/disable alert types → Save preferences.',
  
  // General
  'help': 'I can help you with: Products, Stock Management, Purchase Orders, POS, Sales, Returns, Notifications, OCR Scanning, Reports, and more! Just ask your question.',
  'features': 'This system includes: Product Management, Inventory Tracking, Stock Alerts, Purchase Orders, Goods Receipt, POS, Sales Orders, Invoicing, Returns, Analytics, Reports, OCR Scanner, Barcode Scanning, Notifications, Multi-language (EN/AR), and RBAC.',
};

export class ChatbotService {
  /**
   * Get or create chat session
   */
  static async getOrCreateSession(userId?: string, guestId?: string): Promise<string> {
    // Try to find existing active session
    let session = await prisma.chatSession.findFirst({
      where: {
        OR: [
          userId ? { user_id: userId } : {},
          guestId ? { guest_id: guestId } : {},
        ],
        is_active: true,
      },
      orderBy: { last_message_at: 'desc' },
    });

    if (!session) {
      // Create new session
      session = await prisma.chatSession.create({
        data: {
          user_id: userId,
          guest_id: guestId,
          session_name: `Chat ${new Date().toLocaleString()}`,
          is_active: true,
        },
      });
    }

    return session.id;
  }

  /**
   * Send message and get AI response
   */
  static async sendMessage(params: {
    sessionId: string;
    message: string;
    userId?: string;
  }): Promise<{ response: string; messageId: string }> {
    const startTime = Date.now();

    // Save user message
    await prisma.chatMessage.create({
      data: {
        session_id: params.sessionId,
        role: ChatMessageRole.USER,
        content: params.message,
      },
    });

    // Get AI response
    let response: string;
    let model = 'FAQ-fallback';
    let tokensUsed = 0;

    if (groq) {
      try {
        // Use Groq AI (free, fast)
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: SYSTEM_CONTEXT,
            },
            {
              role: 'user',
              content: params.message,
            },
          ],
          model: 'llama-3.1-70b-versatile', // Free model
          temperature: 0.7,
          max_tokens: 1000,
        });

        response = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        model = 'llama-3.1-70b-versatile';
        tokensUsed = chatCompletion.usage?.total_tokens || 0;
      } catch (error) {
        console.error('Groq API error:', error);
        response = this.getFallbackResponse(params.message);
      }
    } else {
      // Fallback to FAQ matching
      response = this.getFallbackResponse(params.message);
    }

    // Save assistant response
    const responseTime = Date.now() - startTime;
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        session_id: params.sessionId,
        role: ChatMessageRole.ASSISTANT,
        content: response,
        model,
        tokens_used: tokensUsed,
        response_time: responseTime,
      },
    });

    // Update session
    await prisma.chatSession.update({
      where: { id: params.sessionId },
      data: {
        message_count: { increment: 2 },
        last_message_at: new Date(),
      },
    });

    return {
      response,
      messageId: assistantMessage.id,
    };
  }

  /**
   * Get fallback response from FAQ
   */
  private static getFallbackResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();

    // Check for keyword matches
    for (const [keywords, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerQuestion.includes(keywords)) {
        return response;
      }
    }

    // Default response
    return `I can help you with questions about:
    
📦 **Products & Inventory**: Add/edit products, manage stock, set alerts
🛒 **Purchase Orders**: Create POs, approve, receive goods (GRN)
💰 **Point of Sale**: Process sales, manage sessions, print receipts
📊 **Analytics & Reports**: Sales trends, top products, Z-reports
🔔 **Notifications**: Stock alerts, preferences, quiet hours
📸 **OCR Scanner**: Upload receipts to auto-extract products
👥 **User Management**: Roles, permissions, sessions

What would you like to know?`;
  }

  /**
   * Get chat history
   */
  static async getChatHistory(sessionId: string, limit: number = 50) {
    const messages = await prisma.chatMessage.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'asc' },
      take: limit,
    });

    return messages;
  }

  /**
   * Provide feedback on message
   */
  static async provideFeedback(messageId: string, isHelpful: boolean, feedbackText?: string) {
    return await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        is_helpful: isHelpful,
        feedback_text: feedbackText,
      },
    });
  }

  /**
   * End chat session
   */
  static async endSession(sessionId: string) {
    return await prisma.chatSession.update({
      where: { id: sessionId },
      data: { is_active: false },
    });
  }

  /**
   * Get user's chat sessions
   */
  static async getUserSessions(userId: string) {
    return await prisma.chatSession.findMany({
      where: { user_id: userId },
      orderBy: { last_message_at: 'desc' },
      take: 10,
      select: {
        id: true,
        session_name: true,
        message_count: true,
        is_active: true,
        created_at: true,
        last_message_at: true,
      },
    });
  }
}

