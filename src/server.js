import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { Conversation, Lead } from './models/index.js';

const PORT = config.port;

/**
 * Initialize database connection and start HTTP server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDatabase();

    // Initialize model indexes in MongoDB
    await Promise.all([
      Conversation.init(),
      Lead.init(),
    ]);

    // Start Express server after database connection succeeds
    const server = app.listen(PORT, () => {
      console.log(`Reliable Paper Mart AI Assistant API is running on http://localhost:${PORT}`);
    });

    return server;
  } catch (error) {
    console.error('Server startup failed:', error.message || error);
    process.exit(1);
  }
};

startServer();
