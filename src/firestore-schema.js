// =====================================================
// FIREBASE FIRESTORE DATABASE SCHEMA
// Review Management SaaS - Complete Collection Structure
// =====================================================

import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

// =====================================================
// COLLECTION INITIALIZERS
// =====================================================

export const initializeCollections = async () => {
  try {
    // Initialize subscription plans
    await initializeSubscriptionPlans();
    
    // Initialize system settings
    await initializeSystemSettings();
    
    console.log('Firestore collections initialized successfully');
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
};

// =====================================================
// 1. SUBSCRIPTION PLANS INITIALIZATION
// =====================================================

const initializeSubscriptionPlans = async () => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      description: 'Perfect for small businesses just getting started',
      priceMonthly: 29.00,
      priceYearly: 290.00,
      maxLocations: 1,
      maxResponsesPerMonth: 100,
      maxTeamMembers: 1,
      features: {
        aiResponses: true,
        analytics: false,
        teamCollaboration: false,
        prioritySupport: false,
        customBranding: false
      },
      stripePriceIdMonthly: 'price_starter_monthly',
      stripePriceIdYearly: 'price_starter_yearly',
      isActive: true,
      isPopular: false,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'growth',
      name: 'Growth Plan',
      description: 'Perfect for growing businesses',
      priceMonthly: 79.00,
      priceYearly: 790.00,
      maxLocations: 3,
      maxResponsesPerMonth: 1000,
      maxTeamMembers: 5,
      features: {
        aiResponses: true,
        analytics: true,
        teamCollaboration: true,
        prioritySupport: false,
        customBranding: false
      },
      stripePriceIdMonthly: 'price_growth_monthly',
      stripePriceIdYearly: 'price_growth_yearly',
      isActive: true,
      isPopular: true,
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      description: 'For large businesses with advanced needs',
      priceMonthly: 199.00,
      priceYearly: 1990.00,
      maxLocations: -1, // Unlimited
      maxResponsesPerMonth: -1, // Unlimited
      maxTeamMembers: -1, // Unlimited
      features: {
        aiResponses: true,
        analytics: true,
        teamCollaboration: true,
        prioritySupport: true,
        customBranding: true
      },
      stripePriceIdMonthly: 'price_enterprise_monthly',
      stripePriceIdYearly: 'price_enterprise_yearly',
      isActive: true,
      isPopular: false,
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const plan of plans) {
    await setDoc(doc(db, 'subscription_plans', plan.id), plan);
  }
};

// =====================================================
// 2. SYSTEM SETTINGS INITIALIZATION
// =====================================================

const initializeSystemSettings = async () => {
  const systemSettings = {
    features: {
      aiResponses: true,
      slackIntegration: false,
      advancedAnalytics: true
    },
    limits: {
      reviewSyncFrequencyMinutes: 15,
      maxResponsesPerDay: 1000,
      maxTeamMembersPerBusiness: 10
    },
    maintenance: {
      enabled: false,
      message: 'System maintenance in progress',
      estimatedEndTime: null
    },
    updatedAt: new Date()
  };

  await setDoc(doc(db, 'system_settings', 'global'), systemSettings);
};

// =====================================================
// COLLECTION SCHEMA DEFINITIONS
// =====================================================

export const collectionSchemas = {
  // 1. Users Collection
  users: {
    email: "string",
    firstName: "string",
    lastName: "string",
    phone: "string",
    avatarUrl: "string",
    emailVerified: "boolean",
    isActive: "boolean",
    lastLoginAt: "timestamp",
    onboardingCompleted: "boolean",
    onboardingStep: "number",
    timezone: "string",
    language: "string",
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 2. Businesses Collection
  businesses: {
    userId: "string",
    name: "string",
    description: "string",
    category: "string",
    industry: "string",
    address: "string",
    city: "string",
    state: "string",
    country: "string",
    postalCode: "string",
    phone: "string",
    website: "string",
    email: "string",
    location: {
      latitude: "number",
      longitude: "number"
    },
    platformIds: {
      google: "string",
      yelp: "string",
      facebook: "string"
    },
    businessHours: "object",
    specialties: "array",
    brandVoice: "string",
    isActive: "boolean",
    verificationStatus: "string",
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 3. Reviews Collection
  reviews: {
    businessId: "string",
    platform: "string",
    platformReviewId: "string",
    platformUrl: "string",
    rating: "number",
    title: "string",
    text: "string",
    author: {
      name: "string",
      username: "string",
      avatarUrl: "string",
      location: "string",
      reviewCount: "number"
    },
    reviewDate: "timestamp",
    lastUpdatedDate: "timestamp",
    flagging: {
      isFlagged: "boolean",
      reason: "string",
      keywords: "array",
      flaggedAt: "timestamp"
    },
    analysis: {
      sentimentScore: "number",
      sentimentLabel: "string",
      emotionTags: "array",
      languageDetected: "string",
      isSpam: "boolean",
      spamConfidence: "number",
      wordCount: "number"
    },
    metadata: {
      helpfulVotes: "number",
      totalVotes: "number",
      isVerifiedPurchase: "boolean",
      hasPhotos: "boolean",
      hasVideo: "boolean"
    },
    response: {
      hasResponse: "boolean",
      responseCount: "number",
      lastResponseAt: "timestamp"
    },
    isArchived: "boolean",
    priorityScore: "number",
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 4. Review Responses Collection
  review_responses: {
    reviewId: "string",
    businessId: "string",
    userId: "string",
    responseText: "string",
    responseType: "string",
    aiGeneration: {
      provider: "string",
      confidence: "number",
      promptVersion: "string",
      generationTimeMs: "number",
      alternatives: "array"
    },
    template: {
      templateId: "string",
      variables: "object"
    },
    publishing: {
      isPublished: "boolean",
      publishedAt: "timestamp",
      status: "string",
      error: "string",
      platformResponseId: "string",
      platformResponseUrl: "string"
    },
    performance: {
      helpfulVotes: "number",
      totalVotes: "number"
    },
    editCount: "number",
    lastEditedAt: "timestamp",
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 5. Response Templates Collection
  response_templates: {
    userId: "string",
    businessId: "string",
    name: "string",
    description: "string",
    templateText: "string",
    category: "string",
    ratingRange: "array",
    keywords: "array",
    variables: "object",
    usageCount: "number",
    lastUsedAt: "timestamp",
    isActive: "boolean",
    isDefault: "boolean",
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 6. Platform Integrations Collection
  platform_integrations: {
    businessId: "string",
    platform: "string",
    platformBusinessId: "string",
    platformName: "string",
    platformUrl: "string",
    accessToken: "string",
    refreshToken: "string",
    tokenExpiresAt: "timestamp",
    tokenScope: "array",
    isActive: "boolean",
    connectionStatus: "string",
    lastError: "string",
    lastSyncAt: "timestamp",
    nextSyncAt: "timestamp",
    syncFrequencyMinutes: "number",
    totalReviewsSynced: "number",
    autoRespond: "boolean",
    responseDelayMinutes: "number",
    platformSettings: "object",
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 7. Alert Settings Collection
  alert_settings: {
    businessId: "string",
    thresholds: {
      minRating: "number",
      keywords: "array"
    },
    notifications: {
      email: "boolean",
      sms: "boolean",
      inApp: "boolean",
      slack: "boolean",
      webhook: "boolean"
    },
    timing: {
      frequency: "string",
      quietHours: {
        start: "string",
        end: "string",
        timezone: "string"
      }
    },
    alertRules: "array",
    team: {
      notifyMembers: "boolean",
      escalationRules: "object"
    },
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 8. Notifications Collection
  notifications: {
    userId: "string",
    businessId: "string",
    reviewId: "string",
    type: "string",
    channel: "string",
    title: "string",
    message: "string",
    actionUrl: "string",
    delivery: {
      status: "string",
      attempts: "number",
      lastAttemptAt: "timestamp",
      sentAt: "timestamp",
      error: "string"
    },
    external: {
      messageId: "string",
      providerId: "string"
    },
    interaction: {
      openedAt: "timestamp",
      clickedAt: "timestamp",
      dismissedAt: "timestamp"
    },
    createdAt: "timestamp"
  },

  // 9. User Subscriptions Collection
  user_subscriptions: {
    userId: "string",
    planId: "string",
    stripeCustomerId: "string",
    stripeSubscriptionId: "string",
    stripePaymentMethodId: "string",
    status: "string",
    billingCycle: "string",
    currentPeriodStart: "timestamp",
    currentPeriodEnd: "timestamp",
    trialStart: "timestamp",
    trialEnd: "timestamp",
    canceledAt: "timestamp",
    cancelAtPeriodEnd: "boolean",
    cancellationReason: "string",
    currentLocationsCount: "number",
    currentResponsesCount: "number",
    responsesResetDate: "timestamp",
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 10. Daily Stats Collection
  daily_stats: {
    businessId: "string",
    date: "string",
    reviews: {
      total: "number",
      new: "number",
      avgRating: "number",
      ratingDistribution: "object"
    },
    platforms: "object",
    responses: {
      total: "number",
      new: "number",
      avgResponseTime: "number",
      responseRate: "number"
    },
    alerts: {
      triggered: "number",
      resolved: "number",
      pending: "number"
    },
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 11. Monthly Stats Collection
  monthly_stats: {
    businessId: "string",
    year: "number",
    month: "number",
    reviews: {
      total: "number",
      avgRating: "number",
      ratingTrend: "number",
      topKeywords: "array"
    },
    responses: {
      total: "number",
      responseRate: "number",
      avgResponseTime: "number",
      aiGeneratedCount: "number"
    },
    insights: {
      sentiment: "string",
      commonComplaints: "array",
      commonPraises: "array",
      recommendedActions: "array"
    },
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },

  // 12. API Usage Collection
  api_usage: {
    userId: "string",
    date: "string",
    usage: {
      reviewsProcessed: "number",
      responsesGenerated: "number",
      notificationsSent: "number",
      apiCallsCount: "number"
    },
    rateLimit: {
      requestsRemaining: "number",
      resetTime: "timestamp"
    },
    createdAt: "timestamp",
    updatedAt: "timestamp"
  }
};

// =====================================================
// HELPER FUNCTIONS FOR CREATING DOCUMENTS
// =====================================================

export const createUserDocument = async (userId, userData) => {
  const userDoc = {
    email: userData.email,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    phone: userData.phone || '',
    avatarUrl: userData.avatarUrl || '',
    emailVerified: userData.emailVerified || false,
    isActive: true,
    lastLoginAt: new Date(),
    onboardingCompleted: false,
    onboardingStep: 1,
    timezone: userData.timezone || 'America/New_York',
    language: userData.language || 'en',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await setDoc(doc(db, 'users', userId), userDoc);
  return userDoc;
};

export const createBusinessDocument = async (businessData) => {
  const businessDoc = {
    userId: businessData.userId,
    name: businessData.name,
    description: businessData.description || '',
    category: businessData.category || '',
    industry: businessData.industry || '',
    address: businessData.address || '',
    city: businessData.city || '',
    state: businessData.state || '',
    country: businessData.country || '',
    postalCode: businessData.postalCode || '',
    phone: businessData.phone || '',
    website: businessData.website || '',
    email: businessData.email || '',
    location: {
      latitude: businessData.latitude || 0,
      longitude: businessData.longitude || 0
    },
    platformIds: {
      google: '',
      yelp: '',
      facebook: ''
    },
    businessHours: {
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
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const docRef = await addDoc(collection(db, 'businesses'), businessDoc);
  return { id: docRef.id, ...businessDoc };
};

export const createAlertSettingsDocument = async (businessId, settings = {}) => {
  const alertSettings = {
    businessId: businessId,
    thresholds: {
      minRating: settings.minRating || 3,
      keywords: settings.keywords || ['terrible', 'horrible', 'worst', 'awful', 'scam', 'rude', 'unprofessional']
    },
    notifications: {
      email: true,
      sms: false,
      inApp: true,
      slack: false,
      webhook: false
    },
    timing: {
      frequency: 'immediate',
      quietHours: {
        start: '22:00',
        end: '08:00',
        timezone: 'America/New_York'
      }
    },
    alertRules: [],
    team: {
      notifyMembers: false,
      escalationRules: {
        noResponseAfterHours: 24,
        escalateTo: null
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await setDoc(doc(db, 'alert_settings', businessId), alertSettings);
  return alertSettings;
};

export default {
  initializeCollections,
  collectionSchemas,
  createUserDocument,
  createBusinessDocument,
  createAlertSettingsDocument
};
