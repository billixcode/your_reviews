// =====================================================
// DATABASE INITIALIZATION SCRIPT
// Initialize Firestore collections with sample data
// =====================================================

import { initializeCollections, createUserDocument, createBusinessDocument, createAlertSettingsDocument } from './firestore-schema.js';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

// =====================================================
// SAMPLE DATA CREATION
// =====================================================

const createSampleData = async () => {
  try {
    console.log('Creating sample data...');

    // Sample user ID (in real app, this would come from Firebase Auth)
    const sampleUserId = 'sample_user_123';

    // 1. Create sample user
    await createUserDocument(sampleUserId, {
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      phone: '+1234567890',
      emailVerified: true,
      timezone: 'America/New_York',
      language: 'en'
    });

    // 2. Create sample business
    const business = await createBusinessDocument({
      userId: sampleUserId,
      name: "Demo Restaurant",
      description: "A sample restaurant for testing the review management system",
      category: "restaurant",
      industry: "food_service",
      address: "123 Demo Street",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10001",
      phone: "+1234567890",
      website: "https://demo-restaurant.com",
      email: "info@demo-restaurant.com",
      latitude: 40.7128,
      longitude: -74.0060,
      specialties: ["Italian cuisine", "Family dining", "Wine selection"],
      brandVoice: "friendly"
    });

    console.log('Created business:', business.id);

    // 3. Create alert settings for the business
    await createAlertSettingsDocument(business.id);

    // 4. Create sample response templates
    await createSampleResponseTemplates(sampleUserId, business.id);

    // 5. Create sample reviews
    await createSampleReviews(business.id);

    // 6. Create sample review responses
    await createSampleReviewResponses(business.id, sampleUserId);

    // 7. Create sample notifications
    await createSampleNotifications(sampleUserId, business.id);

    // 8. Create sample daily stats
    await createSampleDailyStats(business.id);

    console.log('Sample data created successfully!');

  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// =====================================================
// SAMPLE RESPONSE TEMPLATES
// =====================================================

const createSampleResponseTemplates = async (userId, businessId) => {
  const templates = [
    {
      userId: userId,
      businessId: businessId,
      name: "Positive Response - Thank You",
      description: "Standard response for positive reviews",
      templateText: "Thank you {customerName}! We're delighted you enjoyed your experience at {businessName}. We look forward to serving you again soon!",
      category: "positive",
      ratingRange: [4, 5],
      keywords: ["great", "excellent", "amazing", "wonderful", "fantastic"],
      variables: {
        customerName: "Customer's first name",
        businessName: "Business name"
      },
      usageCount: 15,
      lastUsedAt: new Date(),
      isActive: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: userId,
      businessId: businessId,
      name: "Negative Response - Apologetic",
      description: "Response for negative reviews with apology",
      templateText: "Thank you for your feedback, {customerName}. We sincerely apologize that your experience didn't meet expectations. We'd love the opportunity to make this right. Please contact us directly so we can address your concerns.",
      category: "negative",
      ratingRange: [1, 2],
      keywords: ["terrible", "horrible", "bad", "worst", "awful"],
      variables: {
        customerName: "Customer's first name"
      },
      usageCount: 8,
      lastUsedAt: new Date(),
      isActive: true,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: userId,
      businessId: businessId,
      name: "Neutral Response - Encouragement",
      description: "Response for neutral reviews",
      templateText: "Thank you for taking the time to review us, {customerName}. We appreciate your feedback and are always working to improve. We hope to provide you with an even better experience next time!",
      category: "neutral",
      ratingRange: [3, 3],
      keywords: ["okay", "average", "decent", "fine"],
      variables: {
        customerName: "Customer's first name"
      },
      usageCount: 5,
      lastUsedAt: new Date(),
      isActive: true,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const template of templates) {
    await addDoc(collection(db, 'response_templates'), template);
  }
};

// =====================================================
// SAMPLE REVIEWS
// =====================================================

const createSampleReviews = async (businessId) => {
  const reviews = [
    {
      businessId: businessId,
      platform: "google",
      platformReviewId: "google_review_1",
      platformUrl: "https://maps.google.com/review1",
      rating: 5,
      title: "Amazing food and service!",
      text: "Had an incredible dinner here last night. The pasta was perfectly cooked and the staff was very attentive. Definitely coming back!",
      author: {
        name: "Sarah M.",
        username: "sarahm123",
        avatarUrl: "https://example.com/avatar1.jpg",
        location: "New York, NY",
        reviewCount: 25
      },
      reviewDate: new Date('2024-08-20'),
      lastUpdatedDate: new Date('2024-08-20'),
      flagging: {
        isFlagged: false,
        reason: null,
        keywords: [],
        flaggedAt: null
      },
      analysis: {
        sentimentScore: 0.9,
        sentimentLabel: "positive",
        emotionTags: ["happy", "satisfied", "excited"],
        languageDetected: "en",
        isSpam: false,
        spamConfidence: 0.05,
        wordCount: 28
      },
      metadata: {
        helpfulVotes: 3,
        totalVotes: 3,
        isVerifiedPurchase: true,
        hasPhotos: false,
        hasVideo: false
      },
      response: {
        hasResponse: true,
        responseCount: 1,
        lastResponseAt: new Date('2024-08-20')
      },
      isArchived: false,
      priorityScore: 8,
      createdAt: new Date('2024-08-20'),
      updatedAt: new Date('2024-08-20')
    },
    {
      businessId: businessId,
      platform: "yelp",
      platformReviewId: "yelp_review_1",
      platformUrl: "https://yelp.com/review1",
      rating: 2,
      title: "Disappointing experience",
      text: "Service was really slow and the food was cold when it arrived. Expected much better based on the reviews.",
      author: {
        name: "Mike R.",
        username: "mike_reviews",
        avatarUrl: "https://example.com/avatar2.jpg",
        location: "Brooklyn, NY",
        reviewCount: 45
      },
      reviewDate: new Date('2024-08-19'),
      lastUpdatedDate: new Date('2024-08-19'),
      flagging: {
        isFlagged: true,
        reason: "low_rating",
        keywords: ["slow", "cold", "disappointing"],
        flaggedAt: new Date('2024-08-19')
      },
      analysis: {
        sentimentScore: -0.7,
        sentimentLabel: "negative",
        emotionTags: ["disappointed", "frustrated"],
        languageDetected: "en",
        isSpam: false,
        spamConfidence: 0.1,
        wordCount: 22
      },
      metadata: {
        helpfulVotes: 1,
        totalVotes: 2,
        isVerifiedPurchase: true,
        hasPhotos: false,
        hasVideo: false
      },
      response: {
        hasResponse: true,
        responseCount: 1,
        lastResponseAt: new Date('2024-08-19')
      },
      isArchived: false,
      priorityScore: 9,
      createdAt: new Date('2024-08-19'),
      updatedAt: new Date('2024-08-19')
    },
    {
      businessId: businessId,
      platform: "facebook",
      platformReviewId: "facebook_review_1",
      platformUrl: "https://facebook.com/review1",
      rating: 4,
      title: "Good food, nice atmosphere",
      text: "Enjoyed our meal here. The ambiance is really nice and the food was tasty. Service could be a bit faster but overall a good experience.",
      author: {
        name: "Lisa K.",
        username: "lisa.keller",
        avatarUrl: "https://example.com/avatar3.jpg",
        location: "Manhattan, NY",
        reviewCount: 12
      },
      reviewDate: new Date('2024-08-18'),
      lastUpdatedDate: new Date('2024-08-18'),
      flagging: {
        isFlagged: false,
        reason: null,
        keywords: [],
        flaggedAt: null
      },
      analysis: {
        sentimentScore: 0.6,
        sentimentLabel: "positive",
        emotionTags: ["satisfied", "pleased"],
        languageDetected: "en",
        isSpam: false,
        spamConfidence: 0.02,
        wordCount: 30
      },
      metadata: {
        helpfulVotes: 2,
        totalVotes: 3,
        isVerifiedPurchase: false,
        hasPhotos: true,
        hasVideo: false
      },
      response: {
        hasResponse: false,
        responseCount: 0,
        lastResponseAt: null
      },
      isArchived: false,
      priorityScore: 6,
      createdAt: new Date('2024-08-18'),
      updatedAt: new Date('2024-08-18')
    }
  ];

  for (const review of reviews) {
    await addDoc(collection(db, 'reviews'), review);
  }
};

// =====================================================
// SAMPLE REVIEW RESPONSES
// =====================================================

const createSampleReviewResponses = async (businessId, userId) => {
  // Get the reviews to respond to (in a real app, you'd query for them)
  const responses = [
    {
      reviewId: "sample_review_1", // This would be the actual review ID
      businessId: businessId,
      userId: userId,
      responseText: "Thank you Sarah! We're thrilled you enjoyed your pasta and experienced our attentive service. We can't wait to welcome you back for another amazing dinner!",
      responseType: "ai_generated",
      aiGeneration: {
        provider: "claude",
        confidence: 0.92,
        promptVersion: "v2.1",
        generationTimeMs: 850,
        alternatives: [
          "Thank you so much for the wonderful review, Sarah!",
          "We're delighted you had such a great experience!"
        ]
      },
      template: {
        templateId: null,
        variables: {}
      },
      publishing: {
        isPublished: true,
        publishedAt: new Date('2024-08-20'),
        status: "published",
        error: null,
        platformResponseId: "google_response_123",
        platformResponseUrl: "https://maps.google.com/response1"
      },
      performance: {
        helpfulVotes: 2,
        totalVotes: 2
      },
      editCount: 0,
      lastEditedAt: null,
      createdAt: new Date('2024-08-20'),
      updatedAt: new Date('2024-08-20')
    },
    {
      reviewId: "sample_review_2",
      businessId: businessId,
      userId: userId,
      responseText: "Thank you for your feedback, Mike. We sincerely apologize that your experience didn't meet expectations. We've addressed the service timing issues and would love to invite you back to show you the improvements we've made. Please contact us directly at info@demo-restaurant.com.",
      responseType: "manual",
      aiGeneration: {
        provider: null,
        confidence: null,
        promptVersion: null,
        generationTimeMs: null,
        alternatives: []
      },
      template: {
        templateId: "negative_template_id",
        variables: {
          customerName: "Mike"
        }
      },
      publishing: {
        isPublished: true,
        publishedAt: new Date('2024-08-19'),
        status: "published",
        error: null,
        platformResponseId: "yelp_response_456",
        platformResponseUrl: "https://yelp.com/response1"
      },
      performance: {
        helpfulVotes: 1,
        totalVotes: 1
      },
      editCount: 1,
      lastEditedAt: new Date('2024-08-19'),
      createdAt: new Date('2024-08-19'),
      updatedAt: new Date('2024-08-19')
    }
  ];

  for (const response of responses) {
    await addDoc(collection(db, 'review_responses'), response);
  }
};

// =====================================================
// SAMPLE NOTIFICATIONS
// =====================================================

const createSampleNotifications = async (userId, businessId) => {
  const notifications = [
    {
      userId: userId,
      businessId: businessId,
      reviewId: "sample_review_2",
      type: "review_alert",
      channel: "email",
      title: "New 2-star review received",
      message: "A new review needs your attention on Yelp",
      actionUrl: "/reviews/sample_review_2",
      delivery: {
        status: "sent",
        attempts: 1,
        lastAttemptAt: new Date('2024-08-19'),
        sentAt: new Date('2024-08-19'),
        error: null
      },
      external: {
        messageId: "email_123456",
        providerId: "sendgrid_msg_789"
      },
      interaction: {
        openedAt: new Date('2024-08-19'),
        clickedAt: new Date('2024-08-19'),
        dismissedAt: null
      },
      createdAt: new Date('2024-08-19')
    },
    {
      userId: userId,
      businessId: businessId,
      reviewId: null,
      type: "weekly_summary",
      channel: "email",
      title: "Weekly Review Summary",
      message: "You received 3 new reviews this week with an average rating of 3.7",
      actionUrl: "/analytics/weekly",
      delivery: {
        status: "sent",
        attempts: 1,
        lastAttemptAt: new Date('2024-08-18'),
        sentAt: new Date('2024-08-18'),
        error: null
      },
      external: {
        messageId: "email_123457",
        providerId: "sendgrid_msg_790"
      },
      interaction: {
        openedAt: new Date('2024-08-18'),
        clickedAt: null,
        dismissedAt: null
      },
      createdAt: new Date('2024-08-18')
    }
  ];

  for (const notification of notifications) {
    await addDoc(collection(db, 'notifications'), notification);
  }
};

// =====================================================
// SAMPLE DAILY STATS
// =====================================================

const createSampleDailyStats = async (businessId) => {
  const statsData = [
    {
      businessId: businessId,
      date: "2024-08-20",
      reviews: {
        total: 25,
        new: 1,
        avgRating: 4.2,
        ratingDistribution: {
          "1": 1,
          "2": 2,
          "3": 4,
          "4": 8,
          "5": 10
        }
      },
      platforms: {
        google: { count: 15, avgRating: 4.3 },
        yelp: { count: 7, avgRating: 4.0 },
        facebook: { count: 3, avgRating: 4.5 }
      },
      responses: {
        total: 20,
        new: 1,
        avgResponseTime: 4.5,
        responseRate: 0.80
      },
      alerts: {
        triggered: 0,
        resolved: 0,
        pending: 0
      },
      createdAt: new Date('2024-08-20'),
      updatedAt: new Date('2024-08-20')
    },
    {
      businessId: businessId,
      date: "2024-08-19",
      reviews: {
        total: 24,
        new: 1,
        avgRating: 4.0,
        ratingDistribution: {
          "1": 1,
          "2": 3,
          "3": 4,
          "4": 7,
          "5": 9
        }
      },
      platforms: {
        google: { count: 14, avgRating: 4.2 },
        yelp: { count: 7, avgRating: 3.8 },
        facebook: { count: 3, avgRating: 4.5 }
      },
      responses: {
        total: 19,
        new: 1,
        avgResponseTime: 6.2,
        responseRate: 0.79
      },
      alerts: {
        triggered: 1,
        resolved: 1,
        pending: 0
      },
      createdAt: new Date('2024-08-19'),
      updatedAt: new Date('2024-08-19')
    }
  ];

  for (const stats of statsData) {
    const docId = `${businessId}_${stats.date}`;
    await setDoc(doc(db, 'daily_stats', docId), stats);
  }
};

// =====================================================
// MAIN INITIALIZATION FUNCTION
// =====================================================

export const initializeDatabase = async () => {
  console.log('🚀 Starting database initialization...');
  
  try {
    // Initialize basic collections and system data
    await initializeCollections();
    
    // Create sample data for testing
    await createSampleData();
    
    console.log('✅ Database initialization completed successfully!');
    console.log('📊 Sample data includes:');
    console.log('   - 1 Sample user and business');
    console.log('   - 3 Response templates');
    console.log('   - 3 Sample reviews (Google, Yelp, Facebook)');
    console.log('   - 2 Review responses');
    console.log('   - 2 Notifications');
    console.log('   - 2 Days of analytics data');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Set up Firebase Authentication');
    console.log('   2. Get your Firebase config from the console');
    console.log('   3. Update src/firebase-config.js with real config');
    console.log('   4. Deploy security rules: firebase deploy --only firestore:rules');
    console.log('   5. Deploy indexes: firebase deploy --only firestore:indexes');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}
