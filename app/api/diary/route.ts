import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch from GitHub raw URL
    const response = await fetch(
      'https://raw.githubusercontent.com/donogeme/gout-tracker/master/diary.json',
      { cache: 'no-store' }  // Always fetch fresh data
    );
    
    if (!response.ok) {
      return NextResponse.json({ 
        entries: [], 
        error: `Failed to fetch: ${response.status}` 
      });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ 
      entries: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
