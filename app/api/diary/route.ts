import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const diaryPath = join(process.cwd(), '..', 'diary.json');
  
  if (!existsSync(diaryPath)) {
    return NextResponse.json({ entries: [] });
  }
  
  const data = readFileSync(diaryPath, 'utf-8');
  return NextResponse.json(JSON.parse(data));
}
