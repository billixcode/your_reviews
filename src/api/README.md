# Your Reviews API Documentation

Complete CRUD API functions for all Firestore collections in the review management system.

## 🚀 Quick Start

```javascript
// Import individual functions
import { createUser, getBusinessReviews, createResponse } from './api/index.js';

// Or import the comprehensive API object
import { API } from './api/index.js';

// Create a user
const user = await createUser({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
}, 'user123');

// Get business reviews
const reviews = await getBusinessReviews('business123', {
  platform: 'google',
  flagged: true,
  limit: 25
});
```

## 📁 API Structure

```
src/api/
├── base.js              # Base CRUD class and utilities
├── users.js             # User management & sessions
├── businesses.js        # Business profiles & team members
├── reviews.js           # Review management & flagging
├── responses.js         # Review responses & AI metrics
├── templates.js         # Response templates
├── integrations.js      # Platform integrations & sync logs
├── subscriptions.js     # Plans & billing
├── notifications.js     # Alerts & settings
├── analytics.js         # Daily/monthly stats & reporting
├── index.js             # Main export file
└── README.md            # This documentation
```

## 🔧 Core Features

### Base CRUD Operations
All APIs inherit from `BaseCRUD` class providing:
- ✅ **Create** - Add new documents with validation
- ✅ **Read** - Get single documents or paginated collections
- ✅ **Update** - Modify existing documents
- ✅ **Delete** - Hard delete or soft delete (mark inactive)
- ✅ **Search** - Filter and query with multiple criteria
- ✅ **Batch Operations** - Create, update, or delete multiple documents
- ✅ **Error Handling** - Consistent error responses
- ✅ **Validation** - Required field and data type validation

### Advanced Features
- 🔍 **Pagination** - Efficient cursor-based pagination
- 🏷️ **Filtering** - Complex queries with multiple filters
- 📊 **Aggregation** - Count and statistics functions
- 🔐 **Security** - Permission checking and ownership validation
- 📝 **Audit Trail** - Automatic timestamps and edit tracking
- 🚀 **Performance** - Optimized queries with proper indexing

## 📚 API Reference

### 👥 Users API (`users.js`)

**Core Functions:**
- `createUser(userData, userId)` - Create new user profile
- `getUserById(userId)` - Get user by ID
- `getUserByEmail(email)` - Find user by email
- `updateUserProfile(userId, data)` - Update profile information
- `verifyUserEmail(userId)` - Mark email as verified
- `completeUserOnboarding(userId, data)` - Complete onboarding

**Session Management:**
- `createUserSession(userId, sessionData)` - Create login session
- `getUserSessions(userId)` - Get active sessions
- `revokeUserSession(userId, sessionId)` - Revoke single session
- `revokeAllUserSessions(userId)` - Revoke all sessions

**Admin Functions:**
- `getActiveUsers(options)` - List active users
- `searchUsers(searchTerm, options)` - Search users by name/email
- `getUserStats()` - Get user statistics

### 🏢 Businesses API (`businesses.js`)

**Business Management:**
- `createBusiness(businessData, userId)` - Create new business
- `getBusinessById(businessId)` - Get business details
- `getBusinessesByUser(userId, options)` - Get user's businesses
- `updateBusiness(businessId, data, userId)` - Update business profile
- `verifyBusiness(businessId, data)` - Mark business as verified
- `searchBusinesses(searchTerm, options)` - Search businesses

**Team Management:**
- `addTeamMember(businessId, memberData, currentUserId)` - Add team member
- `getTeamMembers(businessId, options)` - Get team members
- `updateTeamMember(businessId, memberId, data, currentUserId)` - Update member
- `removeTeamMember(businessId, memberId, currentUserId)` - Remove member
- `checkBusinessAccess(businessId, userId)` - Check user permissions

### ⭐ Reviews API (`reviews.js`)

**Review Management:**
- `createReview(reviewData)` - Add new review (from platform sync)
- `getBusinessReviews(businessId, options)` - Get business reviews
- `getFlaggedReviews(businessId, options)` - Get flagged reviews
- `getReviewsNeedingResponse(businessId, options)` - Get unresponded reviews
- `getReviewStats(businessId, options)` - Get review statistics

**Review Actions:**
- `flagReview(reviewId, flagData)` - Flag review for attention
- `unflagReview(reviewId)` - Remove flag from review
- `archiveReview(reviewId)` - Archive old review
- `updateReviewAnalysis(reviewId, analysisData)` - Update AI analysis

**Media Management:**
- `addReviewMedia(reviewId, mediaData)` - Add photos/videos to review
- `getReviewMedia(reviewId)` - Get review media files

### 💬 Review Responses API (`responses.js`)

**Response Management:**
- `createResponse(responseData)` - Create new response
- `getBusinessResponses(businessId, options)` - Get business responses
- `updateResponseText(responseId, newText, userId)` - Edit response text
- `publishResponse(responseId, publishingData)` - Publish to platform
- `getResponseStats(businessId, options)` - Get response statistics

**AI & Analytics:**
- `getAIMetrics(businessId, options)` - Get AI generation metrics
- `getPendingResponses(businessId, options)` - Get unpublished responses
- `getFailedResponses(businessId, options)` - Get failed responses

### 📝 Response Templates API (`templates.js`)

**Template Management:**
- `createTemplate(templateData)` - Create new template
- `getBusinessTemplates(businessId, options)` - Get business templates
- `updateTemplate(templateId, data, userId)` - Update template
- `deleteTemplate(templateId, userId)` - Delete template

### 🔗 Platform Integrations API (`integrations.js`)

**Integration Management:**
- `createIntegration(integrationData)` - Connect platform (Google/Yelp/Facebook)
- `getBusinessIntegrations(businessId, options)` - Get integrations
- `updateIntegrationStatus(integrationId, status, error)` - Update connection status
- `updateSyncInfo(integrationId, syncData)` - Update sync information

**Sync Logs:**
- `addSyncLog(integrationId, logData)` - Add sync log entry
- `getSyncLogs(integrationId, options)` - Get sync history

### 💳 Subscriptions API (`subscriptions.js`)

**Subscription Plans:**
- `getAllPlans()` - Get available subscription plans
- `getPlanById(planId)` - Get plan details

**User Subscriptions:**
- `createSubscription(subscriptionData)` - Create user subscription
- `getUserSubscription(userId)` - Get user's subscription
- `updateSubscription(userId, updateData)` - Update subscription
- `cancelSubscription(userId, reason)` - Cancel subscription

**Billing:**
- `getBillingHistory(userId, options)` - Get billing history

### 🔔 Notifications API (`notifications.js`)

**Notification Management:**
- `createNotification(notificationData)` - Create new notification
- `getUserNotifications(userId, options)` - Get user notifications
- `markNotificationAsSent(notificationId, deliveryData)` - Mark as sent
- `markNotificationAsOpened(notificationId)` - Track open event

**Alert Settings:**
- `getAlertSettings(businessId)` - Get business alert settings
- `updateAlertSettings(businessId, settingsData)` - Update alert rules

### 📊 Analytics API (`analytics.js`)

**Statistics:**
- `createDailyStats(businessId, date, statsData)` - Create daily stats
- `getDailyStats(businessId, startDate, endDate)` - Get daily stats
- `getMonthlyStats(businessId, options)` - Get monthly stats
- `getBusinessOverview(businessId, days)` - Get business overview

**API Usage:**
- `updateApiUsage(userId, date, usageData)` - Update API usage
- `getApiUsage(userId, options)` - Get API usage history

## 🔍 Query Options

Most `get` functions support these options:

```javascript
const options = {
  // Pagination
  limit: 25,
  startAfter: lastDocumentSnapshot,
  
  // Sorting
  sortBy: 'createdAt',
  sortOrder: 'desc', // 'asc' or 'desc'
  
  // Filtering
  platform: 'google',
  status: 'active',
  flagged: true,
  
  // Date ranges
  startDate: '2024-01-01',
  endDate: '2024-12-31'
};
```

## 🔐 Security & Permissions

All APIs include built-in security:

- **Authentication Required** - All operations require valid user ID
- **Ownership Validation** - Users can only access their own data
- **Team Access Control** - Business team members have appropriate permissions
- **Input Validation** - All data is validated before database operations
- **Error Handling** - Consistent error responses with proper status codes

## 🚀 Performance Features

- **Efficient Queries** - Optimized with proper Firestore indexes
- **Pagination** - Cursor-based pagination for large datasets
- **Batch Operations** - Multiple operations in single request
- **Caching Ready** - Responses formatted for easy caching
- **Rate Limiting** - Built-in usage tracking

## 📝 Error Handling

All API functions return consistent response format:

```javascript
// Success Response
{
  success: true,
  message: "Operation completed successfully",
  data: { ... },
  timestamp: "2024-08-22T15:30:00.000Z"
}

// Error Response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Missing required fields: email, firstName",
    statusCode: 400
  },
  timestamp: "2024-08-22T15:30:00.000Z"
}
```

## 🧪 Usage Examples

### Complete User Flow Example

```javascript
import { API } from './api/index.js';

// 1. Create user
const user = await API.users.createUser({
  email: 'restaurant@example.com',
  firstName: 'Restaurant',
  lastName: 'Owner'
}, 'user123');

// 2. Create business
const business = await API.businesses.createBusiness({
  userId: 'user123',
  name: 'Amazing Restaurant',
  category: 'restaurant',
  address: '123 Main St',
  city: 'New York'
});

// 3. Create Google integration
const integration = await API.integrations.createIntegration({
  businessId: business.data.id,
  platform: 'google',
  platformBusinessId: 'ChIJN1t_tDeuEmsRUsoyG83frY4'
});

// 4. Add sample review
const review = await API.reviews.createReview({
  businessId: business.data.id,
  platform: 'google',
  platformReviewId: 'google_123',
  rating: 2,
  text: 'Service was terrible and food was cold',
  author: {
    name: 'Unhappy Customer',
    username: 'unhappy123'
  }
});

// 5. Create AI response
const response = await API.responses.createResponse({
  reviewId: review.data.id,
  businessId: business.data.id,
  userId: 'user123',
  responseText: 'We sincerely apologize for your experience...',
  responseType: 'ai_generated',
  aiProvider: 'claude',
  aiConfidence: 0.9
});

// 6. Get business analytics
const analytics = await API.analytics.getBusinessOverview(business.data.id, 30);
```

## 🔧 Development & Testing

To test the APIs:

1. **Setup Firebase** - Ensure Firebase is configured with proper rules
2. **Authentication** - Set up Firebase Auth for user management
3. **Test Data** - Use the provided sample data for testing
4. **Error Testing** - Test validation and permission errors
5. **Performance** - Test with large datasets for pagination

---

**🎯 Your comprehensive API layer is ready for building the review management application!**
