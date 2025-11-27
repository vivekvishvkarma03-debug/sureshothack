import { User, CreateUserInput } from '@/lib/types/user';
import { hashPassword, comparePassword } from '@/lib/utils/password';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Get all users (for debugging - remove in production)
 */
export const getAllUsers = async (): Promise<Omit<User, 'password'>[]> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      isPremium: true,
      isVip: true,
      vipExpiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users.map((user) => ({
    ...user,
    createdAt: user.createdAt,
  }));
};

/**
 * Get user count (for debugging)
 */
export const getUserCount = async (): Promise<number> => {
  return prisma.user.count();
};

/**
 * Create a new user with proper VIP/Premium initialization
 */
export const createUser = async (input: CreateUserInput): Promise<Omit<User, 'password'>> => {
  // Normalize email for comparison
  const normalizedEmail = input.email.toLowerCase().trim();

  // Hash password
  const hashedPassword = await hashPassword(input.password);

  try {
    // Create user in database (Prisma will handle unique constraint)
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: input.fullName.trim(),
        password: hashedPassword,
        isPremium: false, // Default to false
        isVip: false,     // Default to false
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isPremium: true,
        isVip: true,
        vipExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newUser;
  } catch (error) {
    // Handle unique constraint violation (email already exists)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('User with this email already exists');
      }
    }
    throw error;
  }
};

/**
 * Find user by email (case-insensitive)
 * Returns user WITH password for verification purposes
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    password: user.password,
    isPremium: user.isPremium,
    isVip: user.isVip,
    vipExpiresAt: user.vipExpiresAt,
    createdAt: user.createdAt,
  };
};

/**
 * Find user by ID (without password)
 */
export const findUserById = async (id: string): Promise<Omit<User, 'password'> | null> => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      isPremium: true,
      isVip: true,
      vipExpiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  return user;
};

/**
 * Verify user password
 */
export const verifyUserPassword = async (
  user: User,
  password: string
): Promise<boolean> => {
  return comparePassword(password, user.password);
};

/**
 * Update user VIP status
 */
export const updateUserVipStatus = async (
  userId: string,
  isVip: boolean
): Promise<Omit<User, 'password'>> => {
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isVip,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isPremium: true,
        isVip: true,
        vipExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('User not found');
      }
    }
    throw error;
  }
};

/**
 * Update user Premium status
 */
export const updateUserPremiumStatus = async (
  userId: string,
  isPremium: boolean
): Promise<Omit<User, 'password'>> => {
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isPremium,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isPremium: true,
        isVip: true,
        vipExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('User not found');
      }
    }
    throw error;
  }
};

/**
 * Update both VIP and Premium status
 */
export const updateUserStatus = async (
  userId: string,
  updates: { isVip?: boolean; isPremium?: boolean; vipExpiresAt?: Date | null }
): Promise<Omit<User, 'password'>> => {
  try {
    const updateData: { isVip?: boolean; isPremium?: boolean; vipExpiresAt?: Date | null } = {};
    
    if (updates.isVip !== undefined) {
      updateData.isVip = updates.isVip;
    }
    if (updates.isPremium !== undefined) {
      updateData.isPremium = updates.isPremium;
    }
    if (updates.vipExpiresAt !== undefined) {
      updateData.vipExpiresAt = updates.vipExpiresAt;
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        isPremium: true,
        isVip: true,
        vipExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('User not found');
      }
    }
    throw error;
  }
};

/**
 * Check if user's VIP is expired and update status if needed
 */
export const checkAndUpdateVipExpiry = async (
  userId: string
): Promise<Omit<User, 'password'> | null> => {
  const user = await findUserById(userId);
  
  if (!user) {
    return null;
  }

  // If user has VIP but no expiry date or expired, revoke VIP
  if (user.isVip && (!user.vipExpiresAt || new Date() > new Date(user.vipExpiresAt))) {
    return await updateUserStatus(userId, {
      isVip: false,
      isPremium: false,
      vipExpiresAt: null,
    });
  }

  return user;
};

/**
 * Revoke expired VIP subscriptions for all users
 * @returns Number of users whose VIP was revoked
 */
export const revokeExpiredVips = async (): Promise<number> => {
  const now = new Date();
  
  const result = await prisma.user.updateMany({
    where: {
      isVip: true,
      vipExpiresAt: {
        lte: now, // Less than or equal to now (expired)
      },
    },
    data: {
      isVip: false,
      isPremium: false,
      vipExpiresAt: null,
    },
  });

  return result.count;
};

