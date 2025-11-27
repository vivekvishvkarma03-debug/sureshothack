import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { checkAndUpdateVipExpiry } from '@/lib/services/userService';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = requireAuth(request);

    // Check and update VIP expiry status
    const user = await checkAndUpdateVipExpiry(authUser.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Return user with VIP/Premium status
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        isPremium: user.isPremium ?? false,
        isVip: user.isVip ?? false,
        vipExpiresAt: user.vipExpiresAt,
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
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

