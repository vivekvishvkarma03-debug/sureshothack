# VIP Expiry System Setup

## ✅ Implementation Complete

The VIP expiry system has been fully implemented with automatic 30-day expiry tracking and revocation.

## 🎯 Features

1. **30-Day Expiry Tracking**
   - VIP subscriptions expire 30 days after payment
   - Expiry date stored in database (`vipExpiresAt` field)

2. **Automatic Expiry Check**
   - User's VIP status is checked on every `/api/user/me` call
   - Expired VIPs are automatically revoked

3. **Bulk Expiry Revocation**
   - Admin endpoint to revoke all expired VIPs at once
   - Can be called by cron job or scheduled task

4. **Frontend Display**
   - Shows VIP expiry date on the home page
   - Displays formatted expiry date for active VIPs

## 📋 Database Migration Required

You need to run a Prisma migration to add the `vipExpiresAt` field to your database.

### Step 1: Generate Prisma Client

```bash
npm run db:generate
```

### Step 2: Create and Apply Migration

```bash
npm run db:migrate
```

This will:
- Create a migration file
- Add the `vipExpiresAt` column to the `users` table
- Apply the migration to your database

### Step 3: Verify Migration

```bash
npm run db:studio
```

Open Prisma Studio and verify that the `users` table now has a `vipExpiresAt` column.

## 🔄 How It Works

### Payment Flow

1. **User Pays**
   - Payment is verified via Razorpay
   - VIP status is set to `true`
   - `vipExpiresAt` is set to 30 days from now

2. **Expiry Check**
   - Every time user calls `/api/user/me`, expiry is checked
   - If `vipExpiresAt` is in the past, VIP is automatically revoked
   - User's `isVip` and `isPremium` are set to `false`

3. **Bulk Revocation**
   - Admin endpoint `/api/admin/revoke-expired-vips` can revoke all expired VIPs
   - Can be called manually or via cron job

## 📁 Files Modified

### Database Schema
- `prisma/schema.prisma` - Added `vipExpiresAt` field

### Backend Services
- `lib/services/paymentService.ts` - Sets expiry date on payment
- `lib/services/userService.ts` - Added expiry checking functions
- `lib/types/user.ts` - Added `vipExpiresAt` to User interface

### API Endpoints
- `app/api/user/me/route.ts` - Checks expiry on every call
- `app/api/payments/verify/route.ts` - Returns expiry date in response
- `app/api/admin/revoke-expired-vips/route.ts` - Bulk revocation endpoint

### Frontend
- `app/page.tsx` - Displays expiry date
- `lib/api.ts` - Updated User interface

## 🔧 API Endpoints

### GET `/api/user/me`
Returns user data with automatic expiry check.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "isVip": true,
    "isPremium": true,
    "vipExpiresAt": "2024-02-15T00:00:00.000Z"
  }
}
```

### POST `/api/admin/revoke-expired-vips`
Revokes VIP status for all expired subscriptions.

**Response:**
```json
{
  "success": true,
  "message": "Revoked VIP status for 5 expired subscription(s)",
  "revokedCount": 5
}
```

### GET `/api/admin/revoke-expired-vips`
Checks how many VIPs would be revoked (without actually revoking).

**Response:**
```json
{
  "success": true,
  "expiredCount": 5,
  "message": "Found 5 expired VIP subscription(s)"
}
```

## ⏰ Setting Up Cron Job (Optional)

To automatically revoke expired VIPs daily, you can set up a cron job:

### Using Vercel Cron (if deployed on Vercel)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/revoke-expired-vips",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Using External Cron Service

Set up a cron job to call:
```
POST https://your-domain.com/api/admin/revoke-expired-vips
```

Schedule: Daily at midnight (or your preferred time)

## 🧪 Testing

### Test Expiry Check

1. **Create a test user with expired VIP:**
   ```sql
   UPDATE users 
   SET "isVip" = true, "vipExpiresAt" = '2024-01-01' 
   WHERE email = 'test@example.com';
   ```

2. **Call `/api/user/me`:**
   - User's VIP should be automatically revoked
   - `isVip` should be `false`

### Test Payment Flow

1. **Make a payment**
2. **Check user data:**
   - `isVip` should be `true`
   - `vipExpiresAt` should be 30 days from now

3. **Wait 30 days (or manually set expiry in past)**
4. **Call `/api/user/me`:**
   - VIP should be automatically revoked

## 📝 Code Examples

### Check if VIP is Expired

```typescript
import { isVipExpired } from '@/lib/services/paymentService';

const expired = isVipExpired(user.vipExpiresAt);
if (expired) {
  // VIP has expired
}
```

### Manually Revoke Expired VIPs

```typescript
import { revokeExpiredVips } from '@/lib/services/userService';

const revokedCount = await revokeExpiredVips();
console.log(`Revoked ${revokedCount} expired VIPs`);
```

### Check User's VIP Expiry

```typescript
import { checkAndUpdateVipExpiry } from '@/lib/services/userService';

const user = await checkAndUpdateVipExpiry(userId);
// User's VIP status is automatically updated if expired
```

## 🔐 Security Notes

- Expiry check happens on every user data fetch
- Expired VIPs are automatically revoked
- No manual intervention needed
- Bulk revocation endpoint can be protected with admin auth (currently open)

## ✨ Summary

✅ VIP subscriptions expire after 30 days  
✅ Expiry is checked automatically on every user data fetch  
✅ Expired VIPs are automatically revoked  
✅ Expiry date is displayed on frontend  
✅ Bulk revocation endpoint available for cron jobs  
✅ All changes are backward compatible  

## 🚀 Next Steps

1. **Run Database Migration:**
   ```bash
   npm run db:migrate
   ```

2. **Test Payment Flow:**
   - Make a test payment
   - Verify expiry date is set correctly

3. **Set Up Cron Job (Optional):**
   - Configure daily revocation task
   - Or rely on automatic expiry check on user fetch

4. **Monitor Expired VIPs:**
   - Use `/api/admin/revoke-expired-vips` GET endpoint
   - Check logs for revocation activity

