import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch from GitHub API (more reliable than raw URL)
    const response = await fetch(
      'https://api.github.com/repos/donogeme/gout-tracker/contents/diary.json',
      { 
        cache: 'no-store',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'gout-tracker-dashboard'
        }
      }
    );
    
    if (!response.ok) {
      return NextResponse.json({ 
        entries: [], 
        error: `Failed to fetch: ${response.status}` 
      });
    }
    
    const apiResponse = await response.json();
    // Decode base64 content from GitHub API
    const content = Buffer.from(apiResponse.content, 'base64').toString('utf-8');
    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ 
      entries: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
