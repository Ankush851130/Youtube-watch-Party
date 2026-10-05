import axios from 'axios';

// Curated YouTube library with 10 sequential videos provided by user
const CURATED_YOUTUBE_LIBRARY = [
  {
    videoId: 'nno6AiEAORA',
    title: 'Chalre Chalre Waal | Female Version | Tu Sanwal Phul Kasturi',
    thumbnail: 'https://img.youtube.com/vi/nno6AiEAORA/hqdefault.jpg',
    channelTitle: 'Kunwar Brar',
    duration: '3:45',
    views: 'Featured',
    category: 'Trending Music'
  },
  {
    videoId: '7NCNynJCmKk',
    title: 'LAAL PARI | Yo Yo Honey Singh | Housefull 5',
    thumbnail: 'https://img.youtube.com/vi/7NCNynJCmKk/hqdefault.jpg',
    channelTitle: 'Dimension BeatX',
    duration: '3:45',
    views: 'Featured',
    category: 'Trending Music'
  },
  {
    videoId: 'W8x6Dwyj0-A',
    title: 'MANIAC (Official Video) - Yo Yo Honey Singh | Esha Gupta | Glory',
    thumbnail: 'https://img.youtube.com/vi/W8x6Dwyj0-A/hqdefault.jpg',
    channelTitle: 'T-Series',
    duration: '3:45',
    views: 'Featured',
    category: 'Trending Music'
  },
  {
    videoId: 'OGoetWCRVyM',
    title: 'Jatt Diyan Tauran (Official Video) | Gippy Grewal',
    thumbnail: 'https://img.youtube.com/vi/OGoetWCRVyM/hqdefault.jpg',
    channelTitle: 'Touchwood Productions',
    duration: '3:45',
    views: 'Featured',
    category: 'Trending Music'
  },
  {
    videoId: 'uaP6KyJzbJ8',
    title: 'Modern Talking - Cheri Cheri Lady',
    thumbnail: 'https://img.youtube.com/vi/uaP6KyJzbJ8/hqdefault.jpg',
    channelTitle: 'Downtown Sounds',
    duration: '3:45',
    views: 'Featured',
    category: 'Pop Classic'
  },
  {
    videoId: 'kt9IiIWRVnU',
    title: 'PAYAL - Yo Yo Honey Singh | Nora Fatehi | Paradox | Glory',
    thumbnail: 'https://img.youtube.com/vi/kt9IiIWRVnU/hqdefault.jpg',
    channelTitle: 'T-Series',
    duration: '3:45',
    views: 'Featured',
    category: 'Trending Music'
  },
  {
    videoId: 's4jdHWyj5WE',
    title: 'LAL MERI PAT | Qawwali | Mehfil-e-Sama\'a Live',
    thumbnail: 'https://img.youtube.com/vi/s4jdHWyj5WE/hqdefault.jpg',
    channelTitle: 'Irfan Erooth',
    duration: '3:45',
    views: 'Featured',
    category: 'Qawwali'
  },
  {
    videoId: 'ujtZestMWE0',
    title: 'Ye Shaam Mastani (Slowed + Reverb)',
    thumbnail: 'https://img.youtube.com/vi/ujtZestMWE0/hqdefault.jpg',
    channelTitle: 'Reverbae',
    duration: '3:45',
    views: 'Featured',
    category: 'Slowed & Reverb'
  },
  {
    videoId: 'vRjaGgDsWSo',
    title: 'Casa Tupka Anthemo - Yo Yo Honey Singh feat. Priyanshi',
    thumbnail: 'https://img.youtube.com/vi/vRjaGgDsWSo/hqdefault.jpg',
    channelTitle: 'Yo Yo Honey Singh',
    duration: '3:45',
    views: 'Featured',
    category: 'Trending Music'
  },
  {
    videoId: 'xjf_XuRWTcQ',
    title: 'Saadgi To Humari Zara Dekhiye - Akanksha Grover',
    thumbnail: 'https://img.youtube.com/vi/xjf_XuRWTcQ/hqdefault.jpg',
    channelTitle: 'Humara Music',
    duration: '3:45',
    views: 'Featured',
    category: 'Acoustic / Live'
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

