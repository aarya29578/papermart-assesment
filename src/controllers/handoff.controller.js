import { handoffService } from '../services/handoff.service.js';

/**
 * Controller handling human handoff listing and resolution
 * NOTE: For demonstration and audit evaluation purposes, handoff endpoints are unauthenticated.
 * In a production environment, these endpoints must be protected with authentication/authorization (e.g. JWT/API Key/RBAC).
 */
class HandoffController {
  /**
   * GET /handoffs
   * Lists conversations requiring human assistance or resolved handoffs.
   * Query params:
   * - status: 'pending' | 'resolved'
   * - limit: 1 to 100 (default 50)
   */
  async getHandoffs(req, res, next) {
    try {
      const { status, limit } = req.query;

      const handoffs = await handoffService.getHandoffs({ status, limit });

      return res.status(200).json({
        success: true,
        count: handoffs.length,
        data: handoffs,
      });
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * PATCH /handoffs/:phoneNumber/resolve
   * Resolves an active pending handoff for a given phone number.
   * Sets needsHuman = false, handoffStatus = 'resolved', preserving audit trail.
   */
  async resolveHandoff(req, res, next) {
    try {
      const phoneNumber = req.params.phoneNumber ? req.params.phoneNumber.trim() : null;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number parameter is required',
        });
      }

      const result = await handoffService.resolveHandoff(phoneNumber);

      if (!result.success) {
        const statusCode = result.code === 'MISSING_PHONE' ? 400 : 404;
        return res.status(statusCode).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Handoff marked as resolved successfully',
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const handoffController = new HandoffController();
export default handoffController;
