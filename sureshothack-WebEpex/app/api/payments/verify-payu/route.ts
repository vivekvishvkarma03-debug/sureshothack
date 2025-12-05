import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { verifyPayUPaymentAndUpdateUser } from '@/lib/services/paymentService';
import type { PayUVerifyRequest } from '@/lib/types/payu';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = requireAuth(request);

    const body = await request.json();
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      hash,
    } = body;

    // Validate required fields
    if (!txnid || !amount || !productinfo || !firstname || !email || !status || !hash) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing payment details',
        },
        { status: 400 }
      );
    }

    // Verify payment and update user status
    const paymentData: PayUVerifyRequest = {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      hash,
    };

    const result = await verifyPayUPaymentAndUpdateUser(
      authUser.userId,
      paymentData
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: result.message.includes('signature') ? 400 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      payment: result.payment,
      user: result.user,
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
    console.error('PayU payment verification error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Payment verification failed',
      },
      { status: 500 }
    );
  }
}
