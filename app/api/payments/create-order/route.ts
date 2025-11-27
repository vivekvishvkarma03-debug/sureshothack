import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/utils/razorpay';
import { validatePaymentRequest } from '@/lib/services/paymentService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', notes } = body;

    // Validate payment amount
    try {
      validatePaymentRequest(amount);
    } catch (validationError) {
      return NextResponse.json(
        {
          success: false,
          message:
            validationError instanceof Error
              ? validationError.message
              : 'Invalid payment amount',
        },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const order = await createRazorpayOrder({
      amount,
      currency,
      notes,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create order',
      },
      { status: 500 }
    );
  }
}

