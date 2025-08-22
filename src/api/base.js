// =====================================================
// BASE API UTILITIES
// Common functions and error handling for all CRUD operations
// =====================================================

import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase-config.js';

// =====================================================
// ERROR HANDLING
// =====================================================

export class APIError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const handleFirebaseError = (error) => {
  console.error('Firebase Error:', error);
  
  switch (error.code) {
    case 'permission-denied':
      throw new APIError('Permission denied', 'PERMISSION_DENIED', 403);
    case 'not-found':
      throw new APIError('Document not found', 'NOT_FOUND', 404);
    case 'already-exists':
      throw new APIError('Document already exists', 'ALREADY_EXISTS', 409);
    case 'invalid-argument':
      throw new APIError('Invalid argument provided', 'INVALID_ARGUMENT', 400);
    case 'unauthenticated':
      throw new APIError('User not authenticated', 'UNAUTHENTICATED', 401);
    default:
      throw new APIError('Internal server error', 'INTERNAL_ERROR', 500);
  }
};

// =====================================================
// VALIDATION HELPERS
// =====================================================

export const validateRequired = (data, requiredFields) => {
  const missing = requiredFields.filter(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], data);
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    throw new APIError(`Missing required fields: ${missing.join(', ')}`, 'VALIDATION_ERROR', 400);
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new APIError('Invalid email format', 'VALIDATION_ERROR', 400);
  }
};

export const validateObjectId = (id) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new APIError('Invalid document ID', 'VALIDATION_ERROR', 400);
  }
};

// =====================================================
// PAGINATION HELPERS
// =====================================================

export const createPaginatedQuery = (collectionRef, options = {}) => {
  const {
    orderByField = 'createdAt',
    orderDirection = 'desc',
    limitCount = 25,
    startAfterDoc = null,
    filters = []
  } = options;

  let q = query(collectionRef);

  // Apply filters
  filters.forEach(filter => {
    if (filter.operator === 'array-contains') {
      q = query(q, where(filter.field, 'array-contains', filter.value));
    } else {
      q = query(q, where(filter.field, filter.operator, filter.value));
    }
  });

  // Apply ordering
  q = query(q, orderBy(orderByField, orderDirection));

  // Apply pagination
  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  q = query(q, limit(limitCount));

  return q;
};

// =====================================================
// BASE CRUD OPERATIONS
// =====================================================

export class BaseCRUD {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  // CREATE
  async create(data, customId = null) {
    try {
      validateRequired(data, ['createdAt']);
      
      const docData = {
        ...data,
        createdAt: data.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (customId) {
        validateObjectId(customId);
        const docRef = doc(this.collectionRef, customId);
        await setDoc(docRef, docData);
        return { id: customId, ...docData };
      } else {
        const docRef = await addDoc(this.collectionRef, docData);
        return { id: docRef.id, ...docData };
      }
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  // READ (single document)
  async getById(id) {
    try {
      validateObjectId(id);
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new APIError('Document not found', 'NOT_FOUND', 404);
      }
      
      return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  // READ (multiple documents with pagination)
  async getAll(options = {}) {
    try {
      const q = createPaginatedQuery(this.collectionRef, options);
      const querySnapshot = await getDocs(q);
      
      const documents = [];
      querySnapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });

      return {
        documents,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === (options.limitCount || 25)
      };
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  // READ (with filters)
  async getWhere(filters, options = {}) {
    try {
      const q = createPaginatedQuery(this.collectionRef, { ...options, filters });
      const querySnapshot = await getDocs(q);
      
      const documents = [];
      querySnapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });

      return {
        documents,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === (options.limitCount || 25)
      };
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  // UPDATE
  async update(id, data) {
    try {
      validateObjectId(id);
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const docRef = doc(this.collectionRef, id);
      await updateDoc(docRef, updateData);
      
      // Return updated document
      return await this.getById(id);
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  // DELETE
  async delete(id) {
    try {
      validateObjectId(id);
      
      // Check if document exists first
      await this.getById(id);
      
      const docRef = doc(this.collectionRef, id);
      await deleteDoc(docRef);
      
      return { success: true, id };
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  // SOFT DELETE (mark as inactive)
  async softDelete(id) {
    try {
      return await this.update(id, { 
        isActive: false, 
        deletedAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  // COUNT documents
  async count(filters = []) {
    try {
      const q = createPaginatedQuery(this.collectionRef, { 
        filters, 
        limitCount: 1000 // Firestore limit for count queries
      });
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  // BATCH OPERATIONS
  async batchCreate(documents) {
    try {
      const results = [];
      for (const doc of documents) {
        const result = await this.create(doc);
        results.push(result);
      }
      return results;
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  async batchUpdate(updates) {
    try {
      const results = [];
      for (const { id, data } of updates) {
        const result = await this.update(id, data);
        results.push(result);
      }
      return results;
    } catch (error) {
      handleFirebaseError(error);
    }
  }

  async batchDelete(ids) {
    try {
      const results = [];
      for (const id of ids) {
        const result = await this.delete(id);
        results.push(result);
      }
      return results;
    } catch (error) {
      handleFirebaseError(error);
    }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export const sanitizeData = (data) => {
  const sanitized = { ...data };
  
  // Remove undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  
  return sanitized;
};

export const formatResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

export const formatError = (error) => {
  return {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      statusCode: error.statusCode || 500
    },
    timestamp: new Date().toISOString()
  };
};

export default BaseCRUD;
