import { NextRequest, NextResponse } from 'next/server';
import { createPayUOrder } from '@/lib/utils/payu';
import { validatePaymentRequest } from '@/lib/services/paymentService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, firstname, email, phone } = body;

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

    // Validate required fields
    if (!firstname || !email || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: firstname, email, phone',
        },
        { status: 400 }
      );
    }

    // Create PayU order
    const order = await createPayUOrder({
      amount,
      firstname,
      email,
      phone,
      currency: 'INR',
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('PayU order creation error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create PayU order',
      },
      { status: 500 }
    );
  }
}
