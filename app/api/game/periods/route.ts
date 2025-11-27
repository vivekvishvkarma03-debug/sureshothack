import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get current periods for a game type
 * GET /api/game/periods?gameType=jalwa
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameType = searchParams.get('gameType') || 'jalwa';

    // Get current open periods
    const now = new Date();
    const openPeriods = await prisma.gamePeriod.findMany({
      where: {
        gameType,
        status: 'open',
        closesAt: {
          gt: now,
        },
      },
      orderBy: {
        closesAt: 'asc',
      },
      take: 5, // Return next 5 open periods
    });

    // If no open periods exist, create a default one
    if (openPeriods.length === 0) {
      // Generate a period number (simple incrementing for now)
      const lastPeriod = await prisma.gamePeriod.findFirst({
        where: { gameType },
        orderBy: { periodNumber: 'desc' },
      });

      const nextPeriodNumber = lastPeriod
        ? String(parseInt(lastPeriod.periodNumber) + 1)
        : '1001';

      const newPeriod = await prisma.gamePeriod.create({
        data: {
          gameType,
          periodNumber: nextPeriodNumber,
          status: 'open',
          closesAt: new Date(now.getTime() + 60 * 1000), // Closes in 1 minute
        },
      });

      return NextResponse.json({
        success: true,
        data: [newPeriod],
      });
    }

    return NextResponse.json({
      success: true,
      data: openPeriods,
    });
  } catch (error) {
    console.error('Error fetching periods:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch periods',
      },
      { status: 500 }
    );
  }
}

