// =====================================================
// SUBSCRIPTIONS API - CRUD Operations
// Handles subscription plans and user billing
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

class SubscriptionsAPI extends BaseCRUD {
  constructor() {
    super('user_subscriptions');
    this.plansCollection = new BaseCRUD('subscription_plans');
  }

  // =====================================================
  // SUBSCRIPTION PLANS
  // =====================================================

  async getAllPlans() {
    try {
      const filters = [{ field: 'isActive', operator: '==', value: true }];
      return await this.plansCollection.getWhere(filters, {
        orderByField: 'sortOrder',
        orderDirection: 'asc'
      });
    } catch (error) {
      throw error;
    }
  }

  async getPlanById(planId) {
    try {
      return await this.plansCollection.getById(planId);
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // USER SUBSCRIPTIONS
  // =====================================================

  async createSubscription(subscriptionData) {
    try {
      validateRequired(subscriptionData, ['userId', 'planId', 'billingCycle']);

      const subscriptionDoc = {
        userId: subscriptionData.userId,
        planId: subscriptionData.planId,
        stripeCustomerId: subscriptionData.stripeCustomerId || null,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId || null,
        stripePaymentMethodId: subscriptionData.stripePaymentMethodId || null,
        status: subscriptionData.status || 'trialing',
        billingCycle: subscriptionData.billingCycle,
        currentPeriodStart: subscriptionData.currentPeriodStart || serverTimestamp(),
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
        trialStart: subscriptionData.trialStart,
        trialEnd: subscriptionData.trialEnd,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        cancellationReason: '',
        currentLocationsCount: 0,
        currentResponsesCount: 0,
        responsesResetDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      return await this.create(subscriptionDoc, subscriptionData.userId);
    } catch (error) {
      throw error;
    }
  }

  async getUserSubscription(userId) {
    try {
      return await this.getById(userId);
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateSubscription(userId, updateData) {
    try {
      const allowedFields = [
        'planId', 'status', 'billingCycle', 'currentPeriodStart', 'currentPeriodEnd',
        'stripeCustomerId', 'stripeSubscriptionId', 'stripePaymentMethodId',
        'cancelAtPeriodEnd', 'cancellationReason'
      ];

      const filteredData = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      return await this.update(userId, filteredData);
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscription(userId, reason = '') {
    try {
      return await this.update(userId, {
        canceledAt: serverTimestamp(),
        cancelAtPeriodEnd: true,
        cancellationReason: reason
      });
    } catch (error) {
      throw error;
    }
  }

  async reactivateSubscription(userId) {
    try {
      return await this.update(userId, {
        status: 'active',
        canceledAt: null,
        cancelAtPeriodEnd: false,
        cancellationReason: ''
      });
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // BILLING HISTORY SUBCOLLECTION
  // =====================================================

  async addBillingRecord(userId, billingData) {
    try {
      validateRequired(billingData, ['amount', 'currency', 'status']);

      const billingDoc = {
        stripeInvoiceId: billingData.stripeInvoiceId || null,
        amount: billingData.amount,
        currency: billingData.currency,
        status: billingData.status,
        invoicePdfUrl: billingData.invoicePdfUrl || null,
        description: billingData.description || '',
        billingDate: billingData.billingDate || serverTimestamp(),
        paidDate: billingData.paidDate || null,
        createdAt: serverTimestamp()
      };

      const billingRef = collection(db, 'user_subscriptions', userId, 'billing_history');
      const docRef = await addDoc(billingRef, billingDoc);
      
      return { id: docRef.id, ...billingDoc };
    } catch (error) {
      throw error;
    }
  }

  async getBillingHistory(userId, options = {}) {
    try {
      const billingRef = collection(db, 'user_subscriptions', userId, 'billing_history');
      const q = query(billingRef, orderBy('billingDate', 'desc'));

      const querySnapshot = await getDocs(q);
      const history = [];
      
      querySnapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });

      return history;
    } catch (error) {
      throw error;
    }
  }
}

const subscriptionsAPI = new SubscriptionsAPI();

export const getAllPlans = async () => {
  try {
    const result = await subscriptionsAPI.getAllPlans();
    return formatResponse(result, 'Subscription plans retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getPlanById = async (planId) => {
  try {
    const result = await subscriptionsAPI.getPlanById(planId);
    return formatResponse(result, 'Plan retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const createSubscription = async (subscriptionData) => {
  try {
    const result = await subscriptionsAPI.createSubscription(subscriptionData);
    return formatResponse(result, 'Subscription created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getUserSubscription = async (userId) => {
  try {
    const result = await subscriptionsAPI.getUserSubscription(userId);
    return formatResponse(result, 'User subscription retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateSubscription = async (userId, updateData) => {
  try {
    const result = await subscriptionsAPI.updateSubscription(userId, updateData);
    return formatResponse(result, 'Subscription updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const cancelSubscription = async (userId, reason) => {
  try {
    const result = await subscriptionsAPI.cancelSubscription(userId, reason);
    return formatResponse(result, 'Subscription canceled successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getBillingHistory = async (userId, options) => {
  try {
    const result = await subscriptionsAPI.getBillingHistory(userId, options);
    return formatResponse(result, 'Billing history retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export default subscriptionsAPI;
