import { Router } from 'express';
import { handoffController } from '../controllers/handoff.controller.js';

const router = Router();

// GET /handoffs - List pending or resolved handoffs
router.get('/', (req, res, next) => handoffController.getHandoffs(req, res, next));

// PATCH /handoffs/:phoneNumber/resolve - Mark handoff as resolved
router.patch('/:phoneNumber/resolve', (req, res, next) =>
  handoffController.resolveHandoff(req, res, next)
);

export default router;
