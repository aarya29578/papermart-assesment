import { Conversation } from '../models/Conversation.js';
import { geminiService, FALLBACK_RESPONSE, countWords } from './gemini.service.js';
import { leadService } from './lead.service.js';
import { handoffService } from './handoff.service.js';
import { config } from '../config/env.js';

/**
 * Service managing conversation retrieval, history slicing,
 * and assistant response persistence in MongoDB.
 */
export class ConversationService {
  /**
   * Retrieves recent conversation history for a given customer phone number
   * @param {string} phoneNumber
   * @param {number} [limit] - Maximum number of recent messages to return
   * @returns {Promise<{ conversation: Object|null, history: Array<Object>, totalCount: number }>}
   */
  async getRecentHistory(phoneNumber, limit = config.conversationHistoryLimit || 10) {
    if (!phoneNumber) {
      return { conversation: null, history: [], totalCount: 0 };
    }

    const conversation = await Conversation.findOne({ phoneNumber });
    if (!conversation || !Array.isArray(conversation.messages)) {
      return { conversation: null, history: [], totalCount: 0 };
    }

    const totalCount = conversation.messages.length;
    // Slices the most recent messages up to the configured limit, preserving chronological order
    const history = totalCount > limit ? conversation.messages.slice(-limit) : [...conversation.messages];

    return { conversation, history, totalCount };
  }

  /**
   * Saves an assistant response to the customer's conversation document in MongoDB
   * @param {string} phoneNumber
   * @param {string} content
   * @param {Object} [options]
   * @param {Date} [options.timestamp]
   * @param {boolean} [options.forceSave]
   * @returns {Promise<{ success: boolean, isDuplicate: boolean, isNewConversation: boolean, conversation: Object }>}
   */
  async saveAssistantResponse(phoneNumber, content, options = {}) {
    if (!phoneNumber || !content) {
      throw new Error('Missing required parameters: phoneNumber and content are mandatory');
    }

    const timestamp = options.timestamp || new Date();
    let conversation = await Conversation.findOne({ phoneNumber });

    // 1. If conversation does not exist, create one with the assistant message
    if (!conversation) {
      conversation = new Conversation({
        phoneNumber,
        messages: [
          {
            role: 'assistant',
            content,
            timestamp,
          },
        ],
        lastMessageAt: timestamp,
      });

      await conversation.save();

      return {
        success: true,
        isDuplicate: false,
        isNewConversation: true,
        conversation,
      };
    }

    // 2. Prevent accidental duplicate assistant messages within 5 seconds
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (
      lastMsg &&
      lastMsg.role === 'assistant' &&
      lastMsg.content === content &&
      !options.forceSave &&
      Date.now() - new Date(lastMsg.timestamp).getTime() < 5000
    ) {
      return {
        success: true,
        isDuplicate: true,
        isNewConversation: false,
        conversation,
      };
    }

    // 3. Append assistant response and update lastMessageAt
    conversation.messages.push({
      role: 'assistant',
      content,
      timestamp,
    });
    conversation.lastMessageAt = timestamp;

    await conversation.save();

    return {
      success: true,
      isDuplicate: false,
      isNewConversation: false,
      conversation,
    };
  }

  /**
   * Processes an incoming customer message with conversational memory:
   * 1. Retrieves recent conversation history (capped at configured limit).
   * 2. Calls Gemini with FAQ + history + customer message.
   * 3. Saves assistant response (or exact fallback) into the conversation.
   * 4. Returns the response for future integration.
   *
   * @param {Object} params
   * @param {string} params.phoneNumber
   * @param {string} params.content
   * @param {string} [params.customerName]
   * @param {string} [params.messageId]
   * @param {Date} [params.timestamp]
   * @param {Object} [params.geminiOptions] - Optional overrides or mocks for testing
   * @returns {Promise<Object>}
   */
  async processCustomerMessageWithMemory({
    phoneNumber,
    content,
    customerName,
    messageId,
    timestamp = new Date(),
    geminiOptions = {},
  }) {
    if (!phoneNumber || !content) {
      throw new Error('phoneNumber and content are required to process message with memory');
    }

    // 1. Retrieve recent history before appending current message
    const historyLimit = geminiOptions.historyLimit || config.conversationHistoryLimit || 10;
    const { history, totalCount } = await this.getRecentHistory(phoneNumber, historyLimit);

    // 2. Check for explicit human / agent / sales representative request
    const isHumanRequest = handoffService.detectHumanRequest(content);

    let geminiResult;
    let handoffResult = null;

    if (isHumanRequest) {
      // Customer explicitly requested human assistance: bypass Gemini model call and use fallback response
      geminiResult = {
        success: true,
        text: FALLBACK_RESPONSE,
        isFallback: true,
        wordCount: countWords(FALLBACK_RESPONSE),
        reason: 'explicit_human_request',
      };

      try {
        handoffResult = await handoffService.triggerHandoff(
          phoneNumber,
          'Customer explicitly requested human assistance',
          { customerName, timestamp: new Date() }
        );
      } catch (handoffErr) {
        console.error('Handoff error (non-fatal):', handoffErr.message);
      }
    } else {
      // 3. Call Gemini AI with recent conversation history
      geminiResult = await geminiService.generateResponse(content, {
        ...geminiOptions,
        history,
      });

      // 4. If Gemini returns exact fallback, mark conversation for human handoff
      if (geminiResult.text === FALLBACK_RESPONSE || geminiResult.isFallback) {
        try {
          handoffResult = await handoffService.triggerHandoff(
            phoneNumber,
            'AI fallback: FAQ cannot answer inquiry',
            { customerName, timestamp: new Date() }
          );
        } catch (handoffErr) {
          console.error('Handoff error (non-fatal):', handoffErr.message);
        }
      }
    }

    // 5. Process customer lead capture (non-blocking, failure-safe)
    let leadResult = null;
    try {
      leadResult = await leadService.processLead(phoneNumber, {
        text: content,
        contactName: customerName,
      });
    } catch (leadError) {
      console.error('Lead capture error (non-fatal):', leadError.message);
    }

    // 6. Save assistant response into the conversation document
    const assistantContent = geminiResult.text || FALLBACK_RESPONSE;
    const saveResult = await this.saveAssistantResponse(phoneNumber, assistantContent, {
      timestamp: new Date(),
    });

    const isPendingHandoff =
      handoffResult?.conversation?.handoffStatus === 'pending' ||
      (handoffResult?.alreadyPending ?? false);

    return {
      success: true,
      phoneNumber,
      userMessage: content,
      assistantResponse: assistantContent,
      isFallback: geminiResult.isFallback,
      needsHuman: isPendingHandoff,
      handoffReason: handoffResult?.conversation?.handoffReason || null,
      handoffStatus: handoffResult?.conversation?.handoffStatus || null,
      wordCount: geminiResult.wordCount,
      reason: geminiResult.reason,
      historyCountUsed: history.length,
      totalPriorMessages: totalCount,
      isDuplicateAssistant: saveResult.isDuplicate,
      lead: leadResult?.lead || null,
      isNewLead: leadResult?.isNew || false,
      isUpdatedLead: leadResult?.isUpdated || false,
    };
  }
}

export const conversationService = new ConversationService();
export default conversationService;
