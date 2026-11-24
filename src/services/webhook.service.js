import { Conversation } from '../models/Conversation.js';
import { leadService } from './lead.service.js';
import { handoffService } from './handoff.service.js';
import { conversationService } from './conversation.service.js';
import { geminiService, FALLBACK_RESPONSE, countWords } from './gemini.service.js';
import { config } from '../config/env.js';

/**
 * Service to process incoming WhatsApp Cloud API webhook events
 * Handles iteration over all entries, changes, and messages in a payload.
 */
class WebhookService {
  /**
   * Validates the top-level structure of a WhatsApp webhook payload
   * @param {Object} payload
   * @returns {{ isValid: boolean, error?: string }}
   */
  validatePayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { isValid: false, error: 'Payload must be a non-empty JSON object' };
    }

    if (payload.object !== 'whatsapp_business_account') {
      return {
        isValid: false,
        error: 'Invalid webhook object type. Expected "whatsapp_business_account"',
      };
    }

    if (!Array.isArray(payload.entry) || payload.entry.length === 0) {
      return { isValid: false, error: 'Missing or invalid "entry" array in webhook payload' };
    }

    return { isValid: true };
  }

  /**
   * Converts a WhatsApp unix timestamp (in seconds) to a JavaScript Date
   * @param {string|number} timestamp
   * @returns {Date}
   */
  parseTimestamp(timestamp) {
    if (!timestamp) return new Date();
    const parsedSeconds = parseInt(timestamp, 10);
    if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
      return new Date(parsedSeconds * 1000);
    }
    return new Date();
  }

  /**
   * Processes a single incoming text message and persists it into Conversation model
   * When skipAi is false (default), triggers memory retrieval, Gemini FAQ answering,
   * assistant response persistence, lead capture, and handoff escalation.
   *
   * @param {Object} params
   * @param {string} params.phoneNumber
   * @param {string|null} params.customerName
   * @param {string} params.messageId
   * @param {string} params.content
   * @param {Date} params.timestamp
   * @param {Object} [params.options]
   * @param {boolean} [params.options.skipAi] - If true, skips AI generation (for raw webhook ingestion tests)
   * @param {Object} [params.options.geminiOptions] - Optional mock/test overrides for Gemini
   * @returns {Promise<Object>}
   */
  async processTextMessage({ phoneNumber, customerName, messageId, content, timestamp, options = {} }) {
    // 1. Find existing conversation by customer phone number
    let conversation = await Conversation.findOne({ phoneNumber });

    // 2. If conversation exists, check for duplicate message ID
    if (conversation && messageId) {
      const isDuplicate = conversation.messages.some(
        (msg) => msg.messageId && msg.messageId === messageId
      );

      if (isDuplicate) {
        return {
          status: 'duplicate',
          isNewConversation: false,
          isDuplicate: true,
          phoneNumber,
          customerName: conversation.customerName,
          messageId,
        };
      }
    }

    const isNew = !conversation;

    // 3. Save incoming customer message into Conversation model
    if (!conversation) {
      conversation = new Conversation({
        phoneNumber,
        customerName: customerName || null,
        messages: [
          {
            messageId: messageId || null,
            role: 'customer',
            content,
            timestamp: timestamp || new Date(),
          },
        ],
        lastMessageAt: timestamp || new Date(),
      });
    } else {
      if (customerName && !conversation.customerName) {
        conversation.customerName = customerName;
      }

      conversation.messages.push({
        messageId: messageId || null,
        role: 'customer',
        content,
        timestamp: timestamp || new Date(),
      });
      conversation.lastMessageAt = timestamp || new Date();
    }

    await conversation.save();

    // 4. Lead capture attempt (non-blocking, failure-safe)
    let leadResult = null;
    try {
      leadResult = await leadService.processLead(phoneNumber, {
        text: content,
        contactName: customerName || conversation.customerName,
      });
    } catch {
      // Non-fatal
    }

    // 5. Explicit human request detection (non-blocking, failure-safe)
    let explicitHandoff = null;
    const isExplicitHumanRequest = handoffService.detectHumanRequest(content);
    if (isExplicitHumanRequest) {
      try {
        explicitHandoff = await handoffService.triggerHandoff(
          phoneNumber,
          'Customer explicitly requested human assistance',
          { customerName: customerName || conversation.customerName, timestamp }
        );
      } catch {
        // Non-fatal
      }
    }

    // 6. Conversational AI response generation & assistant persistence
    let aiResponse = null;
    if (!options.skipAi) {
      try {
        // Retrieve prior history up to configured limit (exclude the message just appended)
        const historyLimit = config.conversationHistoryLimit || 10;
        const priorMessages = conversation.messages.slice(0, -1);
        const history =
          priorMessages.length > historyLimit
            ? priorMessages.slice(-historyLimit)
            : [...priorMessages];

        let assistantContent;
        let isFallback = false;
        let wordCount = 0;
        let aiHandoff = null;

        if (isExplicitHumanRequest) {
          // Bypasses Gemini model call when customer explicitly asked for human assistance
          assistantContent = FALLBACK_RESPONSE;
          isFallback = true;
          wordCount = countWords(FALLBACK_RESPONSE);
        } else {
          // Call Gemini AI with strict FAQ grounding and multi-turn conversation memory
          const geminiResult = await geminiService.generateResponse(content, {
            ...options.geminiOptions,
            history,
          });

          assistantContent = geminiResult.text || FALLBACK_RESPONSE;
          isFallback = geminiResult.isFallback;
          wordCount = geminiResult.wordCount;

          // If Gemini returns exact fallback, flag conversation for human handoff
          if (geminiResult.text === FALLBACK_RESPONSE || geminiResult.isFallback) {
            try {
              aiHandoff = await handoffService.triggerHandoff(
                phoneNumber,
                'AI fallback: FAQ cannot answer inquiry',
                {
                  customerName: customerName || conversation.customerName,
                  timestamp: new Date(),
                }
              );
            } catch (err) {
              console.error('AI handoff error (non-fatal):', err.message);
            }
          }
        }

        // Persist generated assistant response into the conversation document
        await conversationService.saveAssistantResponse(phoneNumber, assistantContent, {
          timestamp: new Date(),
        });

        const hasActiveHandoff = !!(
          explicitHandoff?.triggered ||
          explicitHandoff?.alreadyPending ||
          aiHandoff?.triggered ||
          aiHandoff?.alreadyPending
        );

        aiResponse = {
          assistantResponse: assistantContent,
          isFallback,
          wordCount,
          needsHuman: hasActiveHandoff,
          handoffReason:
            explicitHandoff?.conversation?.handoffReason ||
            aiHandoff?.conversation?.handoffReason ||
            null,
          leadCaptured: !!leadResult?.lead,
          historyCountUsed: history.length,
        };
      } catch (aiErr) {
        console.error('Webhook AI processing error (non-fatal):', aiErr.message);
      }
    }

    return {
      status: 'processed',
      isNewConversation: isNew,
      isDuplicate: false,
      phoneNumber,
      customerName: conversation.customerName,
      messageId,
      ...(aiResponse && {
        assistantResponse: aiResponse.assistantResponse,
        ai: aiResponse,
      }),
    };
  }

  /**
   * Main webhook entry handler: safely iterates through every entry,
   * every change, and every message in the payload.
   * @param {Object} payload
   * @param {Object} [options]
   * @param {boolean} [options.skipAi] - If true, skips conversational AI generation
   * @param {Object} [options.geminiOptions] - Custom model/client overrides for testing
   * @returns {Promise<Object>}
   */
  async handleWebhookPayload(payload, options = {}) {
    // 1. Validate top-level payload structure
    const validation = this.validatePayload(payload);
    if (!validation.isValid) {
      return {
        success: false,
        statusCode: 400,
        message: validation.error,
      };
    }

    const processedMessages = [];
    const duplicateMessages = [];
    const unsupportedMessages = [];
    const ignoredStatuses = [];
    const messageErrors = [];

    // 2. Iterate through every entry in the payload
    for (const entry of payload.entry) {
      if (!entry || !Array.isArray(entry.changes)) continue;

      // 3. Iterate through every change in the entry
      for (const change of entry.changes) {
        if (!change || !change.value || typeof change.value !== 'object') continue;

        const value = change.value;

        // Collect status events (delivered, read, sent, etc.)
        if (Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            ignoredStatuses.push(statusObj);
          }
        }

        // Check if there are messages in this change
        if (!Array.isArray(value.messages) || value.messages.length === 0) {
          continue;
        }

        // 4. Iterate through every message in value.messages
        for (const message of value.messages) {
          if (!message || typeof message !== 'object') {
            messageErrors.push('Invalid message object in webhook payload');
            continue;
          }

          const phoneNumber = message.from;
          const messageId = message.id;
          const messageType = message.type;

          if (!phoneNumber) {
            messageErrors.push('Missing "from" phone number in message payload');
            continue;
          }

          if (!messageType) {
            messageErrors.push('Missing "type" field in message payload');
            continue;
          }

          // Handle unsupported message types (image, audio, document, video, etc.)
          if (messageType !== 'text') {
            unsupportedMessages.push({
              phoneNumber,
              messageId: messageId || null,
              messageType,
              status: 'unsupported',
            });
            continue;
          }

          // Validate text body for text messages
          if (
            !message.text ||
            typeof message.text.body !== 'string' ||
            message.text.body.trim().length === 0
          ) {
            messageErrors.push('Missing or empty text content in text message');
            continue;
          }

          const content = message.text.body.trim();
          const messageTimestamp = this.parseTimestamp(message.timestamp);

          // Find contact profile name matching this message sender's phone
          let customerName = null;
          if (Array.isArray(value.contacts) && value.contacts.length > 0) {
            const matchedContact = value.contacts.find((c) => c.wa_id === phoneNumber);
            if (matchedContact) {
              customerName = matchedContact.profile?.name || null;
            } else if (value.contacts.length === 1) {
              // Only use the first contact as a fallback when exactly one contact exists
              customerName = value.contacts[0]?.profile?.name || null;
            } else {
              // If multiple contacts exist and no match is found, do not associate an unrelated customer name
              customerName = null;
            }
          }

          // Process and persist text message
          const result = await this.processTextMessage({
            phoneNumber,
            customerName,
            messageId,
            content,
            timestamp: messageTimestamp,
            options,
          });

          if (result.status === 'duplicate') {
            duplicateMessages.push({
              phoneNumber,
              messageId,
              isDuplicate: true,
            });
          } else {
            processedMessages.push({
              phoneNumber,
              customerName: result.customerName,
              messageId,
              isNewConversation: result.isNewConversation,
              isDuplicate: false,
              ...(result.assistantResponse && {
                assistantResponse: result.assistantResponse,
                ai: result.ai,
              }),
            });
          }
        }
      }
    }

    const totalProcessed = processedMessages.length;
    const totalDuplicates = duplicateMessages.length;
    const totalUnsupported = unsupportedMessages.length;
    const totalStatuses = ignoredStatuses.length;

    // If there were fatal message validation errors and zero valid items
    if (
      messageErrors.length > 0 &&
      totalProcessed === 0 &&
      totalDuplicates === 0 &&
      totalUnsupported === 0 &&
      totalStatuses === 0
    ) {
      return {
        success: false,
        statusCode: 400,
        message: messageErrors[0],
      };
    }

    // 1. Single status update event
    if (totalStatuses > 0 && totalProcessed === 0 && totalDuplicates === 0 && totalUnsupported === 0) {
      return {
        success: true,
        statusCode: 200,
        message: 'Status update event acknowledged without creating conversations',
        data: {
          eventType: 'status_update',
          statusesCount: totalStatuses,
        },
      };
    }

    // 2. Single unsupported media message
    if (totalUnsupported === 1 && totalProcessed === 0 && totalDuplicates === 0) {
      return {
        success: true,
        statusCode: 200,
        message: `Unsupported message type: ${unsupportedMessages[0].messageType}. Safely acknowledged without saving content.`,
        data: {
          ...unsupportedMessages[0],
          processedCount: 0,
          duplicateCount: 0,
          unsupportedCount: 1,
        },
      };
    }

    // 3. Single duplicate message
    if (totalDuplicates === 1 && totalProcessed === 0 && totalUnsupported === 0) {
      return {
        success: true,
        statusCode: 200,
        message: 'Duplicate message ignored. Already processed.',
        data: {
          ...duplicateMessages[0],
          processedCount: 0,
          duplicateCount: 1,
          unsupportedCount: 0,
        },
      };
    }

    // 4. Single newly processed text message (maintains exact backward compatibility)
    if (totalProcessed === 1 && totalDuplicates === 0 && totalUnsupported === 0) {
      return {
        success: true,
        statusCode: 200,
        message: processedMessages[0].isNewConversation
          ? 'New conversation created and message stored successfully'
          : 'Existing conversation updated and message appended successfully',
        data: {
          ...processedMessages[0],
          processedCount: 1,
          duplicateCount: 0,
          unsupportedCount: 0,
        },
      };
    }

    // 5. Multi-message, batch, or mixed payload
    if (totalProcessed > 0 || totalDuplicates > 0 || totalUnsupported > 0) {
      return {
        success: true,
        statusCode: 200,
        message: `Batch processed: ${totalProcessed} message(s) saved, ${totalDuplicates} duplicate(s) ignored, ${totalUnsupported} unsupported item(s) acknowledged`,
        data: {
          processedCount: totalProcessed,
          duplicateCount: totalDuplicates,
          unsupportedCount: totalUnsupported,
          processed: processedMessages,
          duplicates: duplicateMessages,
          unsupported: unsupportedMessages,
          ...(totalProcessed > 0 && {
            phoneNumber: processedMessages[0].phoneNumber,
            customerName: processedMessages[0].customerName,
            messageId: processedMessages[0].messageId,
            isNewConversation: processedMessages[0].isNewConversation,
            isDuplicate: false,
            ...(processedMessages[0].assistantResponse && {
              assistantResponse: processedMessages[0].assistantResponse,
              ai: processedMessages[0].ai,
            }),
          }),
        },
      };
    }

    // 6. Webhook received without customer messages or statuses
    return {
      success: true,
      statusCode: 200,
      message: 'Webhook received without incoming customer messages',
      data: {
        eventType: 'empty_messages',
      },
    };
  }
}

export const webhookService = new WebhookService();
export default webhookService;
