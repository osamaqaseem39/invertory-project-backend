import axios from 'axios';

const API_BASE_URL = 'https://invertory-project-backend.vercel.app/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token if available (optional for chatbot)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  model?: string;
  tokens_used?: number;
  response_time?: number;
  is_helpful?: boolean;
  created_at: string;
}

export const chatbotAPI = {
  // Send message
  sendMessage: async (message: string, sessionId?: string, guestId?: string): Promise<{
    sessionId: string;
    response: string;
    messageId: string;
  }> => {
    const response = await api.post('/chatbot/message', {
      message,
      sessionId,
      guestId,
    });
    return response.data;
  },

  // Get chat history
  getChatHistory: async (sessionId: string): Promise<{ data: ChatMessage[] }> => {
    const response = await api.get(`/chatbot/history/${sessionId}`);
    return response.data;
  },

  // Provide feedback
  provideFeedback: async (messageId: string, isHelpful: boolean, feedbackText?: string): Promise<any> => {
    const response = await api.post(`/chatbot/feedback/${messageId}`, {
      isHelpful,
      feedbackText,
    });
    return response.data;
  },

  // Get user sessions
  getUserSessions: async (): Promise<{ data: any[] }> => {
    const response = await api.get('/chatbot/sessions');
    return response.data;
  },

  // End session
  endSession: async (sessionId: string): Promise<any> => {
    const response = await api.delete(`/chatbot/session/${sessionId}`);
    return response.data;
  },
};





