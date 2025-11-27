# Razorpay Integration Guide

## ✅ Integration Complete

The Razorpay payment gateway has been fully integrated with a clean, type-safe architecture.

## 📁 File Structure

```
lib/
├── types/
│   └── razorpay.ts              # TypeScript types for Razorpay
├── utils/
│   ├── razorpay.ts              # Backend Razorpay utilities
│   └── razorpay-client.ts       # Frontend Razorpay utilities
├── services/
│   └── paymentService.ts        # Payment business logic
└── api.ts                       # API client with payment methods

app/
├── api/
│   └── payments/
│       ├── create-order/
│       │   └── route.ts         # Create Razorpay order endpoint
│       └── verify/
│           └── route.ts         # Verify payment endpoint
└── page.tsx                     # Frontend payment integration
```

## 🔧 Configuration

### Environment Variables

Required environment variables (already configured):

```env
# Backend (Server-side)
RAZORPAY_KEY_ID="rzp_live_2cN75xjOem1FiH"
RAZORPAY_KEY_SECRET="XgFqSKHaloOraAdBKdWwM6pC"

# Frontend (Client-side)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_2cN75xjOem1FiH"
```

## 🏗️ Architecture

### Backend Utilities (`lib/utils/razorpay.ts`)

- **`getRazorpayInstance()`**: Creates and returns Razorpay instance
- **`getRazorpayKeyId()`**: Gets public key ID for frontend
- **`createRazorpayOrder()`**: Creates a Razorpay order
- **`verifyRazorpaySignature()`**: Verifies payment signature securely
- **`validatePaymentAmount()`**: Validates payment amount

### Frontend Utilities (`lib/utils/razorpay-client.ts`)

- **`getRazorpayKeyId()`**: Gets Razorpay key ID from env
- **`isRazorpayLoaded()`**: Checks if Razorpay script is loaded
- **`createRazorpayCheckout()`**: Creates Razorpay checkout instance
- **`getDefaultRazorpayOptions()`**: Returns default checkout options

### Payment Service (`lib/services/paymentService.ts`)

- **`verifyPaymentAndUpdateUser()`**: Verifies payment and updates user VIP status
- **`validatePaymentRequest()`**: Validates payment request

## 🔄 Payment Flow

1. **User clicks "START NOW"**
   - Frontend calls `/api/payments/create-order`
   - Backend creates Razorpay order
   - Returns order details to frontend

2. **Razorpay Checkout Opens**
   - Frontend initializes Razorpay checkout with order details
   - User completes payment in Razorpay modal

3. **Payment Success Handler**
   - Razorpay calls handler with payment response
   - Frontend calls `/api/payments/verify` with payment details
   - Backend verifies signature and updates user VIP status

4. **User Status Updated**
   - User's `isVip` and `isPremium` flags set to `true`
   - Page reloads to show updated status

## 🔐 Security Features

1. **Signature Verification**
   - All payments are verified using HMAC SHA256 signature
   - Prevents payment fraud and tampering
   - Uses constant-time comparison for security

2. **Authentication Required**
   - Payment verification requires valid JWT token
   - Only authenticated users can verify payments

3. **Amount Validation**
   - Minimum amount: ₹1 (100 paise)
   - Maximum amount: ₹10,00,000 (100000000 paise)
   - Validates amount before creating order

4. **Error Handling**
   - Comprehensive error handling at all levels
   - User-friendly error messages
   - Proper logging for debugging

## 📝 API Endpoints

### POST `/api/payments/create-order`

Creates a Razorpay order.

**Request:**
```json
{
  "amount": 65500,
  "currency": "INR",
  "notes": {}
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_xxx",
    "amount": 65500,
    "currency": "INR",
    "receipt": "receipt_xxx"
  }
}
```

### POST `/api/payments/verify`

Verifies payment and updates user VIP status.

**Request:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully...",
  "payment": {
    "orderId": "order_xxx",
    "paymentId": "pay_xxx"
  },
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "isVip": true,
    "isPremium": true
  }
}
```

## 💻 Usage Examples

### Backend: Create Order

```typescript
import { createRazorpayOrder } from '@/lib/utils/razorpay';

const order = await createRazorpayOrder({
  amount: 65500, // ₹655 in paise
  currency: 'INR',
  notes: { userId: 'user_123' },
});
```

### Backend: Verify Payment

```typescript
import { verifyRazorpaySignature } from '@/lib/utils/razorpay';

const isValid = verifyRazorpaySignature({
  razorpay_order_id: 'order_xxx',
  razorpay_payment_id: 'pay_xxx',
  razorpay_signature: 'signature_xxx',
});
```

### Frontend: Initialize Checkout

```typescript
import { createRazorpayCheckout, getDefaultRazorpayOptions } from '@/lib/utils/razorpay-client';
import { apiClient } from '@/lib/api';

// Create order
const orderResponse = await apiClient.createPaymentOrder(65500, 'INR');
const order = orderResponse.order!;

// Create checkout options
const options = getDefaultRazorpayOptions(
  order.id,
  order.amount,
  order.currency,
  async (response) => {
    // Handle payment success
    const verifyResponse = await apiClient.verifyPayment({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    });
  },
  { fullName: 'John Doe', email: 'john@example.com' }
);

// Open checkout
const razorpay = createRazorpayCheckout(options);
razorpay.open();
```

## 🧪 Testing

### Test Payment Flow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Login/Signup**
   - Create an account or login
   - Navigate to home page

3. **Initiate Payment**
   - Click "START NOW" button
   - Razorpay checkout modal should open

4. **Test Payment** (Use Razorpay Test Cards)
   - Card Number: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - Name: Any name

5. **Verify Payment**
   - Payment should be verified
   - User VIP status should be updated
   - Page should reload showing VIP status

## 🐛 Troubleshooting

### Error: "Razorpay credentials are not configured"

**Solution:** Ensure `.env` file has:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### Error: "Payment gateway is loading"

**Solution:** Wait for Razorpay script to load. Check browser console for script loading errors.

### Error: "Invalid payment signature"

**Solution:** 
- Verify environment variables are correct
- Ensure payment details are not tampered with
- Check that order ID and payment ID match

### Payment Created But Not Verified

**Solution:**
- Check authentication token is valid
- Verify backend logs for errors
- Ensure user exists in database
- Check database connection

## 📚 TypeScript Types

All Razorpay types are defined in `lib/types/razorpay.ts`:

- `RazorpayOrder`
- `RazorpayOrderCreateOptions`
- `RazorpayOrderResponse`
- `RazorpayPaymentResponse`
- `RazorpayVerifyRequest`
- `RazorpayCheckoutOptions`
- `RazorpayInstance`

## ✨ Features

- ✅ Type-safe Razorpay integration
- ✅ Centralized configuration
- ✅ Secure signature verification
- ✅ Comprehensive error handling
- ✅ User-friendly error messages
- ✅ Automatic VIP status update
- ✅ Clean, maintainable code structure
- ✅ Proper TypeScript types
- ✅ Reusable utility functions

## 🔄 Next Steps

1. **Add Payment History**
   - Store payment records in database
   - Create payment history page

2. **Add Subscription Management**
   - Track subscription expiry
   - Auto-renewal options

3. **Add Refund Support**
   - Handle refund requests
   - Update user status on refund

4. **Add Webhook Support**
   - Handle Razorpay webhooks
   - Update payment status automatically

## 📖 References

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Node.js SDK](https://github.com/razorpay/razorpay-node)
- [Razorpay Checkout Integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)

