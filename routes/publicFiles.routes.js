import express from 'express';
import { download } from '../controllers/file.controller.js';

const router = express.Router();

router.get('/:filename', download);

export { router };