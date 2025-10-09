export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: number;
}

export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 5
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ YouTube API key not configured');
    return [];
  }

  try {
    // Enhanced search query for better educational content
    const searchQuery = encodeURIComponent(`${query} tutorial explained lesson`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=${maxResults * 2}&key=${apiKey}&videoEmbeddable=true&order=relevance`;

    console.log(`🔍 Searching YouTube for: "${query}"`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ YouTube API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`⚠️ No videos found for "${query}"`);
      return [];
    }

    // Extract video IDs
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

    // Fetch video statistics (view count, likes, etc.)
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
    const statsResponse = await fetch(statsUrl);

    if (!statsResponse.ok) {
      console.error('❌ Error fetching video statistics');
      // Fallback: return videos without view counts
      return data.items.slice(0, maxResults).map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }));
    }

    const statsData = await statsResponse.json();

    // Combine video data with statistics
    const videosWithStats = statsData.items?.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics?.viewCount || '0', 10),
    })) || [];

    // Sort by view count (highest first) and take top maxResults
    const sortedVideos = videosWithStats
      .sort((a: YouTubeVideo, b: YouTubeVideo) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, maxResults);

    console.log(`✅ Found ${sortedVideos.length} videos for "${query}" (sorted by views)`);
    return sortedVideos;
  } catch (error) {
    console.error('❌ Error fetching YouTube videos:', error);
    return [];
  }
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
