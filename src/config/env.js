import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  mongodbUri: process.env.MONGODB_URI || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  conversationHistoryLimit: process.env.CONVERSATION_HISTORY_LIMIT
    ? parseInt(process.env.CONVERSATION_HISTORY_LIMIT, 10)
    : 10,
  nodeEnv: process.env.NODE_ENV || 'development',
};
