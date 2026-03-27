import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[diary-api] Fetching from GitHub API...');
    
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
    
    console.log('[diary-api] GitHub response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[diary-api] GitHub API error:', errorText);
      return NextResponse.json({ 
        entries: [], 
        error: `Failed to fetch: ${response.status}`,
        details: errorText
      });
    }
    
    const apiResponse = await response.json();
    console.log('[diary-api] Got API response, content length:', apiResponse.content?.length);
    
    // Decode base64 content from GitHub API
    const content = Buffer.from(apiResponse.content, 'base64').toString('utf-8');
    console.log('[diary-api] Decoded content length:', content.length);
    
    const data = JSON.parse(content);
    console.log('[diary-api] Parsed data, entries:', data.entries?.length);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[diary-api] Error:', error);
    return NextResponse.json({ 
      entries: [], 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
