import { leadService } from '../services/lead.service.js';

/**
 * Controller to list captured customer leads (GET /leads)
 * NOTE: For demo purposes, this endpoint uses basic input validation.
 * In a production environment, this endpoint must be protected by authentication and authorization (e.g., JWT/API Key).
 */
export const getLeads = async (req, res, next) => {
  try {
    const filter = {};

    // Basic input validation: limit
    let limit = 50;
    if (req.query.limit !== undefined) {
      const parsedLimit = parseInt(req.query.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameter: limit must be an integer between 1 and 100',
        });
      }
      limit = parsedLimit;
    }

    // Basic input validation: phoneNumber filter
    if (req.query.phoneNumber !== undefined) {
      if (typeof req.query.phoneNumber !== 'string' || req.query.phoneNumber.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameter: phoneNumber must be a non-empty string',
        });
      }
      filter.phoneNumber = req.query.phoneNumber.trim();
    }

    const leads = await leadService.getLeads(filter, limit);

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
      _notice:
        'Demo endpoint: currently unauthenticated. Must be protected with authentication/authorization before production deployment.',
    });
  } catch (error) {
    next(error);
  }
};
