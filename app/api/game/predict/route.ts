import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

/**
 * Submit a prediction for a period
 * POST /api/game/predict
 * Body: { gameType, periodNumber, prediction, timeInterval }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = requireAuth(request);

    const body = await request.json();
    const { gameType, periodNumber, prediction, timeInterval } = body;

    // Validate input
    if (!gameType || !periodNumber || !prediction || !timeInterval) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: gameType, periodNumber, prediction, timeInterval',
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
    //       message: 'VIP subscription required to make predictions',
    //     },
    //     { status: 403 }
    //   );
    // }

    // Check if period exists and is open
    const period = await prisma.gamePeriod.findUnique({
      where: {
        gameType_periodNumber: {
          gameType,
          periodNumber: String(periodNumber),
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

    if (period.status !== 'open') {
      return NextResponse.json(
        {
          success: false,
          message: 'Period is no longer open for predictions',
        },
        { status: 400 }
      );
    }

    // Check if period has closed
    if (new Date() >= period.closesAt) {
      return NextResponse.json(
        {
          success: false,
          message: 'Period has closed',
        },
        { status: 400 }
      );
    }

    // Check if user already has a prediction for this period
    const existingSession = await prisma.gameSession.findFirst({
      where: {
        userId: authUser.userId,
        gameType,
        periodNumber: String(periodNumber),
      },
    });

    if (existingSession) {
      return NextResponse.json(
        {
          success: false,
          message: 'You have already submitted a prediction for this period',
        },
        { status: 400 }
      );
    }

    // Create game session with prediction
    const gameSession = await prisma.gameSession.create({
      data: {
        userId: authUser.userId,
        gameType,
        periodNumber: String(periodNumber),
        prediction,
        timeInterval,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Prediction submitted successfully',
      data: gameSession,
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
    console.error('Error submitting prediction:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit prediction',
      },
      { status: 500 }
    );
  }
}

