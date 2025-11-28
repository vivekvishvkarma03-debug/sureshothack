/**
 * Script to make a user VIP by email
 * Usage: npx tsx scripts/make-user-vip.ts <email>
 * Example: npx tsx scripts/make-user-vip.ts user@example.com
 */

import { prisma } from '../lib/prisma';

async function makeUserVip(email: string) {
  try {
    console.log(`\n🔍 Looking for user with email: ${email}`);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVip: true,
        isPremium: true,
        vipExpiresAt: true,
      },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }

    console.log(`\n📋 Current user status:`);
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   VIP: ${user.isVip}`);
    console.log(`   Premium: ${user.isPremium}`);
    console.log(`   VIP Expires At: ${user.vipExpiresAt || 'Not set'}`);

    // Calculate VIP expiry date (30 days from now)
    const vipExpiresAt = new Date();
    vipExpiresAt.setDate(vipExpiresAt.getDate() + 30);

    // Update user to VIP
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVip: true,
        isPremium: true,
        vipExpiresAt: vipExpiresAt,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVip: true,
        isPremium: true,
        vipExpiresAt: true,
      },
    });

    console.log(`\n✅ User successfully updated to VIP!`);
    console.log(`\n📋 Updated user status:`);
    console.log(`   Name: ${updatedUser.fullName}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   VIP: ${updatedUser.isVip}`);
    console.log(`   Premium: ${updatedUser.isPremium}`);
    console.log(`   VIP Expires At: ${updatedUser.vipExpiresAt?.toLocaleString()}`);
    console.log(`\n🎉 Done! User can now play the game.\n`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating user to VIP:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address is required');
  console.log('\nUsage: npx tsx scripts/make-user-vip.ts <email>');
  console.log('Example: npx tsx scripts/make-user-vip.ts user@example.com\n');
  process.exit(1);
}

// Validate email format (basic check)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error(`❌ Error: "${email}" is not a valid email address`);
  process.exit(1);
}

// Run the script
makeUserVip(email).catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

