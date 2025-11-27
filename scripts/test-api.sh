#!/bin/bash

# API Testing Script for Authentication & Database Integration
# Make sure your dev server is running: npm run dev

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="testpass123"
TEST_NAME="Test User"

echo "🚀 Starting API Tests..."
echo "=========================================="

# Test 1: Health Check
echo -e "\n${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s "$BASE_URL/api/health")
if echo "$HEALTH" | grep -q "success"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH"
fi

# Test 2: User Signup
echo -e "\n${YELLOW}Test 2: User Signup${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"fullName\": \"$TEST_NAME\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "$SIGNUP_RESPONSE" | jq '.'

if echo "$SIGNUP_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Signup successful${NC}"
    TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.token')
    USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.user.id')
    echo "Token: ${TOKEN:0:50}..."
    echo "User ID: $USER_ID"
else
    echo -e "${RED}❌ Signup failed${NC}"
    exit 1
fi

# Test 3: Duplicate Signup (should fail)
echo -e "\n${YELLOW}Test 3: Duplicate Signup Prevention${NC}"
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"fullName\": \"Another User\",
    \"password\": \"password123\"
  }")

if echo "$DUPLICATE_RESPONSE" | grep -q "already exists"; then
    echo -e "${GREEN}✅ Duplicate email correctly rejected${NC}"
else
    echo -e "${RED}❌ Duplicate email was allowed (should fail)${NC}"
    echo "$DUPLICATE_RESPONSE" | jq '.'
fi

# Test 4: Login
echo -e "\n${YELLOW}Test 4: User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "$LOGIN_RESPONSE" | jq '.'

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Login successful${NC}"
    LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
    LOGIN_USER=$(echo "$LOGIN_RESPONSE" | jq -r '.user')
    echo "Token: ${LOGIN_TOKEN:0:50}..."
    echo "User: $LOGIN_USER" | jq '.'
else
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi

# Test 5: Invalid Login (wrong password)
echo -e "\n${YELLOW}Test 5: Invalid Login (Wrong Password)${NC}"
INVALID_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"wrongpassword\"
  }")

if echo "$INVALID_LOGIN" | grep -q "Invalid email or password"; then
    echo -e "${GREEN}✅ Invalid password correctly rejected${NC}"
else
    echo -e "${RED}❌ Invalid password was accepted (should fail)${NC}"
    echo "$INVALID_LOGIN" | jq '.'
fi

# Test 6: Get Current User (Protected Route)
echo -e "\n${YELLOW}Test 6: Get Current User (Protected Route)${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$ME_RESPONSE" | jq '.'

if echo "$ME_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Protected route access successful${NC}"
    ME_USER=$(echo "$ME_RESPONSE" | jq -r '.user')
    echo "User data: $ME_USER" | jq '.'
else
    echo -e "${RED}❌ Protected route access failed${NC}"
fi

# Test 7: Unauthorized Access (No Token)
echo -e "\n${YELLOW}Test 7: Unauthorized Access (No Token)${NC}"
UNAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/me" \
  -H "Content-Type: application/json")

if echo "$UNAUTH_RESPONSE" | grep -q "Unauthorized"; then
    echo -e "${GREEN}✅ Unauthorized access correctly rejected${NC}"
else
    echo -e "${RED}❌ Unauthorized access was allowed (should fail)${NC}"
    echo "$UNAUTH_RESPONSE" | jq '.'
fi

# Test 8: Update VIP Status
echo -e "\n${YELLOW}Test 8: Update VIP Status${NC}"
VIP_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/user/vip" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"isVip\": true,
    \"isPremium\": true
  }")

echo "$VIP_RESPONSE" | jq '.'

if echo "$VIP_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ VIP status updated successfully${NC}"
    VIP_USER=$(echo "$VIP_RESPONSE" | jq -r '.user')
    IS_VIP=$(echo "$VIP_RESPONSE" | jq -r '.user.isVip')
    IS_PREMIUM=$(echo "$VIP_RESPONSE" | jq -r '.user.isPremium')
    echo "VIP: $IS_VIP, Premium: $IS_PREMIUM"
    
    if [ "$IS_VIP" = "true" ] && [ "$IS_PREMIUM" = "true" ]; then
        echo -e "${GREEN}✅ VIP and Premium status correctly set${NC}"
    else
        echo -e "${RED}❌ VIP/Premium status not set correctly${NC}"
    fi
else
    echo -e "${RED}❌ VIP status update failed${NC}"
fi

# Test 9: Verify VIP Status Persists
echo -e "\n${YELLOW}Test 9: Verify VIP Status Persists${NC}"
ME_AGAIN=$(curl -s -X GET "$BASE_URL/api/user/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

PERSISTED_VIP=$(echo "$ME_AGAIN" | jq -r '.user.isVip')
PERSISTED_PREMIUM=$(echo "$ME_AGAIN" | jq -r '.user.isPremium')

if [ "$PERSISTED_VIP" = "true" ] && [ "$PERSISTED_PREMIUM" = "true" ]; then
    echo -e "${GREEN}✅ VIP status persisted in database${NC}"
else
    echo -e "${RED}❌ VIP status not persisted${NC}"
fi

# Test 10: Logout
echo -e "\n${YELLOW}Test 10: Logout${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$LOGOUT_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Logout successful${NC}"
else
    echo -e "${YELLOW}⚠️  Logout response: $LOGOUT_RESPONSE${NC}"
fi

echo -e "\n=========================================="
echo -e "${GREEN}✅ All API tests completed!${NC}"
echo ""
echo "Test User Created:"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo ""
echo "You can manually delete this user from the database if needed."

