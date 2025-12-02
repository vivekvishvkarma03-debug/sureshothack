# Environment Variables Setup

## ⚠️ IMPORTANT: Create `.env` file in the root directory

Copy this template and replace `[YOUR-PASSWORD]` with your actual Supabase database password:

```env
# ============================================
# DATABASE (Supabase)
# ============================================
# Connection pooling URL (for queries)
DATABASE_URL="postgresql://postgres.ixqtlrtuvobrarisuljt:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection URL (for migrations)
DIRECT_URL="postgresql://postgres.ixqtlrtuvobrarisuljt:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

# ============================================
# JWT AUTHENTICATION
# ============================================
# REQUIRED: Change this to a strong random string in production!
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# ============================================
# RAZORPAY PAYMENT GATEWAY
# ============================================
# Razorpay Live Credentials
RAZORPAY_KEY_ID="rzp_live_RlF6Zqdn6dWRLM"
RAZORPAY_KEY_SECRET="VAUfPGHigKSR4sRL4b7KtesR"

# Public Razorpay Key (for frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_RlF6Zqdn6dWRLM"

# ============================================
# NEXT.JS
# ============================================
NEXT_PUBLIC_API_URL=""
```

## 🔐 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Change JWT_SECRET** - Use a strong random string in production
3. **Keep credentials secret** - Don't share these values publicly
4. **Use environment variables** - Set these in your deployment platform (Vercel, etc.)

## 📋 Setup Steps

1. **Create `.env` file** in the root directory
2. **Copy the template above** and replace `[YOUR-PASSWORD]` with your Supabase password
3. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```
4. **Push schema to database**:
   ```bash
   npm run db:push
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

## 🚀 For Production Deployment

When deploying to Vercel or other platforms:

1. Add all environment variables in your platform's dashboard
2. Make sure `JWT_SECRET` is a strong random string
3. Use the same database URLs
4. Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set for frontend

## ✅ Verification

After setup, verify:
- ✅ Database connection works (`npm run db:studio`)
- ✅ User signup/login works
- ✅ Payment gateway loads (check browser console)
- ✅ JWT tokens are generated correctly

