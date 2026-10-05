import axios from 'axios';

// Curated YouTube library with 10 sequential videos provided by user
const CURATED_YOUTUBE_LIBRARY = [
  {
    videoId: 'nno6AiEAORA',
    title: 'Recommended Track 1',
    thumbnail: 'https://img.youtube.com/vi/nno6AiEAORA/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #1'
  },
  {
    videoId: '7NCNynJCmKk',
    title: 'Recommended Track 2',
    thumbnail: 'https://img.youtube.com/vi/7NCNynJCmKk/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #2'
  },
  {
    videoId: 'W8x6Dwyj0-A',
    title: 'Recommended Track 3',
    thumbnail: 'https://img.youtube.com/vi/W8x6Dwyj0-A/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #3'
  },
  {
    videoId: 'OGoetWCRVyM',
    title: 'Recommended Track 4',
    thumbnail: 'https://img.youtube.com/vi/OGoetWCRVyM/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #4'
  },
  {
    videoId: 'uaP6KyJzbJ8',
    title: 'Recommended Track 5',
    thumbnail: 'https://img.youtube.com/vi/uaP6KyJzbJ8/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #5'
  },
  {
    videoId: 'kt9IiIWRVnU',
    title: 'Recommended Track 6',
    thumbnail: 'https://img.youtube.com/vi/kt9IiIWRVnU/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #6'
  },
  {
    videoId: 's4jdHWyj5WE',
    title: 'Recommended Track 7',
    thumbnail: 'https://img.youtube.com/vi/s4jdHWyj5WE/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #7'
  },
  {
    videoId: 'ujtZestMWE0',
    title: 'Recommended Track 8',
    thumbnail: 'https://img.youtube.com/vi/ujtZestMWE0/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #8'
  },
  {
    videoId: 'vRjaGgDsWSo',
    title: 'Recommended Track 9',
    thumbnail: 'https://img.youtube.com/vi/vRjaGgDsWSo/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #9'
  },
  {
    videoId: 'xjf_XuRWTcQ',
    title: 'Recommended Track 10',
    thumbnail: 'https://img.youtube.com/vi/xjf_XuRWTcQ/hqdefault.jpg',
    channelTitle: 'YouTube Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Recommendation #10'
  }
];

export async function searchYouTube(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          maxResults: 10,
          type: 'video',
          videoEmbeddable: 'true',
          key: apiKey
        },
        timeout: 5000
      });

      if (response.data && response.data.items && response.data.items.length > 0) {
        return response.data.items.map(item => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`,
          channelTitle: item.snippet.channelTitle,
          duration: '3:45',
          views: 'Verified YouTube Stream',
          category: 'YouTube Search'
        }));
      }
    } catch (err) {
      console.warn('YouTube API call failed or quota exceeded. Falling back to internal engine:', err.message);
    }
  }

  const cleanQuery = (query || '').toLowerCase().trim();
  if (!cleanQuery) return CURATED_YOUTUBE_LIBRARY;

  const matches = CURATED_YOUTUBE_LIBRARY.filter(v => 
    v.title.toLowerCase().includes(cleanQuery) ||
    v.channelTitle.toLowerCase().includes(cleanQuery) ||
    v.category.toLowerCase().includes(cleanQuery)
  );

  if (matches.length > 0) return matches;

  return [
    {
      videoId: cleanQuery.length === 11 ? cleanQuery : 'jfKfPfyJRdk',
      title: `Search Result: ${query}`,
      thumbnail: `https://img.youtube.com/vi/${cleanQuery.length === 11 ? cleanQuery : 'jfKfPfyJRdk'}/hqdefault.jpg`,
      channelTitle: 'YouTube Video',
      duration: '4:00',
      views: 'YouTube Stream',
      category: 'Search Result'
    },
    ...CURATED_YOUTUBE_LIBRARY
  ];
}

export async function getRecommendations(videoId) {
  // Always return the exact 10 sequential videos provided by the user
  return CURATED_YOUTUBE_LIBRARY;
}

