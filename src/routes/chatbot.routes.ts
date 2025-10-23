import { Router } from 'express';
import { ChatbotService } from '../services/chatbot.service';
import { validateBody } from '../middleware/validation.middleware';
import { sendMessageSchema, feedbackSchema } from '../validators/chatbot.validator';

const router = Router();

/**
 * POST /api/v1/chatbot/message
 * Send message to chatbot (works for logged-in users and guests)
 */
router.post('/message', validateBody(sendMessageSchema), async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const guestId = req.body.guestId || `guest_${Date.now()}`;

    // Get or create session
    let sessionId = req.body.sessionId;
    if (!sessionId) {
      sessionId = await ChatbotService.getOrCreateSession(userId, guestId);
    }

    // Send message and get response
    const result = await ChatbotService.sendMessage({
      sessionId,
      message: req.body.message,
      userId,
    });

    return res.status(200).json({
      sessionId,
      response: result.response,
      messageId: result.messageId,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'CHATBOT_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/chatbot/history/:sessionId
 * Get chat history for a session
 */
router.get('/history/:sessionId', async (req: any, res) => {
  try {
    const messages = await ChatbotService.getChatHistory(req.params.sessionId);
    return res.status(200).json({ data: messages });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_HISTORY_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/chatbot/feedback/:messageId
 * Provide feedback on a message
 */
router.post('/feedback/:messageId', validateBody(feedbackSchema), async (req: any, res) => {
  try {
    const message = await ChatbotService.provideFeedback(
      req.params.messageId,
      req.body.isHelpful,
      req.body.feedbackText
    );
    return res.status(200).json({
      message: 'Feedback submitted',
      data: message,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'FEEDBACK_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/chatbot/sessions
 * Get user's chat sessions (authenticated users only)
 */
router.get('/sessions', async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const sessions = await ChatbotService.getUserSessions(req.user.id);
    return res.status(200).json({ data: sessions });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_SESSIONS_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * DELETE /api/v1/chatbot/session/:sessionId
 * End chat session
 */
router.delete('/session/:sessionId', async (req: any, res) => {
  try {
    const session = await ChatbotService.endSession(req.params.sessionId);
    return res.status(200).json({
      message: 'Session ended',
      data: session,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'END_SESSION_FAILED',
        message: error.message,
      },
    });
  }
});

export default router;





