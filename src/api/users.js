// =====================================================
// USERS API - CRUD Operations
// Handles user profile management and authentication data
// =====================================================

import { 
  collection,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import BaseCRUD, { validateRequired, validateEmail, APIError, formatResponse, formatError } from './base.js';

class UsersAPI extends BaseCRUD {
  constructor() {
    super('users');
  }

  // =====================================================
  // USER-SPECIFIC CRUD OPERATIONS
  // =====================================================

  // Create new user
  async createUser(userData, userId) {
    try {
      // Validate required fields
      validateRequired(userData, ['email', 'firstName']);
      validateEmail(userData.email);

      // Check if email already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new APIError('Email already exists', 'EMAIL_EXISTS', 409);
      }

      const userDoc = {
        email: userData.email.toLowerCase().trim(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName?.trim() || '',
        phone: userData.phone?.trim() || '',
        avatarUrl: userData.avatarUrl || '',
        emailVerified: userData.emailVerified || false,
        isActive: true,
        lastLoginAt: serverTimestamp(),
        onboardingCompleted: false,
        onboardingStep: 1,
        timezone: userData.timezone || 'America/New_York',
        language: userData.language || 'en',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      return await this.create(userDoc, userId);
    } catch (error) {
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      validateEmail(email);
      
      const q = query(
        this.collectionRef,
        where('email', '==', email.toLowerCase().trim()),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      const allowedFields = [
        'firstName', 'lastName', 'phone', 'avatarUrl', 
        'timezone', 'language', 'onboardingCompleted', 'onboardingStep'
      ];

      const updateData = {};
      allowedFields.forEach(field => {
        if (profileData[field] !== undefined) {
          updateData[field] = profileData[field];
        }
      });

      // Validate email if provided
      if (profileData.email) {
        validateEmail(profileData.email);
        // Check if email is already taken by another user
        const existingUser = await this.getUserByEmail(profileData.email);
        if (existingUser && existingUser.id !== userId) {
          throw new APIError('Email already exists', 'EMAIL_EXISTS', 409);
        }
        updateData.email = profileData.email.toLowerCase().trim();
      }

      return await this.update(userId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Update last login timestamp
  async updateLastLogin(userId) {
    try {
      return await this.update(userId, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  // Verify email
  async verifyEmail(userId) {
    try {
      return await this.update(userId, {
        emailVerified: true
      });
    } catch (error) {
      throw error;
    }
  }

  // Complete onboarding
  async completeOnboarding(userId, onboardingData = {}) {
    try {
      const updateData = {
        onboardingCompleted: true,
        onboardingStep: 0,
        ...onboardingData
      };

      return await this.update(userId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Deactivate user (soft delete)
  async deactivateUser(userId) {
    try {
      return await this.update(userId, {
        isActive: false,
        deactivatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  // Reactivate user
  async reactivateUser(userId) {
    try {
      return await this.update(userId, {
        isActive: true,
        reactivatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  // Get active users (admin function)
  async getActiveUsers(options = {}) {
    try {
      const filters = [
        { field: 'isActive', operator: '==', value: true }
      ];

      return await this.getWhere(filters, {
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: options.limit || 25,
        startAfterDoc: options.startAfter || null
      });
    } catch (error) {
      throw error;
    }
  }

  // Search users by name or email (admin function)
  async searchUsers(searchTerm, options = {}) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new APIError('Search term must be at least 2 characters', 'VALIDATION_ERROR', 400);
      }

      const term = searchTerm.toLowerCase().trim();
      
      // Note: Firestore doesn't support full-text search natively
      // This is a simplified search - in production, consider using Algolia or similar
      const filters = [
        { field: 'isActive', operator: '==', value: true }
      ];

      const results = await this.getWhere(filters, {
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: options.limit || 50
      });

      // Filter results client-side for name/email matching
      const filteredDocs = results.documents.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        
        return fullName.includes(term) || 
               email.includes(term) ||
               user.firstName.toLowerCase().includes(term) ||
               user.lastName.toLowerCase().includes(term);
      });

      return {
        documents: filteredDocs,
        hasMore: false // Client-side filtering doesn't support pagination
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics (admin function)
  async getUserStats() {
    try {
      const activeUsers = await this.count([
        { field: 'isActive', operator: '==', value: true }
      ]);

      const verifiedUsers = await this.count([
        { field: 'isActive', operator: '==', value: true },
        { field: 'emailVerified', operator: '==', value: true }
      ]);

      const onboardedUsers = await this.count([
        { field: 'isActive', operator: '==', value: true },
        { field: 'onboardingCompleted', operator: '==', value: true }
      ]);

      return {
        totalActive: activeUsers,
        totalVerified: verifiedUsers,
        totalOnboarded: onboardedUsers,
        verificationRate: activeUsers > 0 ? (verifiedUsers / activeUsers) * 100 : 0,
        onboardingRate: activeUsers > 0 ? (onboardedUsers / activeUsers) * 100 : 0
      };
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // USER SESSIONS SUBCOLLECTION
  // =====================================================

  // Create user session
  async createSession(userId, sessionData) {
    try {
      validateRequired(sessionData, ['tokenHash', 'deviceInfo']);

      const sessionDoc = {
        tokenHash: sessionData.tokenHash,
        deviceInfo: sessionData.deviceInfo,
        ipAddress: sessionData.ipAddress || '',
        expiresAt: sessionData.expiresAt,
        isActive: true,
        createdAt: serverTimestamp()
      };

      const sessionRef = collection(db, 'users', userId, 'sessions');
      const docRef = await addDoc(sessionRef, sessionDoc);
      
      return { id: docRef.id, ...sessionDoc };
    } catch (error) {
      throw error;
    }
  }

  // Get user sessions
  async getUserSessions(userId, options = {}) {
    try {
      const sessionRef = collection(db, 'users', userId, 'sessions');
      const q = query(
        sessionRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];
      
      querySnapshot.forEach(doc => {
        sessions.push({ id: doc.id, ...doc.data() });
      });

      return sessions;
    } catch (error) {
      throw error;
    }
  }

  // Revoke user session
  async revokeSession(userId, sessionId) {
    try {
      const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        isActive: false,
        revokedAt: serverTimestamp()
      });

      return { success: true, sessionId };
    } catch (error) {
      throw error;
    }
  }

  // Revoke all user sessions
  async revokeAllSessions(userId) {
    try {
      const sessions = await this.getUserSessions(userId);
      const results = [];

      for (const session of sessions) {
        const result = await this.revokeSession(userId, session.id);
        results.push(result);
      }

      return results;
    } catch (error) {
      throw error;
    }
  }
}

// =====================================================
// API WRAPPER FUNCTIONS
// =====================================================

const usersAPI = new UsersAPI();

// User management functions
export const createUser = async (userData, userId) => {
  try {
    const result = await usersAPI.createUser(userData, userId);
    return formatResponse(result, 'User created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getUserById = async (userId) => {
  try {
    const result = await usersAPI.getById(userId);
    return formatResponse(result, 'User retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getUserByEmail = async (email) => {
  try {
    const result = await usersAPI.getUserByEmail(email);
    return formatResponse(result, 'User retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const result = await usersAPI.updateProfile(userId, profileData);
    return formatResponse(result, 'User profile updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateLastLogin = async (userId) => {
  try {
    const result = await usersAPI.updateLastLogin(userId);
    return formatResponse(result, 'Last login updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const verifyUserEmail = async (userId) => {
  try {
    const result = await usersAPI.verifyEmail(userId);
    return formatResponse(result, 'Email verified successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const completeUserOnboarding = async (userId, onboardingData) => {
  try {
    const result = await usersAPI.completeOnboarding(userId, onboardingData);
    return formatResponse(result, 'Onboarding completed successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const deactivateUser = async (userId) => {
  try {
    const result = await usersAPI.deactivateUser(userId);
    return formatResponse(result, 'User deactivated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const reactivateUser = async (userId) => {
  try {
    const result = await usersAPI.reactivateUser(userId);
    return formatResponse(result, 'User reactivated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getActiveUsers = async (options) => {
  try {
    const result = await usersAPI.getActiveUsers(options);
    return formatResponse(result, 'Active users retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const searchUsers = async (searchTerm, options) => {
  try {
    const result = await usersAPI.searchUsers(searchTerm, options);
    return formatResponse(result, 'User search completed successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getUserStats = async () => {
  try {
    const result = await usersAPI.getUserStats();
    return formatResponse(result, 'User statistics retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

// Session management functions
export const createUserSession = async (userId, sessionData) => {
  try {
    const result = await usersAPI.createSession(userId, sessionData);
    return formatResponse(result, 'Session created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getUserSessions = async (userId, options) => {
  try {
    const result = await usersAPI.getUserSessions(userId, options);
    return formatResponse(result, 'Sessions retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const revokeUserSession = async (userId, sessionId) => {
  try {
    const result = await usersAPI.revokeSession(userId, sessionId);
    return formatResponse(result, 'Session revoked successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const revokeAllUserSessions = async (userId) => {
  try {
    const result = await usersAPI.revokeAllSessions(userId);
    return formatResponse(result, 'All sessions revoked successfully');
  } catch (error) {
    return formatError(error);
  }
};

export default usersAPI;
