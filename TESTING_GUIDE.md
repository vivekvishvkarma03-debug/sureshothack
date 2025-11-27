# 🧪 Testing Guide - Database & Authentication

## Quick Start

### Option 1: Automated API Tests (Recommended)

1. **Start your dev server** (in one terminal):
   ```bash
   npm run dev
   ```

2. **Run API tests** (in another terminal):
   ```bash
   ./scripts/test-api.sh
   ```

   **OR** if you don't have `jq` installed:
   ```bash
   bash scripts/test-api.sh
   ```

### Option 2: TypeScript Test Script

1. **Run the test script**:
   ```bash
   npm run test:auth-db
   ```

   This will:
   - Test database connection
   - Test password hashing
   - Test JWT token generation
   - Test user creation
   - Test user lookup
   - Test VIP status updates
   - Clean up test data

## Manual Testing Steps

### 1. Test Database Connection

```bash
npm run db:studio
```

Open `http://localhost:5555` and verify you can see the database.

### 2. Test User Signup

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "fullName": "Test User",
    "isPremium": false,
    "isVip": false
  }
}
```

### 3. Test User Login

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "fullName": "Test User",
    "isPremium": false,
    "isVip": false
  }
}
```

### 4. Test Protected Route

```bash
# Replace YOUR_TOKEN with the token from signup/login
curl -X GET http://localhost:3000/api/user/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "fullName": "Test User",
    "isPremium": false,
    "isVip": false
  }
}
```

### 5. Test VIP Status Update

```bash
curl -X PUT http://localhost:3000/api/user/vip \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isVip": true,
    "isPremium": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User status updated successfully",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "fullName": "Test User",
    "isPremium": true,
    "isVip": true
  }
}
```

### 6. Verify in Database

```bash
npm run db:studio
```

Check that:
- ✅ User exists in database
- ✅ Password is hashed (not plain text)
- ✅ VIP/Premium status is updated

## Test Checklist

### Database Integration
- [ ] Database connection works
- [ ] User can be created in database
- [ ] User can be retrieved from database
- [ ] Password is stored as hash (not plain text)
- [ ] VIP status updates persist in database
- [ ] Duplicate emails are prevented

### Authentication
- [ ] User signup works
- [ ] User login works
- [ ] JWT token is generated
- [ ] JWT token is valid
- [ ] Protected routes require authentication
- [ ] Invalid tokens are rejected
- [ ] Logout works

### Payment Flow
- [ ] Payment order creation works
- [ ] Payment verification requires auth
- [ ] VIP status updates after payment
- [ ] VIP status persists after reload

## Common Issues

### Database Connection Failed
- Check `.env` file has correct `DATABASE_URL`
- Verify Supabase database is running
- Check network/firewall settings

### JWT_SECRET Error
- Make sure `.env` has `JWT_SECRET` set
- Restart dev server after adding `JWT_SECRET`

### User Not Found After Creation
- Check database connection
- Verify Prisma Client is generated (`npm run db:generate`)
- Check Prisma Studio to see if user exists

### Token Invalid
- Check token is being sent in `Authorization: Bearer TOKEN` header
- Verify `JWT_SECRET` matches between generation and verification
- Check token hasn't expired

## Performance Testing

### Test Multiple Users
```bash
# Create 10 test users
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"test$i@example.com\",
      \"fullName\": \"Test User $i\",
      \"password\": \"password123\"
    }"
done
```

### Test Concurrent Requests
Use a tool like `ab` (Apache Bench) or `wrk`:
```bash
ab -n 100 -c 10 http://localhost:3000/api/health
```

## Next Steps

After testing:
1. ✅ Verify all tests pass
2. ✅ Check database in Prisma Studio
3. ✅ Test payment flow end-to-end
4. ✅ Test frontend integration
5. ✅ Ready for production!

