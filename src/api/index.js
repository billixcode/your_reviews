// =====================================================
// API INDEX - Main Export File
// Centralized access to all CRUD APIs for Firestore collections
// =====================================================

// Base utilities
export { default as BaseCRUD, APIError, formatResponse, formatError } from './base.js';

// =====================================================
// USERS API
// =====================================================
export {
  // User management
  createUser,
  getUserById,
  getUserByEmail,
  updateUserProfile,
  updateLastLogin,
  verifyUserEmail,
  completeUserOnboarding,
  deactivateUser,
  reactivateUser,
  getActiveUsers,
  searchUsers,
  getUserStats,
  
  // Session management
  createUserSession,
  getUserSessions,
  revokeUserSession,
  revokeAllUserSessions,
  
  // API instance
  default as usersAPI
} from './users.js';

// =====================================================
// BUSINESSES API
// =====================================================
export {
  // Business management
  createBusiness,
  getBusinessById,
  getBusinessesByUser,
  updateBusiness,
  deleteBusiness,
  verifyBusiness,
  searchBusinesses,
  getBusinessStats,
  
  // Team management
  addTeamMember,
  getTeamMembers,
  updateTeamMember,
  removeTeamMember,
  checkBusinessAccess,
  
  // API instance
  default as businessesAPI
} from './businesses.js';

// =====================================================
// REVIEWS API
// =====================================================
export {
  // Review management
  createReview,
  getReviewById,
  getBusinessReviews,
  getFlaggedReviews,
  getReviewsNeedingResponse,
  updateReviewAnalysis,
  flagReview,
  unflagReview,
  archiveReview,
  unarchiveReview,
  markReviewAsResponded,
  getReviewStats,
  
  // Media management
  addReviewMedia,
  getReviewMedia,
  
  // API instance
  default as reviewsAPI
} from './reviews.js';

// =====================================================
// REVIEW RESPONSES API
// =====================================================
export {
  // Response management
  createResponse,
  getResponseById,
  getResponseByReviewId,
  getBusinessResponses,
  updateResponseText,
  publishResponse,
  markResponsePublishingFailed,
  updateResponsePerformance,
  getPendingResponses,
  getFailedResponses,
  getResponseStats,
  getAIMetrics,
  deleteResponse,
  
  // API instance
  default as responsesAPI
} from './responses.js';

// =====================================================
// RESPONSE TEMPLATES API
// =====================================================
export {
  // Template management
  createTemplate,
  getBusinessTemplates,
  updateTemplate,
  deleteTemplate,
  
  // API instance
  default as templatesAPI
} from './templates.js';

// =====================================================
// PLATFORM INTEGRATIONS API
// =====================================================
export {
  // Integration management
  createIntegration,
  getBusinessIntegrations,
  updateIntegrationStatus,
  updateSyncInfo,
  
  // Sync logs
  addSyncLog,
  getSyncLogs,
  
  // API instance
  default as integrationsAPI
} from './integrations.js';

// =====================================================
// SUBSCRIPTIONS API
// =====================================================
export {
  // Subscription plans
  getAllPlans,
  getPlanById,
  
  // User subscriptions
  createSubscription,
  getUserSubscription,
  updateSubscription,
  cancelSubscription,
  
  // Billing
  getBillingHistory,
  
  // API instance
  default as subscriptionsAPI
} from './subscriptions.js';

// =====================================================
// NOTIFICATIONS API
// =====================================================
export {
  // Notification management
  createNotification,
  getUserNotifications,
  markNotificationAsSent,
  markNotificationAsFailed,
  markNotificationAsOpened,
  
  // Alert settings
  getAlertSettings,
  updateAlertSettings,
  
  // API instance
  default as notificationsAPI
} from './notifications.js';

// =====================================================
// ANALYTICS API
// =====================================================
export {
  // Daily stats
  createDailyStats,
  getDailyStats,
  
  // Monthly stats
  getMonthlyStats,
  
  // Business overview
  getBusinessOverview,
  
  // API usage
  updateApiUsage,
  getApiUsage,
  
  // API instance
  default as analyticsAPI
} from './analytics.js';

// =====================================================
// SYSTEM SETTINGS
// =====================================================
import BaseCRUD from './base.js';

const systemSettingsAPI = new BaseCRUD('system_settings');

export const getSystemSettings = async () => {
  try {
    const result = await systemSettingsAPI.getById('global');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSystemSettings = async (settingsData) => {
  try {
    const result = await systemSettingsAPI.update('global', settingsData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =====================================================
// COMPREHENSIVE API OBJECT
// Export all APIs as a single object for convenience
// =====================================================
export const API = {
  // Core APIs
  users: usersAPI,
  businesses: businessesAPI,
  reviews: reviewsAPI,
  responses: responsesAPI,
  templates: templatesAPI,
  integrations: integrationsAPI,
  subscriptions: subscriptionsAPI,
  notifications: notificationsAPI,
  analytics: analyticsAPI,
  
  // System
  systemSettings: systemSettingsAPI,
  
  // Utilities
  BaseCRUD,
  APIError,
  formatResponse,
  formatError
};

// =====================================================
// USAGE EXAMPLES
// =====================================================

/* 

// Example: Create a new user
import { createUser } from './api/index.js';

const newUser = await createUser({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
}, 'user123');

// Example: Get business reviews with filters
import { getBusinessReviews } from './api/index.js';

const reviews = await getBusinessReviews('business123', {
  platform: 'google',
  minRating: 1,
  maxRating: 3,
  flagged: true,
  limit: 25
});

// Example: Create AI-generated response
import { createResponse } from './api/index.js';

const response = await createResponse({
  reviewId: 'review123',
  businessId: 'business123',
  userId: 'user123',
  responseText: 'Thank you for your feedback!',
  responseType: 'ai_generated',
  aiProvider: 'claude',
  aiConfidence: 0.9
});

// Example: Get business analytics overview
import { getBusinessOverview } from './api/index.js';

const overview = await getBusinessOverview('business123', 30); // Last 30 days

// Example: Use the comprehensive API object
import { API } from './api/index.js';

const user = await API.users.getById('user123');
const businesses = await API.businesses.getBusinessesByUser('user123');
const stats = await API.analytics.getBusinessOverview('business123');

*/

export default API;
