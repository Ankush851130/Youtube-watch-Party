import { searchYouTube, getRecommendations } from '../services/youtubeService.js';

export async function handleYouTubeSearch(req, res) {
  try {
    const query = req.query.q || '';
    const results = await searchYouTube(query);
    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error in YouTube search controller:', error);
    return res.status(500).json({ success: false, error: 'Failed to search YouTube videos.' });
  }
}

export async function handleYouTubeRecommendations(req, res) {
  try {
    const videoId = req.query.videoId || '';
    const results = await getRecommendations(videoId);
    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error in YouTube recommendations controller:', error);
    return res.status(500).json({ success: false, error: 'Failed to get recommendations.' });
  }
}

