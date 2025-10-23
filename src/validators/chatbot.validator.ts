import { z } from 'zod';

// Send message schema
export const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional().nullable(),
  guestId: z.string().optional().nullable(),
});

// Feedback schema
export const feedbackSchema = z.object({
  isHelpful: z.boolean(),
  feedbackText: z.string().max(500).optional(),
});

