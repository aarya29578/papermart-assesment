import { Lead } from '../models/Lead.js';

/**
 * Product catalog mappings for detecting products of interest from customer messages
 */
const CATALOG_PRODUCTS = [
  {
    name: 'Copier Paper',
    patterns: [
      /\bcopier\s*paper\b/i,
      /\bphotocopy\s*paper\b/i,
      /\b(?:70|75|80)\s*gsm\b/i,
      /\ba4\s*(?:paper|size|copier)?\b/i,
      /\ba3\s*(?:paper|size|copier)?\b/i,
      /\breams?\b/i,
      /\bjk\s*(?:copier|paper)?\b/i,
    ],
  },
  {
    name: 'Art Paper / Art Board',
    patterns: [
      /\bart\s*paper\b/i,
      /\bart\s*board\b/i,
      /\bgloss\s*(?:art|finish)?\b/i,
      /\bmatte\s*(?:art|finish)?\b/i,
      /\b(?:130|170|220|250|300|350)\s*gsm\b/i,
    ],
  },
  {
    name: 'Kraft Paper',
    patterns: [
      /\bkraft\s*paper\b/i,
      /\bpackaging\s*paper\b/i,
      /\bcorrugated\s*(?:paper|box|packaging)?\b/i,
    ],
  },
  {
    name: 'Duplex Board',
    patterns: [
      /\bduplex\s*board\b/i,
      /\bcoated\s*duplex\b/i,
    ],
  },
  {
    name: 'Maplitho Paper',
    patterns: [
      /\bmaplitho\b/i,
      /\bprinting\s*paper\b/i,
    ],
  },
];

/**
 * Patterns that indicate buying or ordering intent
 */
const BUYING_INTENT_PATTERNS = [
  /\b(?:i\s+want\s+to|want\s+to|looking\s+to|like\s+to)\s+(?:order|buy|purchase|procure)\b/i,
  /\b(?:please\s+)?(?:share|send|give|provide)\s+(?:a\s+)?(?:quotation|quote|pricing|rate|rates|price)\b/i,
  /\b(?:need|require)\s+\d+\s*(?:reams?|sheets?|kg|tons?|boxes?|cartons?|pallets?)\b/i,
  /\bhow\s+(?:can|do)\s+i\s+(?:place|make)\s+(?:a\s+)?(?:bulk\s+)?order\b/i,
  /\b(?:place|make)\s+(?:an?\s+)?(?:bulk\s+)?order\b/i,
  /\b(?:order|buy|purchase|procure)\s+(?:some\s+)?(?:paper|copier|ream|sheets?|kraft|art|duplex)\b/i,
  /\bneed\s+(?:a\s+)?(?:quotation|quote|pricing|rate)\b/i,
  /\bwholesale\s+(?:order|rate|price|inquiry|enquiry)\b/i,
  /\bbulk\s+(?:order|purchase|pricing|rate)\b/i,
  /\binterested\s+in\s+(?:buying|ordering|purchasing)\b/i,
  /\bcan\s+i\s+(?:order|buy|purchase)\b/i,
  /\bwhat\s+is\s+the\s+price\s+for\s+\d+/i,
];

/**
 * Patterns for extracting customer names explicitly introduced in chat
 */
const NAME_PATTERNS = [
  /(?:my\s+name\s+is|i\s+am|i'm|this\s+is|myself)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  /(?:name\s*[:\-]\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  /(?:call\s+me\s+)([A-Z][a-z]+)/i,
];

/**
 * Words that follow introductory pronouns but are not personal names
 */
const STOP_WORDS = new Set([
  'interested', 'looking', 'ordering', 'here', 'writing', 'asking', 'wondering',
  'copier', 'paper', 'reliable', 'mart', 'customer', 'buyer', 'hello', 'please',
  'quote', 'quotation', 'need', 'want', 'having', 'today', 'urgent', 'bulk',
  'inquiring', 'enquiring', 'trying', 'ready', 'happy', 'planning', 'glad'
]);

/**
 * Lead capture service
 */
export class LeadService {
  /**
   * Detects whether the customer message indicates commercial/buying intent
   * @param {string} text
   * @returns {boolean}
   */
  detectBuyingIntent(text) {
    if (!text || typeof text !== 'string') return false;
    return BUYING_INTENT_PATTERNS.some((pattern) => pattern.test(text));
  }

  /**
   * Extracts a paper product of interest based on the catalog
   * @param {string} text
   * @returns {string|null}
   */
  extractProduct(text) {
    if (!text || typeof text !== 'string') return null;

    for (const product of CATALOG_PRODUCTS) {
      if (product.patterns.some((pattern) => pattern.test(text))) {
        return product.name;
      }
    }

    return null;
  }

  /**
   * Extracts an explicitly stated customer name from message text
   * @param {string} text
   * @returns {string|null}
   */
  extractName(text) {
    if (!text || typeof text !== 'string') return null;

    for (const pattern of NAME_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        const firstWordLower = candidate.split(/\s+/)[0].toLowerCase();

        // Reject stop words or invalid name candidates
        if (STOP_WORDS.has(firstWordLower) || candidate.length < 2 || candidate.length > 40) {
          continue;
        }

        // Format name with title case
        return candidate
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    }

    return null;
  }

  /**
   * Processes a customer message for lead capture:
   * - Finds existing lead for the phone number.
   * - Updates existing lead if name or product is newly identified.
   * - Creates a new lead only when buying intent is present or name is introduced.
   * - Ignores general greetings and unrelated questions.
   *
   * @param {string} phoneNumber
   * @param {Object} [options]
   * @param {string} [options.text]
   * @param {string} [options.contactName]
   * @returns {Promise<{ isNew: boolean, isUpdated: boolean, lead: Object|null }>}
   */
  async processLead(phoneNumber, { text = '', contactName = null } = {}) {
    if (!phoneNumber) return { isNew: false, isUpdated: false, lead: null };

    const detectedName = this.extractName(text);
    const detectedProduct = this.extractProduct(text);
    const hasBuyingIntent = this.detectBuyingIntent(text);

    // Look for existing lead for this customer phone number
    let lead = await Lead.findOne({ phoneNumber }).sort({ createdAt: -1 });

    if (lead) {
      let updated = false;

      // 1. Update name if customer explicitly shared it
      if (detectedName && lead.name !== detectedName) {
        lead.name = detectedName;
        updated = true;
      } else if (!lead.name && contactName) {
        lead.name = contactName;
        updated = true;
      }

      // 2. Update product if customer expressed buying interest in a product
      if (detectedProduct && lead.productOfInterest !== detectedProduct) {
        lead.productOfInterest = detectedProduct;
        updated = true;
      } else if (hasBuyingIntent && !lead.productOfInterest) {
        lead.productOfInterest = detectedProduct || 'General Paper Products';
        updated = true;
      }

      if (updated) {
        await lead.save();
        return { isNew: false, isUpdated: true, lead };
      }

      return { isNew: false, isUpdated: false, lead };
    }

    // If no existing lead, create only when buying intent is present or name is explicitly introduced
    if (hasBuyingIntent || detectedName) {
      const finalName = detectedName || contactName || null;
      const finalProduct = detectedProduct || (hasBuyingIntent ? 'General Paper Products' : null);

      lead = new Lead({
        phoneNumber,
        name: finalName,
        productOfInterest: finalProduct,
      });

      await lead.save();
      return { isNew: true, isUpdated: false, lead };
    }

    // No lead created for general inquiries, greetings, or unrelated chatter
    return { isNew: false, isUpdated: false, lead: null };
  }

  /**
   * Retrieves all captured leads, ordered by newest first
   * @param {Object} [filter]
   * @param {number} [limit=50]
   * @returns {Promise<Array<Object>>}
   */
  async getLeads(filter = {}, limit = 50) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
    return Lead.find(filter).sort({ createdAt: -1 }).limit(safeLimit).lean();
  }
}

export const leadService = new LeadService();
export default leadService;
