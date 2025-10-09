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

    // Fetch videos for each topic (up to 8 videos per topic for variety)
    const videoPromises = topics.map(async (topic: string) => {
      const videos = await searchYouTubeVideos(topic, 8);
      return { topic, videos };
    });

    const results = await Promise.all(videoPromises);

    // Flatten all videos into a single array and remove duplicates
    const allVideos = results.flatMap((r) => r.videos);
    const uniqueVideos = Array.from(
      new Map(allVideos.map((v) => [v.id, v])).values()
    );

    console.log('✅ Total unique videos found:', uniqueVideos.length);
    console.log('📊 Videos per topic:', results.map(r => `${r.topic}: ${r.videos.length}`));

    return NextResponse.json({
      videos: uniqueVideos,
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
