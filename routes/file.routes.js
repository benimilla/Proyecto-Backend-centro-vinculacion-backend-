// routes/file.routes.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/upload', auth, fileController.uploadFile);

router.get('/:id', auth, fileController.getFileById);

router.delete('/:id', auth, fileController.deleteFile);

module.exports = router;
