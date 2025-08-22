// =====================================================
// REVIEW RESPONSES API - CRUD Operations
// Handles AI-generated and manual review responses
// =====================================================

import { 
  collection,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  increment
} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import BaseCRUD, { validateRequired, APIError, formatResponse, formatError } from './base.js';

class ReviewResponsesAPI extends BaseCRUD {
  constructor() {
    super('review_responses');
  }

  // =====================================================
  // RESPONSE-SPECIFIC CRUD OPERATIONS
  // =====================================================

  // Create new response
  async createResponse(responseData) {
    try {
      validateRequired(responseData, ['reviewId', 'businessId', 'userId', 'responseText', 'responseType']);

      const responseDoc = {
        reviewId: responseData.reviewId,
        businessId: responseData.businessId,
        userId: responseData.userId,
        responseText: responseData.responseText.trim(),
        responseType: responseData.responseType, // manual, ai_generated, template

        // AI generation details
        aiGeneration: responseData.responseType === 'ai_generated' ? {
          provider: responseData.aiProvider || 'claude',
          confidence: responseData.aiConfidence || 0,
          promptVersion: responseData.promptVersion || 'v1.0',
          generationTimeMs: responseData.generationTimeMs || 0,
          alternatives: responseData.alternatives || []
        } : null,

        // Template info
        template: responseData.templateId ? {
          templateId: responseData.templateId,
          variables: responseData.templateVariables || {}
        } : null,

        // Publishing status
        publishing: {
          isPublished: false,
          publishedAt: null,
          status: 'pending', // pending, published, failed
          error: null,
          platformResponseId: null,
          platformResponseUrl: null
        },

        // Response performance
        performance: {
          helpfulVotes: 0,
          totalVotes: 0
        },

        // Editing history
        editCount: 0,
        lastEditedAt: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      return await this.create(responseDoc);
    } catch (error) {
      throw error;
    }
  }

  // Get responses for a business
  async getBusinessResponses(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId }
      ];

      // Add status filter
      if (options.status) {
        filters.push({ field: 'publishing.status', operator: '==', value: options.status });
      }

      // Add response type filter
      if (options.responseType) {
        filters.push({ field: 'responseType', operator: '==', value: options.responseType });
      }

      return await this.getWhere(filters, {
        orderByField: options.sortBy || 'createdAt',
        orderDirection: options.sortOrder || 'desc',
        limitCount: options.limit || 25,
        startAfterDoc: options.startAfter || null
      });
    } catch (error) {
      throw error;
    }
  }

  // Get response by review ID
  async getResponseByReviewId(reviewId) {
    try {
      const filters = [
        { field: 'reviewId', operator: '==', value: reviewId }
      ];

      const result = await this.getWhere(filters, { limitCount: 1 });
      
      if (result.documents.length === 0) {
        return null;
      }

      return result.documents[0];
    } catch (error) {
      throw error;
    }
  }

  // Update response text
  async updateResponseText(responseId, newText, userId) {
    try {
      const response = await this.getById(responseId);
      
      // Verify ownership
      if (response.userId !== userId) {
        throw new APIError('Permission denied', 'PERMISSION_DENIED', 403);
      }

      const updateData = {
        responseText: newText.trim(),
        editCount: increment(1),
        lastEditedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Reset publishing status if already published
      if (response.publishing.isPublished) {
        updateData['publishing.status'] = 'pending';
        updateData['publishing.error'] = null;
      }

      return await this.update(responseId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Publish response to platform
  async publishResponse(responseId, publishingData) {
    try {
      validateRequired(publishingData, ['platformResponseId']);

      const updateData = {
        publishing: {
          isPublished: true,
          publishedAt: serverTimestamp(),
          status: 'published',
          error: null,
          platformResponseId: publishingData.platformResponseId,
          platformResponseUrl: publishingData.platformResponseUrl || null
        },
        updatedAt: serverTimestamp()
      };

      return await this.update(responseId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Mark response publishing as failed
  async markPublishingFailed(responseId, error) {
    try {
      const updateData = {
        publishing: {
          isPublished: false,
          publishedAt: null,
          status: 'failed',
          error: error.message || 'Unknown error',
          platformResponseId: null,
          platformResponseUrl: null
        },
        updatedAt: serverTimestamp()
      };

      return await this.update(responseId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Update response performance (votes)
  async updatePerformance(responseId, performanceData) {
    try {
      const updateData = {
        performance: performanceData,
        updatedAt: serverTimestamp()
      };

      return await this.update(responseId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Get pending responses (not yet published)
  async getPendingResponses(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId },
        { field: 'publishing.status', operator: '==', value: 'pending' }
      ];

      return await this.getWhere(filters, {
        orderByField: 'createdAt',
        orderDirection: 'asc',
        limitCount: options.limit || 25,
        startAfterDoc: options.startAfter || null
      });
    } catch (error) {
      throw error;
    }
  }

  // Get failed responses
  async getFailedResponses(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId },
        { field: 'publishing.status', operator: '==', value: 'failed' }
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

  // Get response statistics
  async getResponseStats(businessId, options = {}) {
    try {
      const allResponses = await this.getBusinessResponses(businessId, { 
        limit: 1000 // Get more responses for accurate stats
      });

      const responses = allResponses.documents;
      
      if (responses.length === 0) {
        return {
          total: 0,
          published: 0,
          pending: 0,
          failed: 0,
          publishRate: 0,
          aiGenerated: 0,
          manual: 0,
          template: 0,
          avgGenerationTime: 0
        };
      }

      const total = responses.length;
      const published = responses.filter(r => r.publishing.status === 'published').length;
      const pending = responses.filter(r => r.publishing.status === 'pending').length;
      const failed = responses.filter(r => r.publishing.status === 'failed').length;
      const publishRate = (published / total) * 100;

      // Response type breakdown
      const aiGenerated = responses.filter(r => r.responseType === 'ai_generated').length;
      const manual = responses.filter(r => r.responseType === 'manual').length;
      const template = responses.filter(r => r.responseType === 'template').length;

      // Average AI generation time
      const aiResponses = responses.filter(r => r.responseType === 'ai_generated' && r.aiGeneration?.generationTimeMs);
      const avgGenerationTime = aiResponses.length > 0 
        ? aiResponses.reduce((sum, r) => sum + r.aiGeneration.generationTimeMs, 0) / aiResponses.length
        : 0;

      return {
        total,
        published,
        pending,
        failed,
        publishRate: Math.round(publishRate * 10) / 10,
        aiGenerated,
        manual,
        template,
        avgGenerationTime: Math.round(avgGenerationTime)
      };
    } catch (error) {
      throw error;
    }
  }

  // Get AI generation metrics
  async getAIMetrics(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId },
        { field: 'responseType', operator: '==', value: 'ai_generated' }
      ];

      const result = await this.getWhere(filters, { limit: 1000 });
      const aiResponses = result.documents;

      if (aiResponses.length === 0) {
        return {
          totalGenerated: 0,
          avgConfidence: 0,
          avgGenerationTime: 0,
          providerBreakdown: {},
          successRate: 0
        };
      }

      const totalGenerated = aiResponses.length;
      const confidenceSum = aiResponses.reduce((sum, r) => sum + (r.aiGeneration?.confidence || 0), 0);
      const avgConfidence = confidenceSum / totalGenerated;

      const timeSum = aiResponses.reduce((sum, r) => sum + (r.aiGeneration?.generationTimeMs || 0), 0);
      const avgGenerationTime = timeSum / totalGenerated;

      // Provider breakdown
      const providerBreakdown = {};
      aiResponses.forEach(response => {
        const provider = response.aiGeneration?.provider || 'unknown';
        if (!providerBreakdown[provider]) {
          providerBreakdown[provider] = { count: 0, avgConfidence: 0 };
        }
        providerBreakdown[provider].count++;
      });

      // Calculate average confidence per provider
      Object.keys(providerBreakdown).forEach(provider => {
        const providerResponses = aiResponses.filter(r => r.aiGeneration?.provider === provider);
        const providerConfidenceSum = providerResponses.reduce((sum, r) => sum + (r.aiGeneration?.confidence || 0), 0);
        providerBreakdown[provider].avgConfidence = providerConfidenceSum / providerResponses.length;
      });

      const successfullyPublished = aiResponses.filter(r => r.publishing.status === 'published').length;
      const successRate = (successfullyPublished / totalGenerated) * 100;

      return {
        totalGenerated,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        avgGenerationTime: Math.round(avgGenerationTime),
        providerBreakdown,
        successRate: Math.round(successRate * 10) / 10
      };
    } catch (error) {
      throw error;
    }
  }
}

// =====================================================
// API WRAPPER FUNCTIONS
// =====================================================

const responsesAPI = new ReviewResponsesAPI();

// Response management functions
export const createResponse = async (responseData) => {
  try {
    const result = await responsesAPI.createResponse(responseData);
    return formatResponse(result, 'Response created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getResponseById = async (responseId) => {
  try {
    const result = await responsesAPI.getById(responseId);
    return formatResponse(result, 'Response retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getResponseByReviewId = async (reviewId) => {
  try {
    const result = await responsesAPI.getResponseByReviewId(reviewId);
    return formatResponse(result, 'Response retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getBusinessResponses = async (businessId, options) => {
  try {
    const result = await responsesAPI.getBusinessResponses(businessId, options);
    return formatResponse(result, 'Business responses retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateResponseText = async (responseId, newText, userId) => {
  try {
    const result = await responsesAPI.updateResponseText(responseId, newText, userId);
    return formatResponse(result, 'Response text updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const publishResponse = async (responseId, publishingData) => {
  try {
    const result = await responsesAPI.publishResponse(responseId, publishingData);
    return formatResponse(result, 'Response published successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const markResponsePublishingFailed = async (responseId, error) => {
  try {
    const result = await responsesAPI.markPublishingFailed(responseId, error);
    return formatResponse(result, 'Response marked as failed successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateResponsePerformance = async (responseId, performanceData) => {
  try {
    const result = await responsesAPI.updatePerformance(responseId, performanceData);
    return formatResponse(result, 'Response performance updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getPendingResponses = async (businessId, options) => {
  try {
    const result = await responsesAPI.getPendingResponses(businessId, options);
    return formatResponse(result, 'Pending responses retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getFailedResponses = async (businessId, options) => {
  try {
    const result = await responsesAPI.getFailedResponses(businessId, options);
    return formatResponse(result, 'Failed responses retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getResponseStats = async (businessId, options) => {
  try {
    const result = await responsesAPI.getResponseStats(businessId, options);
    return formatResponse(result, 'Response statistics retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getAIMetrics = async (businessId, options) => {
  try {
    const result = await responsesAPI.getAIMetrics(businessId, options);
    return formatResponse(result, 'AI metrics retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const deleteResponse = async (responseId, userId) => {
  try {
    // Verify ownership before deletion
    const response = await responsesAPI.getById(responseId);
    if (response.userId !== userId) {
      throw new APIError('Permission denied', 'PERMISSION_DENIED', 403);
    }
    
    const result = await responsesAPI.delete(responseId);
    return formatResponse(result, 'Response deleted successfully');
  } catch (error) {
    return formatError(error);
  }
};

export default responsesAPI;
