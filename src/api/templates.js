// =====================================================
// RESPONSE TEMPLATES API - CRUD Operations
// Handles reusable response templates for different scenarios
// =====================================================

import BaseCRUD, { validateRequired, APIError, formatResponse, formatError } from './base.js';

class ResponseTemplatesAPI extends BaseCRUD {
  constructor() {
    super('response_templates');
  }

  // Create new template
  async createTemplate(templateData) {
    try {
      validateRequired(templateData, ['userId', 'businessId', 'name', 'templateText', 'category']);

      const templateDoc = {
        userId: templateData.userId,
        businessId: templateData.businessId,
        name: templateData.name.trim(),
        description: templateData.description?.trim() || '',
        templateText: templateData.templateText.trim(),
        category: templateData.category, // positive, negative, neutral, specific_issue
        ratingRange: templateData.ratingRange || [1, 5],
        keywords: templateData.keywords || [],
        variables: templateData.variables || {},
        usageCount: 0,
        lastUsedAt: null,
        isActive: true,
        isDefault: templateData.isDefault || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await this.create(templateDoc);
    } catch (error) {
      throw error;
    }
  }

  // Get templates for a business
  async getBusinessTemplates(businessId, options = {}) {
    try {
      const filters = [
        { field: 'businessId', operator: '==', value: businessId },
        { field: 'isActive', operator: '==', value: true }
      ];

      if (options.category) {
        filters.push({ field: 'category', operator: '==', value: options.category });
      }

      return await this.getWhere(filters, {
        orderByField: options.sortBy || 'usageCount',
        orderDirection: 'desc',
        limitCount: options.limit || 50
      });
    } catch (error) {
      throw error;
    }
  }

  // Update template
  async updateTemplate(templateId, templateData, userId) {
    try {
      const template = await this.getById(templateId);
      if (template.userId !== userId) {
        throw new APIError('Permission denied', 'PERMISSION_DENIED', 403);
      }

      const allowedFields = ['name', 'description', 'templateText', 'category', 'ratingRange', 'keywords', 'variables', 'isDefault'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (templateData[field] !== undefined) {
          updateData[field] = templateData[field];
        }
      });

      return await this.update(templateId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Increment usage count
  async incrementUsage(templateId) {
    try {
      return await this.update(templateId, {
        usageCount: this.db.FieldValue.increment(1),
        lastUsedAt: new Date()
      });
    } catch (error) {
      throw error;
    }
  }
}

const templatesAPI = new ResponseTemplatesAPI();

export const createTemplate = async (templateData) => {
  try {
    const result = await templatesAPI.createTemplate(templateData);
    return formatResponse(result, 'Template created successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const getBusinessTemplates = async (businessId, options) => {
  try {
    const result = await templatesAPI.getBusinessTemplates(businessId, options);
    return formatResponse(result, 'Templates retrieved successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const updateTemplate = async (templateId, templateData, userId) => {
  try {
    const result = await templatesAPI.updateTemplate(templateId, templateData, userId);
    return formatResponse(result, 'Template updated successfully');
  } catch (error) {
    return formatError(error);
  }
};

export const deleteTemplate = async (templateId, userId) => {
  try {
    const template = await templatesAPI.getById(templateId);
    if (template.userId !== userId) {
      throw new APIError('Permission denied', 'PERMISSION_DENIED', 403);
    }
    
    const result = await templatesAPI.softDelete(templateId);
    return formatResponse(result, 'Template deleted successfully');
  } catch (error) {
    return formatError(error);
  }
};

export default templatesAPI;
