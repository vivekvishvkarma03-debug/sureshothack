import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUserCount } from '@/lib/services/userService';

/**
 * Debug endpoint to view all users (DEVELOPMENT ONLY)
 * GET /api/debug/users
 * 
 * WARNING: Remove this endpoint in production!
 * This exposes user data and should only be used for development/testing.
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        message: 'This endpoint is not available in production',
      },
      { status: 403 }
    );
  }

  try {
    const users = await getAllUsers();
    const count = await getUserCount();

    return NextResponse.json({
      success: true,
      count,
      users: users.map((user) => ({
        ...user,
        createdAt: user.createdAt instanceof Date 
          ? user.createdAt.toISOString() 
          : user.createdAt,
      })),
      note: 'This is a debug endpoint. Remove in production!',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

