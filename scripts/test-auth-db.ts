/**
 * Test script for database integration and authentication
 * Run with: npx tsx scripts/test-auth-db.ts
 */

import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/utils/password';
import { generateToken, verifyToken } from '../lib/utils/jwt';
import { createUser, findUserByEmail, findUserById, updateUserStatus } from '../lib/services/userService';

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';
const TEST_NAME = 'Test User';

async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection...');
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    const userCount = await prisma.user.count();
    console.log(`✅ Database accessible. Current users: ${userCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testPasswordHashing() {
  console.log('\n🔐 Testing Password Hashing...');
  try {
    const hashed = await hashPassword(TEST_PASSWORD);
    console.log('✅ Password hashed successfully');
    
    const isValid = await comparePassword(TEST_PASSWORD, hashed);
    if (isValid) {
      console.log('✅ Password verification works');
      return true;
    } else {
      console.error('❌ Password verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Password hashing failed:', error);
    return false;
  }
}

async function testJWTToken() {
  console.log('\n🎫 Testing JWT Token Generation...');
  try {
    const payload = { userId: 'test-id', email: 'test@example.com' };
    const token = generateToken(payload);
    console.log('✅ JWT token generated');
    
    const decoded = verifyToken(token);
    if (decoded.userId === payload.userId && decoded.email === payload.email) {
      console.log('✅ JWT token verification works');
      return true;
    } else {
      console.error('❌ JWT token verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ JWT token test failed:', error);
    return false;
  }
}

async function testUserCreation() {
  console.log('\n👤 Testing User Creation...');
  try {
    const user = await createUser({
      email: TEST_EMAIL,
      fullName: TEST_NAME,
      password: TEST_PASSWORD,
    });
    
    console.log('✅ User created successfully');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.fullName}`);
    console.log(`   VIP: ${user.isVip}`);
    console.log(`   Premium: ${user.isPremium}`);
    
    return user;
  } catch (error) {
    console.error('❌ User creation failed:', error);
    return null;
  }
}

async function testUserFindByEmail(userId: string) {
  console.log('\n🔍 Testing Find User by Email...');
  try {
    const user = await findUserByEmail(TEST_EMAIL);
    if (user && user.id === userId) {
      console.log('✅ User found by email');
      console.log(`   Email: ${user.email}`);
      console.log(`   Password hash exists: ${!!user.password}`);
      return true;
    } else {
      console.error('❌ User not found or ID mismatch');
      return false;
    }
  } catch (error) {
    console.error('❌ Find user by email failed:', error);
    return false;
  }
}

async function testUserFindById(userId: string) {
  console.log('\n🔍 Testing Find User by ID...');
  try {
    const user = await findUserById(userId);
    if (user && user.email === TEST_EMAIL) {
      console.log('✅ User found by ID');
      console.log(`   Email: ${user.email}`);
      console.log(`   Password excluded: ${!(user as any).password}`);
      return true;
    } else {
      console.error('❌ User not found or email mismatch');
      return false;
    }
  } catch (error) {
    console.error('❌ Find user by ID failed:', error);
    return false;
  }
}

async function testVIPStatusUpdate(userId: string) {
  console.log('\n👑 Testing VIP Status Update...');
  try {
    const updatedUser = await updateUserStatus(userId, {
      isVip: true,
      isPremium: true,
    });
    
    if (updatedUser.isVip && updatedUser.isPremium) {
      console.log('✅ VIP status updated successfully');
      console.log(`   VIP: ${updatedUser.isVip}`);
      console.log(`   Premium: ${updatedUser.isPremium}`);
      return true;
    } else {
      console.error('❌ VIP status update failed');
      return false;
    }
  } catch (error) {
    console.error('❌ VIP status update failed:', error);
    return false;
  }
}

async function testDuplicateEmail() {
  console.log('\n🚫 Testing Duplicate Email Prevention...');
  try {
    await createUser({
      email: TEST_EMAIL, // Same email
      fullName: 'Another User',
      password: 'password123',
    });
    console.error('❌ Duplicate email was allowed (should fail)');
    return false;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('✅ Duplicate email correctly rejected');
      return true;
    } else {
      console.error('❌ Unexpected error:', error);
      return false;
    }
  }
}

async function cleanup(userId: string) {
  console.log('\n🧹 Cleaning up test data...');
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    console.log('✅ Test user deleted');
  } catch (error) {
    console.error('⚠️  Cleanup failed (user may not exist):', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Database & Authentication Tests\n');
  console.log('=' .repeat(50));
  
  const results = {
    databaseConnection: false,
    passwordHashing: false,
    jwtToken: false,
    userCreation: false,
    findByEmail: false,
    findById: false,
    vipUpdate: false,
    duplicateEmail: false,
  };
  
  let testUserId: string | null = null;
  
  try {
    // Test 1: Database Connection
    results.databaseConnection = await testDatabaseConnection();
    if (!results.databaseConnection) {
      console.error('\n❌ Database connection failed. Stopping tests.');
      return;
    }
    
    // Test 2: Password Hashing
    results.passwordHashing = await testPasswordHashing();
    
    // Test 3: JWT Token
    results.jwtToken = await testJWTToken();
    
    // Test 4: User Creation
    const user = await testUserCreation();
    results.userCreation = !!user;
    if (user) {
      testUserId = user.id;
      
      // Test 5: Find by Email
      results.findByEmail = await testUserFindByEmail(testUserId);
      
      // Test 6: Find by ID
      results.findById = await testUserFindById(testUserId);
      
      // Test 7: VIP Status Update
      results.vipUpdate = await testVIPStatusUpdate(testUserId);
    }
    
    // Test 8: Duplicate Email Prevention
    results.duplicateEmail = await testDuplicateEmail();
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  } finally {
    // Cleanup
    if (testUserId) {
      await cleanup(testUserId);
    }
    
    // Disconnect
    await prisma.$disconnect();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed');
      process.exit(1);
    }
  }
}

// Run tests
runAllTests().catch(console.error);

