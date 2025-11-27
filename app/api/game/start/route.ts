import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

/**
 * Start a game session (create period if needed)
 * POST /api/game/start
 * Body: { gameType, timeInterval }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = requireAuth(request);

    const body = await request.json();
    const { gameType, timeInterval } = body;

    // Validate input
    if (!gameType || !timeInterval) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: gameType, timeInterval',
        },
        { status: 400 }
      );
    }

    // TODO: Re-enable VIP check for production
    // TEMPORARILY DISABLED FOR TESTING - Allow all authenticated users to play
    // Check if user is VIP
    // const user = await prisma.user.findUnique({
    //   where: { id: authUser.userId },
    //   select: { isVip: true, isPremium: true },
    // });

    // if (!user || (!user.isVip && !user.isPremium)) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: 'VIP subscription required to start game',
    //     },
    //     { status: 403 }
    //   );
    // }

    // Calculate close time based on interval
    const intervalSeconds: Record<string, number> = {
      '30s': 30,
      '1m': 60,
      '5m': 300,
    };

    const seconds = intervalSeconds[timeInterval] || 60;
    const closesAt = new Date(Date.now() + seconds * 1000);

    // Get or create current open period
    let period = await prisma.gamePeriod.findFirst({
      where: {
        gameType,
        status: 'open',
        closesAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        closesAt: 'asc',
      },
    });

    // If no open period exists, create one
    if (!period) {
      const lastPeriod = await prisma.gamePeriod.findFirst({
        where: { gameType },
        orderBy: { periodNumber: 'desc' },
      });

      const nextPeriodNumber = lastPeriod
        ? String(parseInt(lastPeriod.periodNumber) + 1)
        : '1001';

      period = await prisma.gamePeriod.create({
        data: {
          gameType,
          periodNumber: nextPeriodNumber,
          status: 'open',
          closesAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Game started successfully',
      data: {
        period,
        timeInterval,
        closesAt: period.closesAt,
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
    console.error('Error starting game:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start game',
      },
      { status: 500 }
    );
  }
}

