const express = require('express');
const router = express.Router();
const controller = require('../controllers/genaiController');

// POST /api/genai/generateResume
router.post('/generateResume', controller.generateResume);

// POST /api/genai/parseResume
router.post('/parseResume', controller.parseResume);

// POST /api/genai/analyzeATS
router.post('/analyzeATS', controller.analyzeATS);

// POST /api/genai/analyzeSkillGap
router.post('/analyzeSkillGap', controller.analyzeSkillGap);

// POST /api/genai/chat
router.post('/chat', controller.chat);

module.exports = router;
