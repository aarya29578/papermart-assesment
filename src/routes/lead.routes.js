import { Router } from 'express';
import { getLeads } from '../controllers/lead.controller.js';

const router = Router();

// GET /leads (Protected by basic input validation; demo unauthenticated)
router.get('/', getLeads);

export default router;
