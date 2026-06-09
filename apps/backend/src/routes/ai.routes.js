const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/chat', aiController.chat);

module.exports = router;
