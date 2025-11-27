import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get results for a period
 * GET /api/game/results?gameType=jalwa&periodNumber=1051
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const gameType = searchParams.get('gameType');
    const periodNumber = searchParams.get('periodNumber');

    if (!gameType || !periodNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required parameters: gameType, periodNumber',
        },
        { status: 400 }
      );
    }

    // Get period
    const period = await prisma.gamePeriod.findUnique({
      where: {
        gameType_periodNumber: {
          gameType,
          periodNumber,
        },
      },
    });

    if (!period) {
      return NextResponse.json(
        {
          success: false,
          message: 'Period not found',
        },
        { status: 404 }
      );
    }

    // Get user's session for this period
    const session = await prisma.gameSession.findFirst({
      where: {
        userId: authUser.userId,
        gameType,
        periodNumber,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        period,
        session,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }
    console.error('Error fetching results:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch results',
      },
      { status: 500 }
    );
  }
}

