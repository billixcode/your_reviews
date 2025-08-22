// =====================================================
// ADD MOCK DATA SCRIPT
// Creates realistic mock data for demo purposes
// All mock data has "MOCK_" prefix for easy identification and deletion
// =====================================================

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfvFo67UbV1j_TWLJp2eq98-7JWBmUKNs",
  authDomain: "your-reviews-app-1755877051.firebaseapp.com",
  projectId: "your-reviews-app-1755877051",
  storageBucket: "your-reviews-app-1755877051.firebasestorage.app",
  messagingSenderId: "618063827581",
  appId: "1:618063827581:web:afdb9b9c55bd53d7f15714"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createMockData() {
  console.log('🚀 Creating mock data...');

  try {
    // 1. Create MOCK business (easy to identify)
    const mockBusinessId = 'MOCK_business_demo_restaurant';
    await setDoc(doc(db, 'businesses', mockBusinessId), {
      userId: 'demo_user_123',
      name: 'Amazing Pizza Palace (MOCK)',
      description: 'The best pizza in town - Mock data for demo',
      category: 'restaurant',
      industry: 'food_service',
      address: '456 Mock Street',
      city: 'Demo City',
      state: 'NY',
      country: 'USA',
      postalCode: '10002',
      phone: '+1555123456',
      website: 'https://mock-pizza-palace.com',
      email: 'mock@pizzapalace.com',
      location: {
        latitude: 40.7589,
        longitude: -73.9851
      },
      platformIds: {
        google: 'mock_google_id_123',
        yelp: 'mock_yelp_id_456',
        facebook: 'mock_facebook_id_789'
      },
      businessHours: {
        monday: { open: '11:00', close: '23:00', closed: false },
        tuesday: { open: '11:00', close: '23:00', closed: false },
        wednesday: { open: '11:00', close: '23:00', closed: false },
        thursday: { open: '11:00', close: '23:00', closed: false },
        friday: { open: '11:00', close: '24:00', closed: false },
        saturday: { open: '11:00', close: '24:00', closed: false },
        sunday: { open: '12:00', close: '22:00', closed: false }
      },
      specialties: ['New York Style Pizza', 'Italian Cuisine', 'Family Dining'],
      brandVoice: 'friendly',
      isActive: true,
      verificationStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Created mock business');

    // 2. Create MOCK reviews with variety
    const mockReviews = [
      {
        id: 'MOCK_review_1',
        businessId: mockBusinessId,
        platform: 'google',
        platformReviewId: 'MOCK_google_review_1',
        platformUrl: 'https://maps.google.com/mock_review_1',
        rating: 5,
        title: 'Outstanding pizza!',
        text: 'This place is absolutely amazing! The pizza was perfectly cooked, crispy crust, fresh toppings. Service was friendly and fast. Definitely coming back!',
        author: {
          name: 'Jennifer Smith',
          username: 'jsmith2024',
          avatarUrl: '',
          location: 'Manhattan, NY',
          reviewCount: 47
        },
        reviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastUpdatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        flagging: {
          isFlagged: false,
          reason: null,
          keywords: [],
          flaggedAt: null
        },
        analysis: {
          sentimentScore: 0.95,
          sentimentLabel: 'positive',
          emotionTags: ['happy', 'satisfied', 'excited'],
          languageDetected: 'en',
          isSpam: false,
          spamConfidence: 0.02,
          wordCount: 31
        },
        metadata: {
          helpfulVotes: 5,
          totalVotes: 6,
          isVerifiedPurchase: true,
          hasPhotos: false,
          hasVideo: false
        },
        response: {
          hasResponse: true,
          responseCount: 1,
          lastResponseAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        isArchived: false,
        priorityScore: 3,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'MOCK_review_2',
        businessId: mockBusinessId,
        platform: 'yelp',
        platformReviewId: 'MOCK_yelp_review_1',
        platformUrl: 'https://yelp.com/mock_review_1',
        rating: 2,
        title: 'Very disappointed',
        text: 'Waited over an hour for our order and when it finally arrived, the pizza was cold and soggy. The staff seemed overwhelmed and unfriendly. For the price we paid, this was completely unacceptable.',
        author: {
          name: 'Robert Chen',
          username: 'robchen88',
          avatarUrl: '',
          location: 'Brooklyn, NY',
          reviewCount: 128
        },
        reviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        lastUpdatedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        flagging: {
          isFlagged: true,
          reason: 'low_rating',
          keywords: ['cold', 'soggy', 'unfriendly', 'unacceptable'],
          flaggedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        analysis: {
          sentimentScore: -0.8,
          sentimentLabel: 'negative',
          emotionTags: ['disappointed', 'frustrated', 'angry'],
          languageDetected: 'en',
          isSpam: false,
          spamConfidence: 0.05,
          wordCount: 41
        },
        metadata: {
          helpfulVotes: 8,
          totalVotes: 10,
          isVerifiedPurchase: true,
          hasPhotos: false,
          hasVideo: false
        },
        response: {
          hasResponse: false,
          responseCount: 0,
          lastResponseAt: null
        },
        isArchived: false,
        priorityScore: 9,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'MOCK_review_3',
        businessId: mockBusinessId,
        platform: 'facebook',
        platformReviewId: 'MOCK_facebook_review_1',
        platformUrl: 'https://facebook.com/mock_review_1',
        rating: 4,
        title: 'Good pizza, nice atmosphere',
        text: 'Solid pizza place with great atmosphere. The margherita pizza was delicious and the service was attentive. Only complaint is that it gets quite loud during peak hours.',
        author: {
          name: 'Maria Rodriguez',
          username: 'maria.rodriguez',
          avatarUrl: '',
          location: 'Queens, NY',
          reviewCount: 23
        },
        reviewDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        lastUpdatedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        flagging: {
          isFlagged: false,
          reason: null,
          keywords: [],
          flaggedAt: null
        },
        analysis: {
          sentimentScore: 0.7,
          sentimentLabel: 'positive',
          emotionTags: ['satisfied', 'pleased'],
          languageDetected: 'en',
          isSpam: false,
          spamConfidence: 0.01,
          wordCount: 35
        },
        metadata: {
          helpfulVotes: 3,
          totalVotes: 4,
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
        priorityScore: 5,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'MOCK_review_4',
        businessId: mockBusinessId,
        platform: 'google',
        platformReviewId: 'MOCK_google_review_2',
        platformUrl: 'https://maps.google.com/mock_review_2',
        rating: 1,
        title: 'Terrible experience',
        text: 'WORST PIZZA EVER! The crust was burnt, toppings were stale, and the cheese tasted like plastic. The place was dirty and the staff was rude. Save your money and go somewhere else!',
        author: {
          name: 'Alex Thompson',
          username: 'alexthompson',
          avatarUrl: '',
          location: 'Bronx, NY',
          reviewCount: 89
        },
        reviewDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        lastUpdatedDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
        flagging: {
          isFlagged: true,
          reason: 'urgent_keywords',
          keywords: ['WORST', 'EVER', 'terrible', 'burnt', 'dirty', 'rude'],
          flaggedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        analysis: {
          sentimentScore: -0.95,
          sentimentLabel: 'negative',
          emotionTags: ['angry', 'disgusted', 'frustrated'],
          languageDetected: 'en',
          isSpam: false,
          spamConfidence: 0.15,
          wordCount: 37
        },
        metadata: {
          helpfulVotes: 2,
          totalVotes: 3,
          isVerifiedPurchase: true,
          hasPhotos: false,
          hasVideo: false
        },
        response: {
          hasResponse: false,
          responseCount: 0,
          lastResponseAt: null
        },
        isArchived: false,
        priorityScore: 10,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: 'MOCK_review_5',
        businessId: mockBusinessId,
        platform: 'yelp',
        platformReviewId: 'MOCK_yelp_review_2',
        platformUrl: 'https://yelp.com/mock_review_2',
        rating: 5,
        title: 'Best pizza in the city!',
        text: 'I\'ve been coming here for years and they never disappoint! The pepperoni pizza is phenomenal, the staff knows me by name, and the prices are reasonable. Highly recommend!',
        author: {
          name: 'David Kim',
          username: 'davidkim_nyc',
          avatarUrl: '',
          location: 'Manhattan, NY',
          reviewCount: 156
        },
        reviewDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        lastUpdatedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        flagging: {
          isFlagged: false,
          reason: null,
          keywords: [],
          flaggedAt: null
        },
        analysis: {
          sentimentScore: 0.9,
          sentimentLabel: 'positive',
          emotionTags: ['happy', 'loyal', 'satisfied'],
          languageDetected: 'en',
          isSpam: false,
          spamConfidence: 0.03,
          wordCount: 33
        },
        metadata: {
          helpfulVotes: 12,
          totalVotes: 13,
          isVerifiedPurchase: true,
          hasPhotos: true,
          hasVideo: false
        },
        response: {
          hasResponse: true,
          responseCount: 1,
          lastResponseAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        isArchived: false,
        priorityScore: 2,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];

    // Create all mock reviews
    for (const review of mockReviews) {
      await setDoc(doc(db, 'reviews', review.id), review);
    }

    console.log('✅ Created 5 mock reviews');

    // 3. Create MOCK responses for reviews that have responses
    const mockResponses = [
      {
        reviewId: 'MOCK_review_1',
        businessId: mockBusinessId,
        userId: 'demo_user_123',
        responseText: 'Thank you so much Jennifer! We\'re thrilled you enjoyed our pizza and service. Reviews like yours make our day! We look forward to serving you again soon. 🍕',
        responseType: 'manual',
        aiGeneration: null,
        template: null,
        publishing: {
          isPublished: true,
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'published',
          error: null,
          platformResponseId: 'MOCK_google_response_1',
          platformResponseUrl: 'https://maps.google.com/mock_response_1'
        },
        performance: {
          helpfulVotes: 3,
          totalVotes: 3
        },
        editCount: 0,
        lastEditedAt: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        reviewId: 'MOCK_review_5',
        businessId: mockBusinessId,
        userId: 'demo_user_123',
        responseText: 'David, you\'re amazing! Thank you for being such a loyal customer over the years. It means the world to us that you trust us with your pizza cravings. See you soon!',
        responseType: 'ai_generated',
        aiGeneration: {
          provider: 'claude',
          confidence: 0.92,
          promptVersion: 'v2.1',
          generationTimeMs: 750,
          alternatives: [
            'Thank you for your loyalty, David!',
            'We appreciate your continued support!'
          ]
        },
        template: null,
        publishing: {
          isPublished: true,
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: 'published',
          error: null,
          platformResponseId: 'MOCK_yelp_response_1',
          platformResponseUrl: 'https://yelp.com/mock_response_1'
        },
        performance: {
          helpfulVotes: 7,
          totalVotes: 8
        },
        editCount: 1,
        lastEditedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const response of mockResponses) {
      await addDoc(collection(db, 'review_responses'), response);
    }

    console.log('✅ Created 2 mock responses');

    // 4. Create MOCK daily stats
    const today = new Date().toISOString().split('T')[0];
    await setDoc(doc(db, 'daily_stats', `MOCK_${mockBusinessId}_${today}`), {
      businessId: mockBusinessId,
      date: today,
      reviews: {
        total: 5,
        new: 1,
        avgRating: 3.4,
        ratingDistribution: {
          "1": 1,
          "2": 1,
          "3": 0,
          "4": 1,
          "5": 2
        }
      },
      platforms: {
        google: { count: 2, avgRating: 3.0 },
        yelp: { count: 2, avgRating: 3.5 },
        facebook: { count: 1, avgRating: 4.0 }
      },
      responses: {
        total: 2,
        new: 0,
        avgResponseTime: 18.5,
        responseRate: 0.40
      },
      alerts: {
        triggered: 2,
        resolved: 0,
        pending: 2
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Created mock daily stats');

    // 5. Create MOCK alert settings
    await setDoc(doc(db, 'alert_settings', mockBusinessId), {
      businessId: mockBusinessId,
      thresholds: {
        minRating: 3,
        keywords: ['terrible', 'horrible', 'worst', 'awful', 'rude', 'dirty']
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
    });

    console.log('✅ Created mock alert settings');

    console.log('\n🎉 Mock data creation completed!');
    console.log('📊 Created:');
    console.log('   - 1 Mock business (Amazing Pizza Palace)');
    console.log('   - 5 Mock reviews (1★ to 5★ across Google, Yelp, Facebook)');
    console.log('   - 2 Mock responses');
    console.log('   - 1 Mock daily stats');
    console.log('   - 1 Mock alert settings');
    console.log('\n🏷️  All mock data is prefixed with "MOCK_" for easy identification');
    console.log('🗑️  To delete: Use Firebase console and filter by "MOCK_"');

  } catch (error) {
    console.error('❌ Error creating mock data:', error);
  }
}

// Run the script
createMockData().then(() => {
  console.log('\n✅ Script completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
