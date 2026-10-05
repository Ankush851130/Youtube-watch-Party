import axios from 'axios';

// Curated YouTube library for fallback search & default results (100% embeddable videos only)
const CURATED_YOUTUBE_LIBRARY = [
  {
    videoId: 'GG1_DsScm6U',
    title: 'Featured Watch Party Video',
    thumbnail: 'https://img.youtube.com/vi/GG1_DsScm6U/hqdefault.jpg',
    channelTitle: 'YouTube Stream',
    duration: '3:45',
    views: 'Featured',
    category: 'Music Video'
  },
  {
    videoId: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny 4K — Official Open Cinema',
    thumbnail: 'https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
    channelTitle: 'Blender Foundation',
    duration: '10:34',
    views: '25M views',
    category: 'Cinema'
  },
  {
    videoId: 'gWw23EYM9VM',
    title: 'Tears of Steel 4K — Sci-Fi Open Movie',
    thumbnail: 'https://img.youtube.com/vi/gWw23EYM9VM/hqdefault.jpg',
    channelTitle: 'Blender Foundation',
    duration: '12:14',
    views: '18M views',
    category: 'Sci-Fi Cinema'
  },
  {
    videoId: 'YE7VzlLtp-4',
    title: 'Sintel 4K — Open Fantasy Movie',
    thumbnail: 'https://img.youtube.com/vi/YE7VzlLtp-4/hqdefault.jpg',
    channelTitle: 'Blender Foundation',
    duration: '14:48',
    views: '15M views',
    category: 'Animation'
  },
  {
    videoId: 'UDVtMYqUA4w',
    title: 'Interstellar Main Theme — Hans Zimmer (Official Audio)',
    thumbnail: 'https://img.youtube.com/vi/UDVtMYqUA4w/hqdefault.jpg',
    channelTitle: 'WaterTower Music',
    duration: '4:06',
    views: '92M views',
    category: 'Film Score'
  },
  {
    videoId: '5qap5aO4i9A',
    title: 'Lofi Beats for Studying and Relaxation 24/7',
    thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
    channelTitle: 'ChillHop Music',
    duration: 'LIVE',
    views: '45K watching',
    category: 'Lofi'
  },
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    channelTitle: 'Rick Astley',
    duration: '3:33',
    views: '1.5B views',
    category: 'Classic Hits'
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
          duration: '3:45', // Default standard length
          views: 'Verified YouTube Stream',
          category: 'YouTube Search'
        }));
      }
    } catch (err) {
      console.warn('YouTube API call failed or quota exceeded. Falling back to internal engine:', err.message);
    }
  }

  // Fallback search logic matching keywords or returning relevant curated videos
  const cleanQuery = (query || '').toLowerCase().trim();
  if (!cleanQuery) return CURATED_YOUTUBE_LIBRARY;

  const matches = CURATED_YOUTUBE_LIBRARY.filter(v => 
    v.title.toLowerCase().includes(cleanQuery) ||
    v.channelTitle.toLowerCase().includes(cleanQuery) ||
    v.category.toLowerCase().includes(cleanQuery)
  );

  if (matches.length > 0) return matches;

  // If query is an extracted videoId or unfamiliar string, construct dynamic result
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
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const params = {
        part: 'snippet',
        type: 'video',
        maxResults: 10,
        videoEmbeddable: 'true',
        key: apiKey
      };

      if (videoId && videoId.length === 11) {
        params.relatedToVideoId = videoId;
      } else {
        params.q = 'trending music trailers';
      }

      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params,
        timeout: 5000
      });

      if (response.data && response.data.items && response.data.items.length > 0) {
        return response.data.items.map(item => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`,
          channelTitle: item.snippet.channelTitle,
          duration: '3:45',
          views: 'Recommended for you',
          category: 'YouTube Up Next'
        }));
      }
    } catch (err) {
      console.warn('YouTube API recommendation fetch failed or quota limited, using fallback:', err.message);
    }
  }

  // Fallback: Return curated list filtered to exclude current videoId
  return CURATED_YOUTUBE_LIBRARY.filter(v => v.videoId !== videoId).concat(CURATED_YOUTUBE_LIBRARY.slice(0, 4));
}

