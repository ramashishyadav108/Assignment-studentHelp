export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
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
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=${maxResults}&key=${apiKey}&videoEmbeddable=true&order=relevance`;

    console.log(`🔍 Searching YouTube for: "${query}"`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ YouTube API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();

    const videos = data.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    })) || [];

    console.log(`✅ Found ${videos.length} videos for "${query}"`);
    return videos;
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
