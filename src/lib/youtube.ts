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
    console.warn('YouTube API key not configured');
    return [];
  }

  try {
    const searchQuery = encodeURIComponent(`${query} educational tutorial lesson`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=${maxResults}&key=${apiKey}&videoCategoryId=27`; // Category 27 = Education

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('YouTube API error:', await response.text());
      return [];
    }

    const data = await response.json();

    return data.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    })) || [];
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
