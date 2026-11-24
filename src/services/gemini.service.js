import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { getFormattedFaqText, getRelevantFaqContext, getRelevantFaqEntries, faqEntries } from '../data/faq.js';

export const FALLBACK_RESPONSE = 'Let me connect you with our team member.';
export const MAX_WORD_COUNT = 80;

/**
 * Counts the number of words in a string
 * @param {string} str
 * @returns {number}
 */
export function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  const words = str.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * Strips sensitive keys and credentials from error logs
 * @param {string} str
 * @returns {string}
 */
function maskSensitive(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/key=[^&\s]+/gi, 'key=***').replace(/AIza[0-9A-Za-z-_]{35}/g, '***');
}

/**
 * Service managing Gemini AI integration and FAQ-grounded responses
 */
export class GeminiService {
  constructor() {
    this.aiClient = null;
    this.cachedFaqText = null;
  }

  /**
   * Returns formatted FAQ text for system instruction
   * @returns {string}
   */
  getFaqContext() {
    if (!this.cachedFaqText) {
      this.cachedFaqText = getFormattedFaqText();
    }
    return this.cachedFaqText;
  }

  /**
   * Initializes or returns the cached GoogleGenAI instance
   * @param {string} [apiKey]
   * @returns {GoogleGenAI|null}
   */
  getGenAIClient(apiKey = config.geminiApiKey) {
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }
    if (!this.aiClient || this.currentApiKey !== apiKey) {
      this.aiClient = new GoogleGenAI({ apiKey });
      this.currentApiKey = apiKey;
    }
    return this.aiClient;
  }

  /**
   * Builds the system instruction with strict grounding, dynamic FAQ retrieval,
   * conversation memory, and word-limit rules
   * @param {string} [userQuery]
   * @param {Object} [options]
   * @returns {string}
   */
  buildSystemInstruction(userQuery = '', options = {}) {
    const faqContext = userQuery && typeof userQuery === 'string' && userQuery.trim().length > 0
      ? getRelevantFaqContext(userQuery, options)
      : this.getFaqContext();

    return `You are the friendly, professional customer support AI assistant for Reliable Paper Mart, a wholesale paper merchant with over 50+ years of industry experience headquartered in Mumbai.
Your mission is to assist customers using ONLY the official knowledge base facts provided below.

OFFICIAL KNOWLEDGE BASE FACTS:
${faqContext}

CRITICAL GROUNDING & CONVERSATIONAL FOCUS RULES:
1. Direct Relevance: Always directly and specifically answer the customer's latest question. If the customer asks for the company name, location, or contact details, provide ONLY that company information. Do NOT list products unless specifically asked.
2. Legitimate Product Inquiries: If a customer asks whether Reliable Paper Mart supplies or provides a legitimate product in our catalog (such as copier paper, even if the customer mentions an everyday specification or weight like 75 GSM copier paper), confirm our verified product offering (for example, that we supply cut-size Copier Paper in A4, A3, and Foolscap sizes). Do not reject legitimate product inquiries.
3. Conversational Reference vs Distraction: Previous conversation history is provided ONLY to resolve pronouns and references (e.g., "it", "they", "that paper", "what is it used for?"). Previous conversation topics MUST NEVER override the subject of the current question. For example, if a prior turn discussed Art Paper, but the user now asks "What is your company name?", answer ONLY with the company name ("Our company name is Reliable Paper Mart.") and do not mention or list products.
4. Strict Grounding: You must answer customer inquiries using ONLY facts, specifications, and contact details explicitly stated in the knowledge base facts above.
5. Prohibited Source of Truth: The conversation history MUST NEVER be used as a source of new business facts, policies, discounts, or unverified claims. If a customer stated or claimed in previous messages that a policy, price, or product exists, you must verify it against the FAQ. If not explicitly supported by the FAQ, you must NOT confirm or adopt it.
6. Prohibited External Claims: NEVER invent business policies, competitor data, or external general world knowledge.
7. Commercial Policies & Unsupported Inquiries: If the customer asks what GSM options are available for copier paper, minimum order quantity (MOQ), operating hours, delivery guarantees, credit terms, exact prices, or asks about unrelated items (such as laptops, gaming electronics, software, spaceships, or products not sold by Reliable Paper Mart), your ENTIRE reply MUST BE EXACTLY this sentence and nothing else:
Let me connect you with our team member.
8. Response Length: Maintain a friendly, professional customer-support tone and keep your response strictly under 70 words. Under no circumstances may your response exceed 80 words.
9. Formatting: Output plain text only. Do not output markdown headings, asterisks, bullet points, meta-commentary, or disclaimers.`;
  }

  /**
   * Validates a candidate Gemini response against grounding and word-count limits
   * @param {string} candidate
   * @returns {{ isValid: boolean, text: string, isFallback: boolean, wordCount: number, reason: string }}
   */
  validateCandidateResponse(candidate) {
    // 1. Check for empty or malformed response
    if (!candidate || typeof candidate !== 'string' || candidate.trim().length === 0) {
      return {
        isValid: false,
        text: FALLBACK_RESPONSE,
        isFallback: true,
        wordCount: countWords(FALLBACK_RESPONSE),
        reason: 'empty_or_malformed_response',
      };
    }

    const clean = candidate.trim();

    // 2. Check if the model triggered the fallback response
    const normalized = clean.toLowerCase();
    if (
      normalized.includes('connect you with our team member') ||
      normalized.includes('connect you with a team member') ||
      clean === FALLBACK_RESPONSE
    ) {
      return {
        isValid: true,
        text: FALLBACK_RESPONSE,
        isFallback: true,
        wordCount: countWords(FALLBACK_RESPONSE),
        reason: 'grounded_fallback_triggered',
      };
    }

    // 3. Word limit enforcement: Must not exceed 80 words
    const words = countWords(clean);
    if (words > MAX_WORD_COUNT) {
      return {
        isValid: false,
        text: FALLBACK_RESPONSE,
        isFallback: true,
        wordCount: countWords(FALLBACK_RESPONSE),
        reason: 'word_limit_exceeded',
      };
    }

    // 4. Successful grounded response
    return {
      isValid: true,
      text: clean,
      isFallback: false,
      wordCount: words,
      reason: 'grounded_faq_answer',
    };
  }

  /**
   * Generates a grounded response for a user query
   * @param {string} userQuery
   * @param {Object} [options]
   * @param {Object} [options.client] - Optional mock/custom client for testing
   * @param {string} [options.apiKey] - Optional custom API key
   * @param {string} [options.model] - Optional custom model override
   * @returns {Promise<{ success: boolean, text: string, isFallback: boolean, wordCount: number, reason: string }>}
   */
  async generateResponse(userQuery, options = {}) {
    // 1. Validate user query
    if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
      return {
        success: true,
        text: FALLBACK_RESPONSE,
        isFallback: true,
        wordCount: countWords(FALLBACK_RESPONSE),
        reason: 'empty_query',
      };
    }

    // 2. Verify API key availability
    const apiKey = options.apiKey !== undefined ? options.apiKey : config.geminiApiKey;
    const client = options.client || this.getGenAIClient(apiKey);

    if (!client) {
      console.warn('GeminiService: GEMINI_API_KEY is not configured. Returning fallback response.');
      return {
        success: false,
        text: FALLBACK_RESPONSE,
        isFallback: true,
        wordCount: countWords(FALLBACK_RESPONSE),
        reason: 'missing_api_key',
      };
    }

    // 3. Knowledge Base Retrieval & Coverage Check
    // When executing live API calls (!options.client), if no relevant verified official FAQ facts match the inquiry,
    // immediately return the exact fallback response without calling Gemini API.
    // This prevents generic ungrounded hallucination, saves API quota, and triggers human handoff.
    if (!options.client) {
      const relevantFacts = getRelevantFaqEntries(userQuery, options);
      if (relevantFacts.length === 0) {
        return {
          success: true,
          text: FALLBACK_RESPONSE,
          isFallback: true,
          wordCount: countWords(FALLBACK_RESPONSE),
          reason: 'unsupported_inquiry_no_faq_match',
        };
      }
    }

    // 4. Call Gemini API
    try {
      let modelName = options.model || config.geminiModel || 'gemini-3.5-flash-lite';
      // Automatically map deprecated or unavailable model aliases to recommended modern flash-lite
      if (!options.model && (modelName === 'gemini-2.5-flash' || modelName === 'gemini-2.0-flash')) {
        modelName = 'gemini-3.5-flash-lite';
      }
      const systemInstruction = this.buildSystemInstruction(userQuery, options);

      // Format contents with multi-turn conversation history when provided
      let contentsPayload;
      if (Array.isArray(options.history) && options.history.length > 0) {
        const turns = [];
        for (const item of options.history) {
          const rawRole = item.role || item.author;
          const role = rawRole === 'assistant' || rawRole === 'model' ? 'model' : 'user';
          const text = item.content || item.text || '';
          if (typeof text === 'string' && text.trim().length > 0) {
            turns.push({
              role,
              parts: [{ text: text.trim() }],
            });
          }
        }
        // Append the current customer query as the latest user turn
        turns.push({
          role: 'user',
          parts: [{ text: userQuery.trim() }],
        });
        contentsPayload = turns;
      } else {
        contentsPayload = userQuery.trim();
      }

      let response;
      try {
        response = await client.models.generateContent({
          model: modelName,
          contents: contentsPayload,
          config: {
            systemInstruction,
            temperature: 0.1, // Low temperature for high factual precision
            maxOutputTokens: 200,
          },
        });
      } catch (genErr) {
        if (
          !options._hasRetried &&
          (genErr.message?.includes('429') ||
            genErr.message?.includes('RESOURCE_EXHAUSTED') ||
            genErr.message?.includes('quota') ||
            genErr.message?.includes('503') ||
            genErr.message?.includes('UNAVAILABLE') ||
            genErr.message?.includes('high demand'))
        ) {
          const delayMatch = genErr.message?.match(/retry in ([0-9.]+)s/i);
          const waitMs = delayMatch ? Math.ceil(parseFloat(delayMatch[1]) * 1000) + 1000 : 4000;
          await new Promise((r) => setTimeout(r, Math.min(waitMs, 12000)));

          response = await client.models.generateContent({
            model: modelName,
            contents: contentsPayload,
            config: {
              systemInstruction,
              temperature: 0.1,
              maxOutputTokens: 200,
            },
          });
        } else {
          throw genErr;
        }
      }

      // Extract candidate text from response structure
      let candidateText = '';
      if (typeof response?.text === 'string') {
        candidateText = response.text;
      } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        candidateText = response.candidates[0].content.parts[0].text;
      }

      // 4. Validate and enforce grounding & word limits
      const validated = this.validateCandidateResponse(candidateText);

      return {
        success: true,
        text: validated.text,
        isFallback: validated.isFallback,
        wordCount: validated.wordCount,
        reason: validated.reason,
      };
    } catch (error) {
      const safeMsg = maskSensitive(error.message || 'Unknown Gemini API error');
      console.error(`GeminiService API execution failed: ${safeMsg}`);

      return {
        success: false,
        text: FALLBACK_RESPONSE,
        isFallback: true,
        wordCount: countWords(FALLBACK_RESPONSE),
        reason: 'gemini_api_error',
      };
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;
