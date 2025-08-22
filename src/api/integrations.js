// =====================================================
// PLATFORM INTEGRATIONS API - CRUD Operations
// Handles Google, Yelp, Facebook platform connections
// =====================================================

import { 
  collection,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import BaseCRUD, { validateRequired, APIError, formatResponse, formatError } from './base.js';

class PlatformIntegrationsAPI extends BaseCRUD {
  constructor() {
    super('platform_integrations');
  }

  // Create new integration
  async createIntegration(integrationData) {
    try {
      validateRequired(integrationData, ['businessId', 'platform', 'platformBusinessId']);

      const integrationDoc = {
        businessId: integrationData.businessId,
        platform: integrationData.platform, // google, yelp, facebook, tripadvisor
        platformBusinessId: integrationData.platformBusinessId,
        platformName: integrationData.platformName || '',
        platformUrl: integrationData.platformUrl || '',
        
        // OAuth tokens (should be encrypted in production)
        accessToken: integrationData.accessToken || null,
        refreshToken: integrationData.refreshToken || null,
        tokenExpiresAt: integrationData.tokenExpiresAt || null,
        tokenScope: integrationData.tokenScope || [],
        
        // Integration status
        isActive: true,
        connectionStatus: 'connected', // connected, expired, error, disconnected
        lastError: null,
        
        // Sync tracking
        lastSyncAt: null,
        nextSyncAt: integrationData.nextSyncAt || new Date(Date.now() + 15 * 60 * 1000), // 15 min from now
        syncFrequencyMinutes: integrationData.syncFrequencyMinutes || 15,
        totalReviewsSynced: 0,
        
        // Platform-specific settings
        autoRespond: integrationData.autoRespond || false,
        responseDelayMinutes: integrationData.responseDelayMinutes || 0,
        platformSettings: integrationData.platformSettings || {},
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Create document with custom ID: {businessId}_{platform}
      const docId = `${integrationData.businessId}_${integrationData.platform}`;
      return await this.create(integrationDoc, docId);
    } catch (error) {
      throw error;
    }
  }

  // Get integrations for a business
  async getBusinessIntegrations(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId }
      ];

      if (options.platform) {
        filters.push({ field: 'platform', operator: '==', value: options.platform });
      }

      if (options.isActive !== undefined) {
        filters.push({ field: 'isActive', operator: '==', value: options.isActive });
      }

      return await this.getWhere(filters, {
        orderByField: 'createdAt',
        orderDirection: 'desc'
      });
    } catch (error) {
      throw error;
    }
  }

  // Update integration status
  async updateIntegrationStatus(integrationId, status, error = null) {
    try {
      const updateData = {
        connectionStatus: status,
        lastError: error,
        updatedAt: serverTimestamp()
      };

      if (status === 'error' || status === 'expired') {
        updateData.isActive = false;
      }

      return await this.update(integrationId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Update sync information
  async updateSyncInfo(integrationId, syncData) {
    try {
      const updateData = {
        lastSyncAt: serverTimestamp(),
        nextSyncAt: syncData.nextSyncAt || new Date(Date.now() + 15 * 60 * 1000),
        totalReviewsSynced: syncData.totalReviewsSynced || 0,
        updatedAt: serverTimestamp()
      };

      return await this.update(integrationId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Get integrations needing sync
  async getIntegrationsNeedingSync() {
    try {
      const now = new Date();
      const filters = [
        { field: 'isActive', operator: '==', value: true },
        { field: 'connectionStatus', operator: '==', value: 'connected' },
        { field: 'nextSyncAt', operator: '<=', value: now }
      ];

      return await this.getWhere(filters, {
        orderByField: 'nextSyncAt',
        orderDirection: 'asc',
        limitCount: 50
      });
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // SYNC LOGS SUBCOLLECTION
  // =====================================================

  async addSyncLog(integrationId, logData) {
    try {
      validateRequired(logData, ['syncType', 'status']);

      const logDoc = {
        syncType: logData.syncType, // manual, scheduled, webhook
        status: logData.status, // success, error, partial
        reviewsFound: logData.reviewsFound || 0,
        reviewsNew: logData.reviewsNew || 0,
        reviewsUpdated: logData.reviewsUpdated || 0,
        errorMessage: logData.errorMessage || null,
        errorDetails: logData.errorDetails || {},
        durationMs: logData.durationMs || 0,
        startedAt: logData.startedAt || serverTimestamp(),
        completedAt: serverTimestamp()
      };

      const logsRef = collection(db, 'platform_integrations', integrationId, 'sync_logs');
      const docRef = await addDoc(logsRef, logDoc);
      
      return { id: docRef.id, ...logDoc };
    } catch (error) {
      throw error;
    }
  }

  async getSyncLogs(integrationId, options = {}) {
    try {
      const logsRef = collection(db, 'platform_integrations', integrationId, 'sync_logs');
      const q = query(logsRef, orderBy('startedAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const logs = [];
      
      querySnapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() });
      });

      return logs.slice(0, options.limit || 50);
    } catch (error) {
      throw error;
    }
  }
}

const integrationsAPI = new PlatformIntegrationsAPI();

export const createIntegration = async (integrationData) => {
  try {
    const result = await integrationsAPI.createIntegration(integrationData);
    return formatResponse(result, 'Integration created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getBusinessIntegrations = async (businessId, options) => {
  try {
    const result = await integrationsAPI.getBusinessIntegrations(businessId, options);
    return formatResponse(result, 'Business integrations retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateIntegrationStatus = async (integrationId, status, error) => {
  try {
    const result = await integrationsAPI.updateIntegrationStatus(integrationId, status, error);
    return formatResponse(result, 'Integration status updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateSyncInfo = async (integrationId, syncData) => {
  try {
    const result = await integrationsAPI.updateSyncInfo(integrationId, syncData);
    return formatResponse(result, 'Sync info updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const addSyncLog = async (integrationId, logData) => {
  try {
    const result = await integrationsAPI.addSyncLog(integrationId, logData);
    return formatResponse(result, 'Sync log added successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getSyncLogs = async (integrationId, options) => {
  try {
    const result = await integrationsAPI.getSyncLogs(integrationId, options);
    return formatResponse(result, 'Sync logs retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export default integrationsAPI;
