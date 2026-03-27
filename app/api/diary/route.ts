import { NextResponse } from 'next/server';
import diaryData from '../../../diary.json';

export async function GET() {
  return NextResponse.json(diaryData);
}
