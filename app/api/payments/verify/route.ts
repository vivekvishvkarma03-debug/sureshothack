import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { verifyPaymentAndUpdateUser } from '@/lib/services/paymentService';
import type { RazorpayVerifyRequest } from '@/lib/types/razorpay';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = requireAuth(request);

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing payment details',
        },
        { status: 400 }
      );
    }

    // Verify payment and update user status
    const paymentData: RazorpayVerifyRequest = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    };

    const result = await verifyPaymentAndUpdateUser(
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
    console.error('Payment verification error:', error);
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

