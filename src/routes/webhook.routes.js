import { Router } from 'express';
import { handleWebhook, verifyWebhook, simulateWebhook } from '../controllers/webhook.controller.js';

const router = Router();

// GET /webhook (Meta verification challenge)
router.get('/', verifyWebhook);

// POST /webhook (Meta incoming message & status events)
router.post('/', handleWebhook);

// POST /webhook/simulate (Development testing endpoint with AI diagnostic output)
router.post('/simulate', simulateWebhook);

export default router;
