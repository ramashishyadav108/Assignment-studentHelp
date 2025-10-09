import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeVideos } from '@/lib/youtube';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topics } = body;

    console.log('📺 YouTube Recommendations API called');
    console.log('📝 Topics requested:', topics);

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      console.error('❌ No topics provided');
      return NextResponse.json(
        { error: 'Topics array is required' },
        { status: 400 }
      );
    }

    // Fetch videos for each topic - searchYouTubeVideos already sorts by view count
    const videoPromises = topics.map(async (topic: string) => {
      const videos = await searchYouTubeVideos(topic, 3); // Get top 3 for each topic
      return { 
        topic, 
        topVideo: videos.length > 0 ? videos[0] : null, // Highest viewed video for this topic
        allVideos: videos 
      };
    });

    const results = await Promise.all(videoPromises);

    // Get one top video per topic (highest views)
    const topVideos = results
      .filter(r => r.topVideo !== null)
      .map(r => ({
        ...r.topVideo!,
        topic: r.topic // Add topic information to the video
      }));

    console.log('✅ Top videos found:', topVideos.length, 'for', topics.length, 'topics');
    console.log('📊 Videos per topic:', results.map(r => 
      `${r.topic}: ${r.topVideo ? `${r.topVideo.title.slice(0, 50)}... (${r.topVideo.viewCount?.toLocaleString()} views)` : 'No video found'}`
    ));

    return NextResponse.json({
      videos: topVideos, // One video per topic, sorted by view count
      topicResults: results,
    });
  } catch (error) {
    console.error('❌ Error fetching YouTube recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
