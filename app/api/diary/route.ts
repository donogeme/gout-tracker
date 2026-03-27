import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  // Try multiple paths to find diary.json
  const paths = [
    join(process.cwd(), 'diary.json'),
    join(process.cwd(), '..', 'diary.json'),
    '/home/ubuntu/clawd/health/gout-tracker/diary.json',
  ];
  
  let diaryPath = null;
  for (const path of paths) {
    if (existsSync(path)) {
      diaryPath = path;
      break;
    }
  }
  
  if (!diaryPath) {
    return NextResponse.json({ entries: [], error: 'diary.json not found' });
  }
  
  const data = readFileSync(diaryPath, 'utf-8');
  return NextResponse.json(JSON.parse(data));
}
