# Razorpay Payment Debug Guide

## Common Issues & Solutions

### Issue: "Start Now" button not opening Razorpay

#### 1. Check Browser Console
Open browser DevTools (F12) and check for errors:
- Look for "Razorpay script loaded" message
- Check for any JavaScript errors
- Verify network requests to `/api/payments/create-order`

#### 2. Check Environment Variables
Make sure `.env` has:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_RlF6Zqdn6dWRLM"
RAZORPAY_KEY_ID="rzp_live_RlF6Zqdn6dWRLM"
RAZORPAY_KEY_SECRET="VAUfPGHigKSR4sRL4b7KtesR"
```

**Important:** `NEXT_PUBLIC_RAZORPAY_KEY_ID` must be set for frontend!

#### 3. Restart Dev Server
After changing `.env`, restart:
```bash
npm run dev
```

#### 4. Check Razorpay Script Loading
The script loads with `strategy="afterInteractive"` which should load it quickly.

Check in console:
```javascript
typeof window.Razorpay !== 'undefined' // Should be true
```

#### 5. Test Payment Order Creation
```bash
curl -X POST http://localhost:3000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 110000, "currency": "INR"}'
```

Should return:
```json
{
  "success": true,
  "order": {
    "id": "order_xxx",
    "amount": 110000,
    "currency": "INR"
  }
}
```

#### 6. Check Network Tab
- Open DevTools → Network tab
- Click "Start Now" button
- Look for:
  - `/api/payments/create-order` request
  - Check if it returns 200 OK
  - Check response data

#### 7. Common Errors

**Error: "Payment gateway is loading"**
- Solution: Wait a few seconds and try again
- The script might still be loading

**Error: "Razorpay key is not configured"**
- Solution: Check `.env` has `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- Restart dev server

**Error: "Failed to create order"**
- Solution: Check backend logs
- Verify Razorpay credentials are correct
- Check if user is authenticated

**Error: Razorpay modal doesn't open**
- Solution: Check browser console for errors
- Verify Razorpay script loaded
- Check if popup blocker is enabled

## Debug Steps

1. **Open Browser Console** (F12)
2. **Click "Start Now" button**
3. **Check console logs:**
   - Should see: "Start Now button clicked"
   - Should see: "Razorpay loaded: true"
   - Should see: "Creating payment order..."
   - Should see: "Order created: {...}"
   - Should see: "Opening Razorpay checkout..."

4. **If errors appear:**
   - Copy the error message
   - Check which step failed
   - Follow the solution above

## Test Payment Flow

1. **Sign up / Login**
2. **Click "Start Now"**
3. **Should see Razorpay checkout modal**
4. **Use test card:**
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - Name: Any name
5. **Complete payment**
6. **Should see success message**
7. **Check user VIP status updated**

## Still Not Working?

1. Clear browser cache
2. Try incognito/private mode
3. Check if ad blocker is interfering
4. Verify Razorpay account is active
5. Check Razorpay dashboard for any issues

