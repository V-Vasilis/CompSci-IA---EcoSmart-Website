import {
  BinApiResponse,
  SchoolStatistics,
  PredictionResponse,
  AddItemRequest,
  AddItemResponse,
  ApiError,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base API client with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new ApiError(response.status, errorData.error);
    }

    // Handle CSV response
    if (response.headers.get('Content-Type')?.includes('text/csv')) {
      const text = await response.text();
      return text as unknown as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * API service for interacting with the backend
 */
export const api = {
  /**
   * Get all bins for a school
   */
  getSchoolBins: async (schoolId: number): Promise<BinApiResponse[]> => {
    return apiRequest<BinApiResponse[]>(`/api/schools/${schoolId}/bins`);
  },

  /**
   * Get detailed information about a specific bin
   */
  getBinDetails: async (binId: number): Promise<BinApiResponse> => {
    return apiRequest<BinApiResponse>(`/api/bins/${binId}`);
  },

  /**
   * Add a new waste item to a bin (from AI camera)
   */
  addWasteItem: async (binId: number, item: AddItemRequest): Promise<AddItemResponse> => {
    return apiRequest<AddItemResponse>(`/api/bins/${binId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  /**
   * Get capacity predictions for a bin
   */
  getBinPredictions: async (binId: number): Promise<PredictionResponse> => {
    return apiRequest<PredictionResponse>(`/api/bins/${binId}/predictions`);
  },

  /**
   * Get school-wide statistics
   */
  getSchoolStatistics: async (schoolId: number): Promise<SchoolStatistics> => {
    return apiRequest<SchoolStatistics>(`/api/schools/${schoolId}/statistics`);
  },

  /**
   * Export waste data as CSV
   */
  exportSchoolData: async (
    schoolId: number,
    startDate?: string,
    endDate?: string
  ): Promise<string> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const endpoint = `/api/export/${schoolId}${queryString ? `?${queryString}` : ''}`;

    return apiRequest<string>(endpoint);
  },
};

export { ApiError };
