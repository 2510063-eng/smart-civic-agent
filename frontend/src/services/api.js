/**
 * Smart Civic Issue Resolution Agent - API Service Layer
 * 
 * Centralizes all backend communication. All endpoints adhere strictly to
 * docs/API_CONTRACT.md and backend/app/schemas.py.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Internal fetch helper that handles JSON serialization and error parsing.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMessage = 'Request failed';
      let errorCode = 'HTTP_ERROR';

      if (data) {
        if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = typeof data.detail === 'string' 
            ? data.detail 
            : data.detail.error || JSON.stringify(data.detail);
          errorCode = data.detail.code || errorCode;
        } else if (data.message) {
          errorMessage = data.message;
        }
        if (data.code) {
          errorCode = data.code;
        }
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new ApiError(errorMessage, errorCode, response.status);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or CORS error
    throw new ApiError(
      err.message || 'Unable to connect to civic backend server. Please verify backend is running.',
      'NETWORK_ERROR',
      0
    );
  }
}

/**
 * 1. AI Analysis
 * POST /api/ai/analyze
 */
export async function analyzeIssue({
  complaintId,
  description,
  imageUrl = null,
  latitude = null,
  longitude = null,
}) {
  const payload = {
    complaint_id: complaintId || `TEMP-${Date.now()}`,
    description,
    image_url: imageUrl || null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  };

  return request('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 2. Submit Complaint
 * POST /api/complaints?auto_process=true
 */
export async function submitComplaint({
  description,
  title = null,
  imageUrl = null,
  latitude = null,
  longitude = null,
  locationText = null,
  address = null,
  citizenId = 'CIT001',
  autoProcess = true,
}) {
  const payload = {
    description,
    title: title || null,
    image_url: imageUrl || null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    location_text: locationText || null,
    address: address || null,
    citizen_id: citizenId || 'CIT001',
  };

  const endpoint = `/api/complaints?auto_process=${autoProcess ? 'true' : 'false'}`;
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 3. Get Complaint Details
 * GET /api/complaints/{complaint_id}
 */
export async function getComplaint(complaintId) {
  if (!complaintId) {
    throw new ApiError('Complaint ID is required', 'INVALID_INPUT', 400);
  }
  const cleanId = encodeURIComponent(complaintId.trim().toUpperCase());
  return request(`/api/complaints/${cleanId}`);
}

/**
 * 4. Get Agent Action History
 * GET /api/agent/actions/{complaint_id}
 */
export async function getAgentActions(complaintId) {
  if (!complaintId) {
    throw new ApiError('Complaint ID is required', 'INVALID_INPUT', 400);
  }
  const cleanId = encodeURIComponent(complaintId.trim().toUpperCase());
  return request(`/api/agent/actions/${cleanId}`);
}

export default {
  analyzeIssue,
  submitComplaint,
  getComplaint,
  getAgentActions,
};
