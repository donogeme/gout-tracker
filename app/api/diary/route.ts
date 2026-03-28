import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hfzetignhbtvhehwuzfj.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmemV0aWduaGJ0dmhlaHd1emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTc4MjMsImV4cCI6MjA5MDIzMzgyM30.nIogeM9vXCmw9QJqYQmAexTGOmK5nmf-m8Kv8M5QYXM'
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ entries: [], error: error.message });
    }

    // Transform to match existing format
    const entries = data.map(row => ({
      timestamp: row.timestamp,
      food: row.food,
      meal_type: row.meal_type,
      notes: row.notes || '',
      analysis: {
        rating: row.rating,
        emoji: row.emoji,
        advice: row.advice,
        matches: row.matches,
        analyzed_at: row.analyzed_at
      },
      image_url: row.image_url
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ 
      entries: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
