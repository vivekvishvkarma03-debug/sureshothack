import { NextResponse } from 'next/server';

/**
 * Get available game types
 * GET /api/game/types
 */
export async function GET() {
  try {
    // Simple hardcoded game types for now
    const gameTypes = [
      { id: 'jalwa', name: 'Jalwa', icon: '🎯' },
      { id: 'tashan', name: 'Tashan', icon: '🏆' },
    ];

    return NextResponse.json({
      success: true,
      data: gameTypes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch game types',
      },
      { status: 500 }
    );
  }
}

