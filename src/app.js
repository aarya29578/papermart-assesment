import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import leadRoutes from './routes/lead.routes.js';
import handoffRoutes from './routes/handoff.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base routes
app.use('/health', healthRoutes);
app.use('/webhook', webhookRoutes);
app.use('/leads', leadRoutes);
app.use('/handoffs', handoffRoutes);

// 404 handler for unknown endpoints
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
