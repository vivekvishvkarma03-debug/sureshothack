import { NextResponse } from 'next/server';

/**
 * DEPRECATED: This endpoint is no longer used
 * Use /api/payments/create-payu-order instead
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'This endpoint is deprecated. Use /api/payments/create-payu-order instead.',
    },
    { status: 410 } // 410 Gone
  );
}

