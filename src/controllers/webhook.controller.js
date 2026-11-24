import { config } from '../config/env.js';
import { webhookService } from '../services/webhook.service.js';

/**
 * Handles incoming WhatsApp webhook events (POST /webhook)
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const payload = req.body;

    // Reject empty request body immediately
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: Request body cannot be empty',
      });
    }

    const options = {
      skipAi: req.query.skipAi === 'true' || req.headers['x-skip-ai'] === 'true',
    };

    const result = await webhookService.handleWebhookPayload(payload, options);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && { data: result.data }),
    });
  } catch (error) {
    // Pass unexpected errors to centralized error handling middleware
    next(error);
  }
};

/**
 * Development testing endpoint: Simulates an inbound message and returns full AI diagnostic results
 * (POST /webhook/simulate)
 * Disabled in production environments for security.
 */
export const simulateWebhook = async (req, res, next) => {
  try {
    if (config.nodeEnv === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Simulation endpoint is disabled in production environment',
      });
    }

    const body = req.body || {};

    // Support either simplified JSON { phoneNumber, content, customerName } or full WhatsApp payload
    let payload;
    if (body.phoneNumber && body.content) {
      payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'BIZ_SIMULATED',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550000000',
                    phone_number_id: 'PHONE_SIMULATED',
                  },
                  contacts: body.customerName
                    ? [{ profile: { name: body.customerName }, wa_id: body.phoneNumber }]
                    : [],
                  messages: [
                    {
                      from: body.phoneNumber,
                      id: `wamid.sim_${Date.now()}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: 'text',
                      text: { body: body.content },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };
    } else {
      payload = body;
    }

    const result = await webhookService.handleWebhookPayload(payload, { skipAi: false });

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && { data: result.data }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles WhatsApp Cloud API webhook verification challenge (GET /webhook)
 */
export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Fail safely if WHATSAPP_VERIFY_TOKEN is not configured in environment
  if (!config.whatsappVerifyToken) {
    console.error(
      'Webhook verification error: WHATSAPP_VERIFY_TOKEN is not configured in environment variables.'
    );
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: Webhook verification token is not set',
    });
  }

  if (mode && token) {
    if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({
      success: false,
      message: 'Webhook verification failed: Token mismatch',
    });
  }

  return res.status(400).json({
    success: false,
    message: 'Missing verification query parameters',
  });
};
