// =====================================================
// ANALYTICS API - CRUD Operations
// Handles daily/monthly stats and reporting
// =====================================================

import { 
  collection,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import BaseCRUD, { validateRequired, APIError, formatResponse, formatError } from './base.js';

class AnalyticsAPI extends BaseCRUD {
  constructor() {
    super('daily_stats');
    this.monthlyStats = new BaseCRUD('monthly_stats');
    this.apiUsage = new BaseCRUD('api_usage');
  }

  // =====================================================
  // DAILY STATS
  // =====================================================

  async createDailyStats(businessId, date, statsData) {
    try {
      const docId = `${businessId}_${date}`;
      const statsDoc = {
        businessId,
        date,
        reviews: statsData.reviews || {
          total: 0,
          new: 0,
          avgRating: 0,
          ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
        },
        platforms: statsData.platforms || {},
        responses: statsData.responses || {
          total: 0,
          new: 0,
          avgResponseTime: 0,
          responseRate: 0
        },
        alerts: statsData.alerts || {
          triggered: 0,
          resolved: 0,
          pending: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'daily_stats', docId), statsDoc);
      return { id: docId, ...statsDoc };
    } catch (error) {
      throw error;
    }
  }

  async getDailyStats(businessId, startDate, endDate) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId }
      ];

      if (startDate) {
        filters.push({ field: 'date', operator: '>=', value: startDate });
      }
      if (endDate) {
        filters.push({ field: 'date', operator: '<=', value: endDate });
      }

      return await this.getWhere(filters, {
        orderByField: 'date',
        orderDirection: 'desc',
        limitCount: 90 // Max 3 months of daily data
      });
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // MONTHLY STATS
  // =====================================================

  async createMonthlyStats(businessId, year, month, statsData) {
    try {
      const docId = `${businessId}_${year}_${month}`;
      const statsDoc = {
        businessId,
        year,
        month,
        reviews: statsData.reviews || {
          total: 0,
          avgRating: 0,
          ratingTrend: 0,
          topKeywords: []
        },
        responses: statsData.responses || {
          total: 0,
          responseRate: 0,
          avgResponseTime: 0,
          aiGeneratedCount: 0
        },
        insights: statsData.insights || {
          sentiment: 'neutral',
          commonComplaints: [],
          commonPraises: [],
          recommendedActions: []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'monthly_stats', docId), statsDoc);
      return { id: docId, ...statsDoc };
    } catch (error) {
      throw error;
    }
  }

  async getMonthlyStats(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId }
      ];

      if (options.year) {
        filters.push({ field: 'year', operator: '==', value: options.year });
      }

      return await this.monthlyStats.getWhere(filters, {
        orderByField: 'year',
        orderDirection: 'desc',
        limitCount: 24 // Max 2 years of monthly data
      });
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // API USAGE
  // =====================================================

  async updateApiUsage(userId, date, usageData) {
    try {
      const docId = `${userId}_${date}`;
      const usageDoc = {
        userId,
        date,
        usage: usageData.usage || {
          reviewsProcessed: 0,
          responsesGenerated: 0,
          notificationsSent: 0,
          apiCallsCount: 0
        },
        rateLimit: usageData.rateLimit || {
          requestsRemaining: 1000,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'api_usage', docId), usageDoc);
      return { id: docId, ...usageDoc };
    } catch (error) {
      throw error;
    }
  }

  async getApiUsage(userId, options = {}) {
    try {
      const filters = [
        { field: 'userId', operator: '==', value: userId }
      ];

      return await this.apiUsage.getWhere(filters, {
        orderByField: 'date',
        orderDirection: 'desc',
        limitCount: options.limit || 30
      });
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // AGGREGATE ANALYTICS
  // =====================================================

  async getBusinessOverview(businessId, days = 30) {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const dailyStats = await this.getDailyStats(businessId, startDate, endDate);
      const stats = dailyStats.documents;

      if (stats.length === 0) {
        return {
          totalReviews: 0,
          avgRating: 0,
          totalResponses: 0,
          responseRate: 0,
          trends: {
            reviewsTrend: 0,
            ratingTrend: 0,
            responsesTrend: 0
          }
        };
      }

      // Calculate totals
      const totalReviews = stats.reduce((sum, s) => sum + s.reviews.new, 0);
      const totalResponses = stats.reduce((sum, s) => sum + s.responses.new, 0);
      
      // Calculate weighted average rating
      let totalRatingPoints = 0;
      let totalReviewsForRating = 0;
      
      stats.forEach(stat => {
        if (stat.reviews.new > 0) {
          totalRatingPoints += stat.reviews.avgRating * stat.reviews.new;
          totalReviewsForRating += stat.reviews.new;
        }
      });
      
      const avgRating = totalReviewsForRating > 0 ? totalRatingPoints / totalReviewsForRating : 0;
      const responseRate = totalReviews > 0 ? (totalResponses / totalReviews) * 100 : 0;

      // Calculate trends (compare first half vs second half of period)
      const midPoint = Math.floor(stats.length / 2);
      const firstHalf = stats.slice(midPoint);
      const secondHalf = stats.slice(0, midPoint);

      const firstHalfReviews = firstHalf.reduce((sum, s) => sum + s.reviews.new, 0);
      const secondHalfReviews = secondHalf.reduce((sum, s) => sum + s.reviews.new, 0);

      const reviewsTrend = firstHalfReviews > 0 ? 
        ((secondHalfReviews - firstHalfReviews) / firstHalfReviews) * 100 : 0;

      return {
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalResponses,
        responseRate: Math.round(responseRate * 10) / 10,
        trends: {
          reviewsTrend: Math.round(reviewsTrend * 10) / 10,
          ratingTrend: 0, // Would need more complex calculation
          responsesTrend: 0  // Would need more complex calculation
        },
        dailyBreakdown: stats.slice(0, 7) // Last 7 days
      };
    } catch (error) {
      throw error;
    }
  }
}

const analyticsAPI = new AnalyticsAPI();

export const createDailyStats = async (businessId, date, statsData) => {
  try {
    const result = await analyticsAPI.createDailyStats(businessId, date, statsData);
    return formatResponse(result, 'Daily stats created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getDailyStats = async (businessId, startDate, endDate) => {
  try {
    const result = await analyticsAPI.getDailyStats(businessId, startDate, endDate);
    return formatResponse(result, 'Daily stats retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getMonthlyStats = async (businessId, options) => {
  try {
    const result = await analyticsAPI.getMonthlyStats(businessId, options);
    return formatResponse(result, 'Monthly stats retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getBusinessOverview = async (businessId, days) => {
  try {
    const result = await analyticsAPI.getBusinessOverview(businessId, days);
    return formatResponse(result, 'Business overview retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateApiUsage = async (userId, date, usageData) => {
  try {
    const result = await analyticsAPI.updateApiUsage(userId, date, usageData);
    return formatResponse(result, 'API usage updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getApiUsage = async (userId, options) => {
  try {
    const result = await analyticsAPI.getApiUsage(userId, options);
    return formatResponse(result, 'API usage retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export default analyticsAPI;
