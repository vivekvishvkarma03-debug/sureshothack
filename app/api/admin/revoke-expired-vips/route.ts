import { NextRequest, NextResponse } from 'next/server';
import { revokeExpiredVips } from '@/lib/services/userService';

/**
 * Revoke expired VIP subscriptions
 * POST /api/admin/revoke-expired-vips
 * 
 * This endpoint can be called by a cron job or scheduled task
 * to automatically revoke expired VIP subscriptions.
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add admin authentication here
    // const authUser = requireAuth(request);
    // if (!authUser.isAdmin) {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    // }

    const revokedCount = await revokeExpiredVips();

    return NextResponse.json({
      success: true,
      message: `Revoked VIP status for ${revokedCount} expired subscription(s)`,
      revokedCount,
    });
  } catch (error) {
    console.error('Error revoking expired VIPs:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to revoke expired VIPs',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check how many VIPs would be revoked (without actually revoking)
 */
export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const now = new Date();

    const expiredCount = await prisma.user.count({
      where: {
        isVip: true,
        vipExpiresAt: {
          lte: now,
        },
      },
    });

    return NextResponse.json({
      success: true,
      expiredCount,
      message: `Found ${expiredCount} expired VIP subscription(s)`,
    });
  } catch (error) {
    console.error('Error checking expired VIPs:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check expired VIPs',
      },
      { status: 500 }
    );
  }
}

