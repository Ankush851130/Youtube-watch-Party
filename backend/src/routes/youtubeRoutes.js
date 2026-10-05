import express from 'express';
import { handleYouTubeSearch, handleYouTubeRecommendations } from '../controllers/youtubeController.js';

const router = express.Router();

router.get('/search', handleYouTubeSearch);
router.get('/recommendations', handleYouTubeRecommendations);

export default router;

