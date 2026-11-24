import { Conversation } from '../models/Conversation.js';

/**
 * Robust regex patterns detecting explicit customer requests for human assistance,
 * sales representatives, agents, or personal callbacks.
 */
const HUMAN_REQUEST_PATTERNS = [
  // 1. Explicit requests to talk / speak / chat with a human / person / agent / representative / sales
  /\b(?:talk|speak|chat)\s+(?:to|with)\s+(?:a\s+)?(?:real\s+)?(?:human|person|agent|representative|rep|sales(?:\s*(?:team|rep|executive|person))?|support(?:\s*(?:team|agent|rep))?|someone|somebody|manager)\b/i,

  // 2. Want / Need / Like to talk / speak / connect with human / person / agent
  /\b(?:i\s+)?(?:want|need|would\s+like|like)\s+(?:to\s+)?(?:talk|speak|chat|connect)\s+(?:to|with)\s+(?:a\s+)?(?:real\s+)?(?:human|person|agent|representative|rep|sales|support|someone)\b/i,

  // 3. Need / Want a real person / human / agent
  /\b(?:i\s+)?(?:need|want|looking\s+for)\s+(?:a\s+)?(?:real\s+)(?:human|person|agent|representative|rep|sales\s*rep)\b/i,

  // 4. Connect / Transfer / Route / Put / Switch me to
  /\b(?:connect|transfer|route|put|switch)\s+(?:me\s+)?(?:through\s+)?(?:to|with)\s+(?:a\s+|an\s+|your\s+)?(?:human|person|agent|representative|rep|sales(?:\s*(?:team|rep|executive|department|person))?|support(?:\s*(?:team|agent|rep))?|someone|team\s+member)\b/i,

  // 5. Call me requests (avoiding name introductions like "call me Rahul")
  /\b(?:can|could|please)\s+(?:someone|somebody|anyone)\s+call\s+me\b/i,
  /\bcall\s+me\s+(?:back|please|now|urgently|today|asap|at\s+\d+|on\s+\d+)\b/i,
  /\b(?:can|could)\s+you\s+call\s+me\b/i,
  /\b(?:give|arrange|schedule)\s+(?:me\s+)?a\s+call\b/i,
  /\bhave\s+(?:someone|somebody|sales|an?\s+agent)\s+call\s+me\b/i,

  // 6. Direct human agent / sales rep phrases
  /\b(?:human\s+agent|human\s+representative|human\s+support|real\s+person|sales\s+representative|sales\s+rep)\b/i,

  // 7. Additional agent transfer expressions
  /\b(?:speak|talk)\s+with\s+(?:sales|support|an?\s+agent|a\s+human)\b/i,
  /\b(?:connect\s+with\s+(?:your\s+)?sales\s+team)\b/i,
  /\b(?:transfer\s+me\s+to\s+an?\s+agent)\b/i,
];

/**
 * Service managing human handoff detection, lifecycle persistence,
 * and escalation endpoints.
 */
export class HandoffService {
  /**
   * Detects whether an incoming customer message contains an explicit request
   * for human assistance, an agent, or sales representative.
   * Avoids false positives like unrelated mentions of "human resources".
   *
   * @param {string} text
   * @returns {boolean}
   */
  detectHumanRequest(text) {
    if (!text || typeof text !== 'string') return false;

    const trimmed = text.trim();
    if (trimmed.length === 0) return false;

    // Guard: If message contains "human resources" but lacks escalation intent verbs, ignore
    if (/\bhuman\s+resources?\b/i.test(trimmed)) {
      const hasEscalationVerb = /\b(?:talk|speak|chat|call|connect|transfer|reach|put\s+through)\b/i.test(
        trimmed
      );
      if (!hasEscalationVerb) {
        return false;
      }
    }

    return HUMAN_REQUEST_PATTERNS.some((pattern) => pattern.test(trimmed));
  }

  /**
   * Triggers a human handoff for a customer conversation:
   * - Marks needsHuman = true, handoffStatus = 'pending', handoffReason, handoffAt.
   * - Does NOT create duplicate handoff events if the conversation is already pending.
   * - Allows a new handoff event if the conversation was previously resolved.
   * - Preserves conversation history and customer metadata.
   *
   * @param {string} phoneNumber
   * @param {string} [reason='Customer requested human assistance']
   * @param {Object} [options]
   * @param {string} [options.customerName]
   * @param {Date} [options.timestamp]
   * @returns {Promise<{ triggered: boolean, alreadyPending: boolean, conversation: Object }>}
   */
  async triggerHandoff(phoneNumber, reason = 'Customer requested human assistance', options = {}) {
    if (!phoneNumber) {
      throw new Error('phoneNumber is required to trigger handoff');
    }

    const timestamp = options.timestamp || new Date();
    const customerName = options.customerName || null;

    let conversation = await Conversation.findOne({ phoneNumber });

    // 1. If conversation does not exist, create a new document with pending handoff
    if (!conversation) {
      conversation = new Conversation({
        phoneNumber,
        customerName,
        needsHuman: true,
        handoffReason: reason,
        handoffAt: timestamp,
        handoffStatus: 'pending',
        lastMessageAt: timestamp,
      });

      await conversation.save();

      return {
        triggered: true,
        alreadyPending: false,
        conversation,
      };
    }

    // 2. Prevent duplicate handoff events if handoff is already pending
    if (conversation.needsHuman && conversation.handoffStatus === 'pending') {
      return {
        triggered: false,
        alreadyPending: true,
        conversation,
      };
    }

    // 3. If conversation is not currently pending (e.g. resolved or never flagged),
    // initiate a new handoff event
    conversation.needsHuman = true;
    conversation.handoffStatus = 'pending';
    conversation.handoffReason = reason;
    conversation.handoffAt = timestamp;
    if (customerName && !conversation.customerName) {
      conversation.customerName = customerName;
    }

    await conversation.save();

    return {
      triggered: true,
      alreadyPending: false,
      conversation,
    };
  }

  /**
   * Resolves an active pending handoff for a given phone number:
   * - Sets needsHuman = false, handoffStatus = 'resolved'.
   * - Preserves handoffReason and handoffAt for audit history.
   * - Returns NOT_FOUND if conversation does not exist.
   * - Returns NO_ACTIVE_HANDOFF if conversation exists but is not pending.
   *
   * @param {string} phoneNumber
   * @returns {Promise<{ success: boolean, code: string, message?: string, data?: Object }>}
   */
  async resolveHandoff(phoneNumber) {
    if (!phoneNumber) {
      return {
        success: false,
        code: 'MISSING_PHONE',
        message: 'Phone number parameter is required',
      };
    }

    const conversation = await Conversation.findOne({ phoneNumber });

    // If conversation not found
    if (!conversation) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: `Conversation not found for phone number: ${phoneNumber}`,
      };
    }

    // If conversation has no active pending handoff
    if (!conversation.needsHuman || conversation.handoffStatus !== 'pending') {
      return {
        success: false,
        code: 'NO_ACTIVE_HANDOFF',
        message: `No active pending handoff found for conversation: ${phoneNumber}`,
      };
    }

    // Resolve handoff while preserving reason and timestamp for audit trail
    conversation.needsHuman = false;
    conversation.handoffStatus = 'resolved';

    await conversation.save();

    return {
      success: true,
      code: 'RESOLVED',
      data: {
        phoneNumber: conversation.phoneNumber,
        customerName: conversation.customerName,
        needsHuman: conversation.needsHuman,
        handoffStatus: conversation.handoffStatus,
        handoffReason: conversation.handoffReason,
        handoffAt: conversation.handoffAt,
        lastMessageAt: conversation.lastMessageAt,
      },
    };
  }

  /**
   * Retrieves conversations requiring human attention or resolved handoffs:
   * - Validates query parameters (status, limit).
   * - Returns newest first ordered by handoffAt.
   * - Selects phoneNumber, customerName, handoffReason, handoffAt, handoffStatus, lastMessageAt.
   *
   * @param {Object} [params]
   * @param {string} [params.status] - 'pending' or 'resolved'
   * @param {number|string} [params.limit=50] - integer 1 to 100
   * @returns {Promise<Array<Object>>}
   */
  async getHandoffs(params = {}) {
    const { status, limit = 50 } = params;

    // Validate status parameter if provided
    if (status !== undefined && status !== 'pending' && status !== 'resolved') {
      const error = new Error('Invalid status parameter. Must be "pending" or "resolved".');
      error.statusCode = 400;
      throw error;
    }

    // Validate limit parameter if provided
    let safeLimit = 50;
    if (limit !== undefined) {
      const parsedLimit = Number(limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        const error = new Error('Limit must be an integer between 1 and 100');
        error.statusCode = 400;
        throw error;
      }
      safeLimit = parsedLimit;
    }

    // Build query filter
    const query = {};
    if (status === 'pending') {
      query.handoffStatus = 'pending';
    } else if (status === 'resolved') {
      query.handoffStatus = 'resolved';
    } else {
      // Default: Return conversations where needsHuman === true (pending handoffs)
      query.needsHuman = true;
    }

    // Query newest first
    const handoffs = await Conversation.find(query)
      .sort({ handoffAt: -1, updatedAt: -1 })
      .limit(safeLimit)
      .select('phoneNumber customerName handoffReason handoffAt handoffStatus lastMessageAt')
      .lean();

    return handoffs;
  }
}

export const handoffService = new HandoffService();
export default handoffService;
