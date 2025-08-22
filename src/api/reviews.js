// =====================================================
// REVIEWS API - CRUD Operations
// Handles review management, flagging, and analytics
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
  increment
} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import BaseCRUD, { validateRequired, APIError, formatResponse, formatError } from './base.js';

class ReviewsAPI extends BaseCRUD {
  constructor() {
    super('reviews');
  }

  // =====================================================
  // REVIEW-SPECIFIC CRUD OPERATIONS
  // =====================================================

  // Create new review (usually from platform sync)
  async createReview(reviewData) {
    try {
      validateRequired(reviewData, ['businessId', 'platform', 'platformReviewId', 'rating', 'text', 'author']);

      const reviewDoc = {
        businessId: reviewData.businessId,
        platform: reviewData.platform,
        platformReviewId: reviewData.platformReviewId,
        platformUrl: reviewData.platformUrl || '',
        
        // Review content
        rating: parseInt(reviewData.rating),
        title: reviewData.title || '',
        text: reviewData.text.trim(),
        
        // Author information
        author: {
          name: reviewData.author.name || 'Anonymous',
          username: reviewData.author.username || '',
          avatarUrl: reviewData.author.avatarUrl || '',
          location: reviewData.author.location || '',
          reviewCount: reviewData.author.reviewCount || 0
        },

        // Dates
        reviewDate: reviewData.reviewDate || serverTimestamp(),
        lastUpdatedDate: reviewData.lastUpdatedDate || serverTimestamp(),

        // Flagging (initialize as not flagged)
        flagging: {
          isFlagged: false,
          reason: null,
          keywords: [],
          flaggedAt: null
        },

        // AI analysis (to be populated by background processing)
        analysis: reviewData.analysis || {
          sentimentScore: null,
          sentimentLabel: null,
          emotionTags: [],
          languageDetected: 'en',
          isSpam: false,
          spamConfidence: 0,
          wordCount: reviewData.text.split(' ').length
        },

        // Metadata
        metadata: reviewData.metadata || {
          helpfulVotes: 0,
          totalVotes: 0,
          isVerifiedPurchase: false,
          hasPhotos: false,
          hasVideo: false
        },

        // Response tracking
        response: {
          hasResponse: false,
          responseCount: 0,
          lastResponseAt: null
        },

        // Internal tracking
        isArchived: false,
        priorityScore: this.calculatePriorityScore(reviewData.rating, reviewData.text),

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const result = await this.create(reviewDoc);

      // Auto-flag if needed
      await this.checkAndFlag(result.id, reviewDoc);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get reviews for a business
  async getBusinessReviews(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId }
      ];

      // Add platform filter
      if (options.platform) {
        filters.push({ field: 'platform', operator: '==', value: options.platform });
      }

      // Add rating filter
      if (options.minRating) {
        filters.push({ field: 'rating', operator: '>=', value: options.minRating });
      }
      if (options.maxRating) {
        filters.push({ field: 'rating', operator: '<=', value: options.maxRating });
      }

      // Add flagged filter
      if (options.flagged !== undefined) {
        filters.push({ field: 'flagging.isFlagged', operator: '==', value: options.flagged });
      }

      // Add response filter
      if (options.hasResponse !== undefined) {
        filters.push({ field: 'response.hasResponse', operator: '==', value: options.hasResponse });
      }

      // Add archived filter
      if (options.includeArchived !== true) {
        filters.push({ field: 'isArchived', operator: '==', value: false });
      }

      return await this.getWhere(filters, {
        orderByField: options.sortBy || 'reviewDate',
        orderDirection: options.sortOrder || 'desc',
        limitCount: options.limit || 25,
        startAfterDoc: options.startAfter || null
      });
    } catch (error) {
      throw error;
    }
  }

  // Get flagged reviews
  async getFlaggedReviews(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId },
        { field: 'flagging.isFlagged', operator: '==', value: true },
        { field: 'isArchived', operator: '==', value: false }
      ];

      return await this.getWhere(filters, {
        orderByField: 'priorityScore',
        orderDirection: 'desc',
        limitCount: options.limit || 25,
        startAfterDoc: options.startAfter || null
      });
    } catch (error) {
      throw error;
    }
  }

  // Get reviews needing response
  async getReviewsNeedingResponse(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId },
        { field: 'response.hasResponse', operator: '==', value: false },
        { field: 'isArchived', operator: '==', value: false }
      ];

      // Only show reviews with rating <= 3 by default (negative reviews)
      if (options.includePositive !== true) {
        filters.push({ field: 'rating', operator: '<=', value: 3 });
      }

      return await this.getWhere(filters, {
        orderByField: 'priorityScore',
        orderDirection: 'desc',
        limitCount: options.limit || 25,
        startAfterDoc: options.startAfter || null
      });
    } catch (error) {
      throw error;
    }
  }

  // Update review analysis (from AI processing)
  async updateAnalysis(reviewId, analysisData) {
    try {
      const updateData = {
        analysis: analysisData,
        updatedAt: serverTimestamp()
      };

      return await this.update(reviewId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Flag review
  async flagReview(reviewId, flagData) {
    try {
      validateRequired(flagData, ['reason']);

      const updateData = {
        flagging: {
          isFlagged: true,
          reason: flagData.reason,
          keywords: flagData.keywords || [],
          flaggedAt: serverTimestamp(),
          flaggedBy: flagData.flaggedBy || 'system'
        },
        priorityScore: Math.min(10, (flagData.priorityScore || 8)),
        updatedAt: serverTimestamp()
      };

      return await this.update(reviewId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Unflag review
  async unflagReview(reviewId) {
    try {
      const updateData = {
        flagging: {
          isFlagged: false,
          reason: null,
          keywords: [],
          flaggedAt: null,
          unflaggedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      };

      return await this.update(reviewId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Archive review
  async archiveReview(reviewId) {
    try {
      return await this.update(reviewId, {
        isArchived: true,
        archivedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  // Unarchive review
  async unarchiveReview(reviewId) {
    try {
      return await this.update(reviewId, {
        isArchived: false,
        unarchivedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  // Mark review as responded
  async markAsResponded(reviewId, responseData) {
    try {
      const updateData = {
        response: {
          hasResponse: true,
          responseCount: increment(1),
          lastResponseAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      };

      return await this.update(reviewId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Calculate priority score based on rating and content
  calculatePriorityScore(rating, text) {
    let score = 5; // Base score

    // Rating-based scoring (lower ratings = higher priority)
    if (rating <= 2) score += 3;
    else if (rating <= 3) score += 2;
    else if (rating >= 5) score -= 1;

    // Content-based scoring
    const negativeKeywords = ['terrible', 'horrible', 'worst', 'awful', 'scam', 'rude', 'unprofessional'];
    const urgentKeywords = ['lawsuit', 'legal', 'health', 'safety', 'discrimination'];
    
    const lowerText = text.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerText.includes(keyword))) {
      score += 4;
    } else if (negativeKeywords.some(keyword => lowerText.includes(keyword))) {
      score += 2;
    }

    // Text length (longer reviews might need more attention)
    if (text.length > 500) score += 1;

    return Math.min(10, Math.max(1, score));
  }

  // Auto-flag review based on criteria
  async checkAndFlag(reviewId, reviewData) {
    try {
      let shouldFlag = false;
      let flagReason = '';
      let keywords = [];

      // Flag low ratings
      if (reviewData.rating <= 2) {
        shouldFlag = true;
        flagReason = 'low_rating';
      }

      // Flag negative keywords
      const negativeKeywords = ['terrible', 'horrible', 'worst', 'awful', 'scam', 'rude', 'unprofessional'];
      const urgentKeywords = ['lawsuit', 'legal', 'health', 'safety', 'discrimination'];
      
      const lowerText = reviewData.text.toLowerCase();
      
      const foundNegative = negativeKeywords.filter(keyword => lowerText.includes(keyword));
      const foundUrgent = urgentKeywords.filter(keyword => lowerText.includes(keyword));
      
      if (foundUrgent.length > 0) {
        shouldFlag = true;
        flagReason = 'urgent_keywords';
        keywords = foundUrgent;
      } else if (foundNegative.length > 0) {
        shouldFlag = true;
        flagReason = flagReason || 'negative_keywords';
        keywords = foundNegative;
      }

      if (shouldFlag) {
        await this.flagReview(reviewId, {
          reason: flagReason,
          keywords: keywords,
          flaggedBy: 'system'
        });
      }

      return shouldFlag;
    } catch (error) {
      console.error('Error auto-flagging review:', error);
      // Don't throw error - flagging failure shouldn't fail review creation
      return false;
    }
  }

  // Get review statistics for a business
  async getReviewStats(businessId, options = {}) {
    try {
      const allReviews = await this.getBusinessReviews(businessId, { 
        includeArchived: true,
        limit: 1000 // Get more reviews for accurate stats
      });

      const reviews = allReviews.documents;
      
      if (reviews.length === 0) {
        return {
          total: 0,
          avgRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          platformBreakdown: {},
          flaggedCount: 0,
          respondedCount: 0,
          responseRate: 0
        };
      }

      // Calculate basic stats
      const total = reviews.length;
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
      
      // Rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      // Platform breakdown
      const platformBreakdown = {};
      reviews.forEach(review => {
        if (!platformBreakdown[review.platform]) {
          platformBreakdown[review.platform] = { count: 0, avgRating: 0 };
        }
        platformBreakdown[review.platform].count++;
      });

      // Calculate average rating per platform
      Object.keys(platformBreakdown).forEach(platform => {
        const platformReviews = reviews.filter(r => r.platform === platform);
        const platformAvg = platformReviews.reduce((sum, r) => sum + r.rating, 0) / platformReviews.length;
        platformBreakdown[platform].avgRating = platformAvg;
      });

      // Flag and response stats
      const flaggedCount = reviews.filter(r => r.flagging.isFlagged).length;
      const respondedCount = reviews.filter(r => r.response.hasResponse).length;
      const responseRate = (respondedCount / total) * 100;

      return {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        ratingDistribution,
        platformBreakdown,
        flaggedCount,
        respondedCount,
        responseRate: Math.round(responseRate * 10) / 10
      };
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // REVIEW MEDIA SUBCOLLECTION
  // =====================================================

  // Add media to review
  async addReviewMedia(reviewId, mediaData) {
    try {
      validateRequired(mediaData, ['type', 'url']);

      const mediaDoc = {
        type: mediaData.type, // photo, video
        url: mediaData.url,
        thumbnailUrl: mediaData.thumbnailUrl || '',
        caption: mediaData.caption || '',
        metadata: mediaData.metadata || {
          fileSize: 0,
          width: 0,
          height: 0,
          format: ''
        },
        createdAt: serverTimestamp()
      };

      const mediaRef = collection(db, 'reviews', reviewId, 'media');
      const docRef = await addDoc(mediaRef, mediaDoc);

      // Update review to indicate it has media
      await this.update(reviewId, {
        [`metadata.has${mediaData.type === 'photo' ? 'Photos' : 'Video'}`]: true
      });
      
      return { id: docRef.id, ...mediaDoc };
    } catch (error) {
      throw error;
    }
  }

  // Get review media
  async getReviewMedia(reviewId) {
    try {
      const mediaRef = collection(db, 'reviews', reviewId, 'media');
      const q = query(mediaRef, orderBy('createdAt', 'asc'));

      const querySnapshot = await getDocs(q);
      const media = [];
      
      querySnapshot.forEach(doc => {
        media.push({ id: doc.id, ...doc.data() });
      });

      return media;
    } catch (error) {
      throw error;
    }
  }
}

// =====================================================
// API WRAPPER FUNCTIONS
// =====================================================

const reviewsAPI = new ReviewsAPI();

// Review management functions
export const createReview = async (reviewData) => {
  try {
    const result = await reviewsAPI.createReview(reviewData);
    return formatResponse(result, 'Review created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getReviewById = async (reviewId) => {
  try {
    const result = await reviewsAPI.getById(reviewId);
    return formatResponse(result, 'Review retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getBusinessReviews = async (businessId, options) => {
  try {
    const result = await reviewsAPI.getBusinessReviews(businessId, options);
    return formatResponse(result, 'Business reviews retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getFlaggedReviews = async (businessId, options) => {
  try {
    const result = await reviewsAPI.getFlaggedReviews(businessId, options);
    return formatResponse(result, 'Flagged reviews retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getReviewsNeedingResponse = async (businessId, options) => {
  try {
    const result = await reviewsAPI.getReviewsNeedingResponse(businessId, options);
    return formatResponse(result, 'Reviews needing response retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateReviewAnalysis = async (reviewId, analysisData) => {
  try {
    const result = await reviewsAPI.updateAnalysis(reviewId, analysisData);
    return formatResponse(result, 'Review analysis updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const flagReview = async (reviewId, flagData) => {
  try {
    const result = await reviewsAPI.flagReview(reviewId, flagData);
    return formatResponse(result, 'Review flagged successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const unflagReview = async (reviewId) => {
  try {
    const result = await reviewsAPI.unflagReview(reviewId);
    return formatResponse(result, 'Review unflagged successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const archiveReview = async (reviewId) => {
  try {
    const result = await reviewsAPI.archiveReview(reviewId);
    return formatResponse(result, 'Review archived successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const unarchiveReview = async (reviewId) => {
  try {
    const result = await reviewsAPI.unarchiveReview(reviewId);
    return formatResponse(result, 'Review unarchived successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const markReviewAsResponded = async (reviewId, responseData) => {
  try {
    const result = await reviewsAPI.markAsResponded(reviewId, responseData);
    return formatResponse(result, 'Review marked as responded successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getReviewStats = async (businessId, options) => {
  try {
    const result = await reviewsAPI.getReviewStats(businessId, options);
    return formatResponse(result, 'Review statistics retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

// Media functions
export const addReviewMedia = async (reviewId, mediaData) => {
  try {
    const result = await reviewsAPI.addReviewMedia(reviewId, mediaData);
    return formatResponse(result, 'Review media added successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getReviewMedia = async (reviewId) => {
  try {
    const result = await reviewsAPI.getReviewMedia(reviewId);
    return formatResponse(result, 'Review media retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export default reviewsAPI;
