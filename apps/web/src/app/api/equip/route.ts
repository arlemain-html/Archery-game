import { NextResponse } from 'next/server';
import { updateLoadout } from '../inventory/route';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, itemId } = body;
    
    if (!category || !itemId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    updateLoadout(category, itemId);

    return NextResponse.json({ success: true, category, itemId });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
