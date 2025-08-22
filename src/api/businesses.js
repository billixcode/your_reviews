// =====================================================
// BUSINESSES API - CRUD Operations
// Handles business profile management and team members
// =====================================================

import { 
  collection,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import BaseCRUD, { validateRequired, validateEmail, APIError, formatResponse, formatError } from './base.js';

class BusinessesAPI extends BaseCRUD {
  constructor() {
    super('businesses');
  }

  // =====================================================
  // BUSINESS-SPECIFIC CRUD OPERATIONS
  // =====================================================

  // Create new business
  async createBusiness(businessData, userId) {
    try {
      validateRequired(businessData, ['name', 'userId']);

      if (businessData.userId !== userId) {
        throw new APIError('User can only create businesses for themselves', 'PERMISSION_DENIED', 403);
      }

      const businessDoc = {
        userId: userId,
        name: businessData.name.trim(),
        description: businessData.description?.trim() || '',
        category: businessData.category || '',
        industry: businessData.industry || '',
        
        // Contact information
        address: businessData.address?.trim() || '',
        city: businessData.city?.trim() || '',
        state: businessData.state?.trim() || '',
        country: businessData.country?.trim() || '',
        postalCode: businessData.postalCode?.trim() || '',
        phone: businessData.phone?.trim() || '',
        website: businessData.website?.trim() || '',
        email: businessData.email?.trim() || '',

        // Geographic data
        location: {
          latitude: businessData.latitude || 0,
          longitude: businessData.longitude || 0
        },

        // Platform IDs
        platformIds: {
          google: businessData.googleId || '',
          yelp: businessData.yelpId || '',
          facebook: businessData.facebookId || ''
        },

        // Business hours (default 9-5 weekdays)
        businessHours: businessData.businessHours || {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '10:00', close: '15:00', closed: false },
          sunday: { open: '10:00', close: '15:00', closed: true }
        },

        specialties: businessData.specialties || [],
        brandVoice: businessData.brandVoice || 'professional',
        
        isActive: true,
        verificationStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Validate email if provided
      if (businessDoc.email) {
        validateEmail(businessDoc.email);
      }

      return await this.create(businessDoc);
    } catch (error) {
      throw error;
    }
  }

  // Get businesses by user
  async getBusinessesByUser(userId, options = {}) {
    try {
      const filters = [
        { field: 'userId', operator: '==', value: userId },
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

  // Update business profile
  async updateBusiness(businessId, businessData, userId) {
    try {
      // Verify ownership
      const business = await this.getById(businessId);
      if (business.userId !== userId) {
        throw new APIError('Permission denied', 'PERMISSION_DENIED', 403);
      }

      const allowedFields = [
        'name', 'description', 'category', 'industry',
        'address', 'city', 'state', 'country', 'postalCode',
        'phone', 'website', 'email', 'location', 'platformIds',
        'businessHours', 'specialties', 'brandVoice'
      ];

      const updateData = {};
      allowedFields.forEach(field => {
        if (businessData[field] !== undefined) {
          updateData[field] = businessData[field];
        }
      });

      // Validate email if provided
      if (updateData.email) {
        validateEmail(updateData.email);
      }

      return await this.update(businessId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Verify business
  async verifyBusiness(businessId, verificationData = {}) {
    try {
      return await this.update(businessId, {
        verificationStatus: 'verified',
        verifiedAt: serverTimestamp(),
        ...verificationData
      });
    } catch (error) {
      throw error;
    }
  }

  // Search businesses
  async searchBusinesses(searchTerm, options = {}) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new APIError('Search term must be at least 2 characters', 'VALIDATION_ERROR', 400);
      }

      const term = searchTerm.toLowerCase().trim();
      
      const filters = [
        { field: 'isActive', operator: '==', value: true }
      ];

      if (options.category) {
        filters.push({ field: 'category', operator: '==', value: options.category });
      }

      if (options.verificationStatus) {
        filters.push({ field: 'verificationStatus', operator: '==', value: options.verificationStatus });
      }

      const results = await this.getWhere(filters, {
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: options.limit || 50
      });

      // Filter results client-side for name/description matching
      const filteredDocs = results.documents.filter(business => {
        const name = business.name.toLowerCase();
        const description = business.description.toLowerCase();
        const city = business.city.toLowerCase();
        
        return name.includes(term) || 
               description.includes(term) ||
               city.includes(term) ||
               business.specialties.some(specialty => 
                 specialty.toLowerCase().includes(term)
               );
      });

      return {
        documents: filteredDocs,
        hasMore: false
      };
    } catch (error) {
      throw error;
    }
  }

  // Get business statistics
  async getBusinessStats(userId) {
    try {
      const userBusinesses = await this.getBusinessesByUser(userId);
      
      const total = userBusinesses.documents.length;
      const verified = userBusinesses.documents.filter(b => b.verificationStatus === 'verified').length;
      const pending = userBusinesses.documents.filter(b => b.verificationStatus === 'pending').length;

      return {
        total,
        verified,
        pending,
        verificationRate: total > 0 ? (verified / total) * 100 : 0
      };
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // TEAM MEMBERS SUBCOLLECTION
  // =====================================================

  // Add team member
  async addTeamMember(businessId, memberData, currentUserId) {
    try {
      // Verify business ownership
      const business = await this.getById(businessId);
      if (business.userId !== currentUserId) {
        throw new APIError('Only business owner can add team members', 'PERMISSION_DENIED', 403);
      }

      validateRequired(memberData, ['userId', 'role']);
      
      // Check if user is already a team member
      const existingMember = await this.getTeamMember(businessId, memberData.userId);
      if (existingMember) {
        throw new APIError('User is already a team member', 'ALREADY_EXISTS', 409);
      }

      const memberDoc = {
        userId: memberData.userId,
        role: memberData.role, // owner, admin, member
        permissions: memberData.permissions || {
          canRespond: true,
          canViewAnalytics: false,
          canManageSettings: false,
          canInviteMembers: false
        },
        status: 'active',
        invitedBy: currentUserId,
        invitationToken: memberData.invitationToken || null,
        invitationExpires: memberData.invitationExpires || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const teamRef = collection(db, 'businesses', businessId, 'team_members');
      const docRef = await addDoc(teamRef, memberDoc);
      
      return { id: docRef.id, ...memberDoc };
    } catch (error) {
      throw error;
    }
  }

  // Get team member
  async getTeamMember(businessId, userId) {
    try {
      const teamRef = collection(db, 'businesses', businessId, 'team_members');
      const q = query(teamRef, where('userId', '==', userId));
      
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

  // Get all team members
  async getTeamMembers(businessId, options = {}) {
    try {
      const teamRef = collection(db, 'businesses', businessId, 'team_members');
      let q = query(teamRef, orderBy('createdAt', 'desc'));

      if (options.status) {
        q = query(teamRef, where('status', '==', options.status), orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const members = [];
      
      querySnapshot.forEach(doc => {
        members.push({ id: doc.id, ...doc.data() });
      });

      return members;
    } catch (error) {
      throw error;
    }
  }

  // Update team member
  async updateTeamMember(businessId, memberId, memberData, currentUserId) {
    try {
      // Verify business ownership
      const business = await this.getById(businessId);
      if (business.userId !== currentUserId) {
        throw new APIError('Only business owner can update team members', 'PERMISSION_DENIED', 403);
      }

      const allowedFields = ['role', 'permissions', 'status'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (memberData[field] !== undefined) {
          updateData[field] = memberData[field];
        }
      });

      updateData.updatedAt = serverTimestamp();

      const memberRef = doc(db, 'businesses', businessId, 'team_members', memberId);
      await updateDoc(memberRef, updateData);

      return { id: memberId, ...updateData };
    } catch (error) {
      throw error;
    }
  }

  // Remove team member
  async removeTeamMember(businessId, memberId, currentUserId) {
    try {
      // Verify business ownership
      const business = await this.getById(businessId);
      if (business.userId !== currentUserId) {
        throw new APIError('Only business owner can remove team members', 'PERMISSION_DENIED', 403);
      }

      const memberRef = doc(db, 'businesses', businessId, 'team_members', memberId);
      await deleteDoc(memberRef);

      return { success: true, memberId };
    } catch (error) {
      throw error;
    }
  }

  // Check if user has access to business
  async hasBusinessAccess(businessId, userId) {
    try {
      const business = await this.getById(businessId);
      
      // Owner has access
      if (business.userId === userId) {
        return { hasAccess: true, role: 'owner', permissions: 'all' };
      }

      // Check team membership
      const teamMember = await this.getTeamMember(businessId, userId);
      if (teamMember && teamMember.status === 'active') {
        return { 
          hasAccess: true, 
          role: teamMember.role, 
          permissions: teamMember.permissions 
        };
      }

      return { hasAccess: false };
    } catch (error) {
      throw error;
    }
  }
}

// =====================================================
// API WRAPPER FUNCTIONS
// =====================================================

const businessesAPI = new BusinessesAPI();

// Business management functions
export const createBusiness = async (businessData, userId) => {
  try {
    const result = await businessesAPI.createBusiness(businessData, userId);
    return formatResponse(result, 'Business created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getBusinessById = async (businessId) => {
  try {
    const result = await businessesAPI.getById(businessId);
    return formatResponse(result, 'Business retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getBusinessesByUser = async (userId, options) => {
  try {
    const result = await businessesAPI.getBusinessesByUser(userId, options);
    return formatResponse(result, 'User businesses retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateBusiness = async (businessId, businessData, userId) => {
  try {
    const result = await businessesAPI.updateBusiness(businessId, businessData, userId);
    return formatResponse(result, 'Business updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const deleteBusiness = async (businessId, userId) => {
  try {
    // Verify ownership before deletion
    const business = await businessesAPI.getById(businessId);
    if (business.userId !== userId) {
      throw new APIError('Permission denied', 'PERMISSION_DENIED', 403);
    }
    
    const result = await businessesAPI.softDelete(businessId);
    return formatResponse(result, 'Business deleted successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const verifyBusiness = async (businessId, verificationData) => {
  try {
    const result = await businessesAPI.verifyBusiness(businessId, verificationData);
    return formatResponse(result, 'Business verified successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const searchBusinesses = async (searchTerm, options) => {
  try {
    const result = await businessesAPI.searchBusinesses(searchTerm, options);
    return formatResponse(result, 'Business search completed successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getBusinessStats = async (userId) => {
  try {
    const result = await businessesAPI.getBusinessStats(userId);
    return formatResponse(result, 'Business statistics retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

// Team management functions
export const addTeamMember = async (businessId, memberData, currentUserId) => {
  try {
    const result = await businessesAPI.addTeamMember(businessId, memberData, currentUserId);
    return formatResponse(result, 'Team member added successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getTeamMembers = async (businessId, options) => {
  try {
    const result = await businessesAPI.getTeamMembers(businessId, options);
    return formatResponse(result, 'Team members retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateTeamMember = async (businessId, memberId, memberData, currentUserId) => {
  try {
    const result = await businessesAPI.updateTeamMember(businessId, memberId, memberData, currentUserId);
    return formatResponse(result, 'Team member updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const removeTeamMember = async (businessId, memberId, currentUserId) => {
  try {
    const result = await businessesAPI.removeTeamMember(businessId, memberId, currentUserId);
    return formatResponse(result, 'Team member removed successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const checkBusinessAccess = async (businessId, userId) => {
  try {
    const result = await businessesAPI.hasBusinessAccess(businessId, userId);
    return formatResponse(result, 'Business access checked successfully');
  } catch (error) {
    return formatError(error);
  }
};

export default businessesAPI;
