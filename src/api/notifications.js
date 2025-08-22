// =====================================================
// NOTIFICATIONS API - CRUD Operations
// Handles system alerts and user notifications
// =====================================================

import { 
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import BaseCRUD, { validateRequired, APIError, formatResponse, formatError } from './base.js';

class NotificationsAPI extends BaseCRUD {
  constructor() {
    super('notifications');
    this.alertSettings = new BaseCRUD('alert_settings');
  }

  // Create notification
  async createNotification(notificationData) {
    try {
      validateRequired(notificationData, ['userId', 'type', 'channel', 'title', 'message']);

      const notificationDoc = {
        userId: notificationData.userId,
        businessId: notificationData.businessId || null,
        reviewId: notificationData.reviewId || null,
        type: notificationData.type, // review_alert, response_reminder, weekly_summary
        channel: notificationData.channel, // email, sms, in_app, slack, webhook
        title: notificationData.title,
        message: notificationData.message,
        actionUrl: notificationData.actionUrl || null,
        
        delivery: {
          status: 'pending', // pending, sent, failed, canceled
          attempts: 0,
          lastAttemptAt: null,
          sentAt: null,
          error: null
        },
        
        external: {
          messageId: null,
          providerId: null
        },
        
        interaction: {
          openedAt: null,
          clickedAt: null,
          dismissedAt: null
        },
        
        createdAt: serverTimestamp()
      };

      return await this.create(notificationDoc);
    } catch (error) {
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      const filters = [
        { field: 'userId', operator: '==', value: userId }
      ];

      if (options.type) {
        filters.push({ field: 'type', operator: '==', value: options.type });
      }

      if (options.channel) {
        filters.push({ field: 'channel', operator: '==', value: options.channel });
      }

      if (options.status) {
        filters.push({ field: 'delivery.status', operator: '==', value: options.status });
      }

      return await this.getWhere(filters, {
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: options.limit || 50,
        startAfterDoc: options.startAfter || null
      });
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as sent
  async markAsSent(notificationId, deliveryData) {
    try {
      return await this.update(notificationId, {
        'delivery.status': 'sent',
        'delivery.sentAt': serverTimestamp(),
        'delivery.attempts': increment(1),
        'delivery.lastAttemptAt': serverTimestamp(),
        'external.messageId': deliveryData.messageId || null,
        'external.providerId': deliveryData.providerId || null
      });
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as failed
  async markAsFailed(notificationId, error) {
    try {
      return await this.update(notificationId, {
        'delivery.status': 'failed',
        'delivery.attempts': increment(1),
        'delivery.lastAttemptAt': serverTimestamp(),
        'delivery.error': error.message || 'Unknown error'
      });
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as opened
  async markAsOpened(notificationId) {
    try {
      return await this.update(notificationId, {
        'interaction.openedAt': serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as clicked
  async markAsClicked(notificationId) {
    try {
      return await this.update(notificationId, {
        'interaction.clickedAt': serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  // Dismiss notification
  async dismissNotification(notificationId) {
    try {
      return await this.update(notificationId, {
        'interaction.dismissedAt': serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  // Get alert settings
  async getAlertSettings(businessId) {
    try {
      return await this.alertSettings.getById(businessId);
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  // Update alert settings
  async updateAlertSettings(businessId, settingsData) {
    try {
      const allowedFields = ['thresholds', 'notifications', 'timing', 'alertRules', 'team'];
      
      const updateData = {};
      allowedFields.forEach(field => {
        if (settingsData[field] !== undefined) {
          updateData[field] = settingsData[field];
        }
      });

      return await this.alertSettings.update(businessId, updateData);
    } catch (error) {
      throw error;
    }
  }
}

const notificationsAPI = new NotificationsAPI();

export const createNotification = async (notificationData) => {
  try {
    const result = await notificationsAPI.createNotification(notificationData);
    return formatResponse(result, 'Notification created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getUserNotifications = async (userId, options) => {
  try {
    const result = await notificationsAPI.getUserNotifications(userId, options);
    return formatResponse(result, 'Notifications retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const markNotificationAsSent = async (notificationId, deliveryData) => {
  try {
    const result = await notificationsAPI.markAsSent(notificationId, deliveryData);
    return formatResponse(result, 'Notification marked as sent successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const markNotificationAsFailed = async (notificationId, error) => {
  try {
    const result = await notificationsAPI.markAsFailed(notificationId, error);
    return formatResponse(result, 'Notification marked as failed successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const markNotificationAsOpened = async (notificationId) => {
  try {
    const result = await notificationsAPI.markAsOpened(notificationId);
    return formatResponse(result, 'Notification marked as opened successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getAlertSettings = async (businessId) => {
  try {
    const result = await notificationsAPI.getAlertSettings(businessId);
    return formatResponse(result, 'Alert settings retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateAlertSettings = async (businessId, settingsData) => {
  try {
    const result = await notificationsAPI.updateAlertSettings(businessId, settingsData);
    return formatResponse(result, 'Alert settings updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export default notificationsAPI;
