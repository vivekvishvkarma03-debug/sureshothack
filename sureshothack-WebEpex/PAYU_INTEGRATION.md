# PayU Payment Gateway Integration Guide

## ✅ Integration Complete

The PayU payment gateway has been fully integrated with a clean, type-safe architecture replacing Razorpay.

## 📁 File Structure

```
lib/
├── types/
│   └── payu.ts                  # TypeScript types for PayU
├── utils/
│   ├── payu.ts                  # Backend PayU utilities
│   └── payu-client.ts           # Frontend PayU utilities
├── services/
│   └── paymentService.ts        # Payment business logic (updated with PayU support)
└── api.ts                       # API client with payment methods (updated)

app/
├── api/
│   └── payments/
│       ├── create-payu-order/
│       │   └── route.ts         # Create PayU order endpoint
│       └── verify-payu/
│           └── route.ts         # Verify PayU payment endpoint
└── page.tsx                     # Frontend payment integration
```

## 🔧 Configuration

### Environment Variables

Required environment variables (add to `.env.local`):

```env
# Backend (Server-side)
PAYU_MERCHANT_KEY="Your PayU Merchant Key"
PAYU_MERCHANT_SALT="Your PayU Merchant Salt"

# Frontend (Client-side)
NEXT_PUBLIC_PAYU_MERCHANT_KEY="Your PayU Merchant Key"
```

## 🏗️ Architecture

### Backend Utilities (`lib/utils/payu.ts`)

- **`getPayUMerchantKey()`**: Gets merchant key from environment
- **`getPayUMerchantSalt()`**: Gets merchant salt from environment
- **`getPayUPublicKey()`**: Gets public key for frontend
- **`generatePayUHash()`**: Generates SHA512 hash for payment verification
- **`createPayUOrder()`**: Creates a PayU order
- **`verifyPayUSignature()`**: Verifies payment signature securely
- **`validatePaymentAmount()`**: Validates payment amount

### Frontend Utilities (`lib/utils/payu-client.ts`)

- **`getPayUMerchantKey()`**: Gets merchant key from environment
- **`isPayULoaded()`**: Checks if DOM is ready
- **`submitPayUForm()`**: Submits PayU payment form
- **`getDefaultPayUOptions()`**: Returns default checkout options
- **`handlePayUResponse()`**: Handles PayU response data

### Payment Service (`lib/services/paymentService.ts`)

- **`verifyPaymentAndUpdateUser()`**: Verifies Razorpay payments (legacy)
- **`verifyPayUPaymentAndUpdateUser()`**: Verifies PayU payments and updates user VIP status

## 🔄 Payment Flow

1. **User clicks "START NOW" (Non-VIP)**
   - Frontend calls `/api/payments/create-payu-order`
   - Backend creates PayU order with hash
   - Returns order details to frontend

2. **PayU Payment Form**
   - Frontend submits PayU form to secure.payu.in
   - User completes payment on PayU gateway
   - PayU redirects to success or failure URL

3. **Payment Success Handler**
   - PayU redirects to `/api/payments/verify-payu` with payment response
   - Backend verifies signature and updates user VIP status
   - User's `isVip` and `isPremium` flags set to `true`

4. **User Status Updated**
   - Page reloads to show updated VIP status
   - User can now access VIP features

## 🔐 Security Features

1. **Hash Verification**
   - All payments use SHA512 hash verification
   - Request hash: `salt|txnid|amount|productinfo|firstname|email|||||||||||||`
   - Response hash: `salt|status||||email|firstname|productinfo|amount|txnid|key`
   - Constant-time comparison prevents timing attacks

2. **Authentication Required**
   - Payment verification requires valid JWT token
   - Only authenticated users can verify payments

3. **Amount Validation**
   - Minimum amount: ₹1
   - Maximum amount: ₹10,00,000
   - Validates amount before creating order

4. **Error Handling**
   - Comprehensive error handling at all levels
   - User-friendly error messages
   - Proper logging for debugging

## 📝 API Endpoints

### POST `/api/payments/create-payu-order`

Creates a PayU order.

**Request:**
```json
{
  "amount": 1100,
  "firstname": "John",
  "email": "john@example.com",
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "txnid": "txn_1702xxx",
    "amount": 1100,
    "currency": "INR",
    "key": "merchant_key",
    "hash": "hash_value",
    "surl": "https://example.com/api/payments/verify-payu",
    "furl": "https://example.com/api/payments/failure"
  }
}
```

### POST `/api/payments/verify-payu`

Verifies payment and updates user VIP status.

**Request (From PayU Redirect):**
```json
{
  "txnid": "txn_1702xxx",
  "amount": "1100",
  "productinfo": "VIP Subscription - 30 Days",
  "firstname": "John",
  "email": "john@example.com",
  "status": "success",
  "hash": "hash_value"
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
  "message": "Payment verified successfully. Your VIP subscription is now active...",
  "payment": {
    "orderId": "txn_1702xxx",
    "paymentId": "txn_1702xxx"
  },
  "user": {
    "id": "user_xxx",
    "email": "john@example.com",
    "isVip": true,
    "isPremium": true
  }
}
```

## 💻 Usage Examples

### Backend: Create Order

```typescript
import { createPayUOrder } from '@/lib/utils/payu';

const order = await createPayUOrder({
  amount: 1100,
  firstname: 'John',
  email: 'john@example.com',
  phone: '9876543210',
  currency: 'INR',
});
```

### Backend: Verify Payment

```typescript
import { verifyPayUSignature, getPayUMerchantSalt } from '@/lib/utils/payu';

const salt = getPayUMerchantSalt();
const isValid = verifyPayUSignature({
  txnid: 'txn_xxx',
  amount: '1100',
  productinfo: 'VIP Subscription - 30 Days',
  firstname: 'John',
  email: 'john@example.com',
  status: 'success',
  hash: 'hash_value',
}, salt);
```

### Frontend: Submit PayU Form

```typescript
import { submitPayUForm, getDefaultPayUOptions, getPayUMerchantKey } from '@/lib/utils/payu-client';
import { apiClient } from '@/lib/api';

// Create order
const orderResponse = await apiClient.createPayUOrder(
  1100,
  'John',
  'john@example.com',
  '9876543210'
);
const order = orderResponse.order!;

// Create checkout options
const options = getDefaultPayUOptions(
  order.txnid,
  order.amount,
  order.hash,
  { fullName: 'John Doe', email: 'john@example.com', phone: '9876543210' }
);

// Submit form to PayU
submitPayUForm(options);
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
   - You should be redirected to PayU payment page

4. **Test Payment** (Use PayU Test Credentials)
   - PayU provides test card details in their documentation
   - You can use test cards to simulate successful/failed payments
   - Check PayU dashboard for test credentials

5. **Verify Payment**
   - After payment success, you'll be redirected back to the app
   - User VIP status should be updated
   - Page should reload showing VIP status

## 🔄 Payment Status

PayU supports the following payment statuses:

- **success**: Payment completed successfully
- **failure**: Payment failed
- **pending**: Payment is pending (rare, usually resolves to success/failure)

The system only updates user VIP status on **success** status.

## 🐛 Troubleshooting

### Error: "PayU credentials are not configured"

**Solution:** Ensure `.env.local` file has:
- `PAYU_MERCHANT_KEY`
- `PAYU_MERCHANT_SALT`
- `NEXT_PUBLIC_PAYU_MERCHANT_KEY`

### Error: "Invalid hash"

**Solution:**
- Verify environment variables are correct
- Ensure hash is calculated correctly
- Check PayU documentation for hash string format

### Payment Created But Not Verified

**Solution:**
- Check authentication token is valid
- Verify backend logs for errors
- Ensure user exists in database
- Check database connection

### User Redirected But Status Not Updated

**Solution:**
- Check that verification endpoint received all required fields
- Verify hash calculation in response handler
- Check user record in database

## 📚 TypeScript Types

All PayU types are defined in `lib/types/payu.ts`:

- `PayUOrder`
- `PayUOrderCreateOptions`
- `PayUOrderResponse`
- `PayUPaymentResponse`
- `PayUVerifyRequest`
- `PayUCheckoutOptions`

## 📊 Database Schema

PayU integration uses the same Prisma schema with the following user fields:

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  fullName      String
  password      String
  isVip         Boolean  @default(false)
  isPremium     Boolean  @default(false)
  vipExpiresAt  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## ✨ Features

- ✅ Type-safe PayU integration
- ✅ Centralized configuration
- ✅ Secure SHA512 hash verification
- ✅ Comprehensive error handling
- ✅ User-friendly error messages
- ✅ Automatic VIP status update with 30-day expiry
- ✅ Clean, maintainable code structure
- ✅ Proper TypeScript types
- ✅ Reusable utility functions
- ✅ Legacy Razorpay support maintained

## 🔄 Switching Between Payment Gateways

The system supports both Razorpay and PayU:

**For Razorpay:**
```typescript
const order = await apiClient.createPaymentOrder(110000, 'INR');
const response = await apiClient.verifyPayment(paymentData);
```

**For PayU:**
```typescript
const order = await apiClient.createPayUOrder(1100, firstname, email, phone);
const response = await apiClient.verifyPayUPayment(paymentData);
```

## 📖 References

- [PayU Documentation](https://www.payu.in/)
- [PayU Integration Guide](https://www.payu.in/developers)
- [PayU Payment Gateway](https://www.payu.in/features)

## 🔐 Security Checklist

- [ ] Environment variables configured correctly
- [ ] Hash verification implemented
- [ ] Authentication middleware enabled
- [ ] HTTPS enabled in production
- [ ] Error messages don't leak sensitive data
- [ ] Logs don't contain sensitive payment data
- [ ] Database backup strategy in place
- [ ] Payment logs encrypted and monitored

## 📝 Migration from Razorpay

If migrating from Razorpay:

1. Keep `lib/utils/razorpay.ts` for legacy support
2. Add PayU credentials to environment
3. Update UI to use `/api/payments/create-payu-order`
4. Test payment flow thoroughly
5. Update user documentation
6. Monitor payment success rates
7. Gradually migrate to PayU (if needed)

## 🎯 Next Steps

1. **Add Payment History**
   - Store payment records in database
   - Create payment history page

2. **Add Subscription Management**
   - Track subscription expiry
   - Send renewal reminders
   - Auto-renewal options

3. **Add Refund Support**
   - Handle refund requests
   - Update user status on refund

4. **Add Webhook Support**
   - Handle PayU webhooks
   - Update payment status automatically
   - Real-time payment notifications

5. **Multi-Currency Support**
   - Support other currencies
   - Dynamic pricing based on region
