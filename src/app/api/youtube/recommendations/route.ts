import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeVideos } from '@/lib/youtube';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topics } = body;

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: 'Topics array is required' },
        { status: 400 }
      );
    }

    // Fetch videos for each topic
    const videoPromises = topics.map(async (topic: string) => {
      const videos = await searchYouTubeVideos(topic, 10);
      return { topic, videos };
    });

    const results = await Promise.all(videoPromises);

    // Flatten all videos into a single array and remove duplicates
    const allVideos = results.flatMap((r) => r.videos);
    const uniqueVideos = Array.from(
      new Map(allVideos.map((v) => [v.id, v])).values()
    );

    return NextResponse.json({
      videos: uniqueVideos,
      topicResults: results,
    });
  } catch (error) {
    console.error('Error fetching YouTube recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
