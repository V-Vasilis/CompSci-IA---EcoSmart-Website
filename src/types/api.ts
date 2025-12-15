// API Response types that match the backend structure

export interface WasteItem {
  id: number;
  binId: number;
  wasteType: string;
  category: 'Paper' | 'Plastic' | 'General';
  imageUrl: string;
  timestamp: string; // ISO format
  recyclable: boolean;
  recyclingInstructions?: string;
}

export interface WasteComposition {
  Paper?: number;
  Plastic?: number;
  General?: number;
}

export interface BinApiResponse {
  id: number;
  schoolId: number;
  location: string;
  maxCapacity: number;
  currentItemCount: number;
  capacityPercentage: number;
  isNearingCapacity: boolean;
  itemsUntilThreshold: number;
  wasteComposition: WasteComposition;
  recyclablePercentage: number;
  items?: WasteItem[];
}

export interface SchoolStatistics {
  totalBins: number;
  totalItems: number;
  averageCapacity: number;
  binsNearingCapacity: number;
  overallRecyclingRate: number;
  wasteComposition: WasteComposition;
  totalCapacity: number;
}

export interface PredictionResponse {
  binId: number;
  currentCapacity: number;
  daysUntilThreshold: number;
  predictedDate: string;
  confidence: string;
  dailyAverage: number;
  itemsRemaining: number;
}

export interface AddItemRequest {
  wasteType: string;
  category: 'Paper' | 'Plastic' | 'General';
  imageUrl: string;
}

export interface AddItemResponse {
  success: boolean;
  itemId: number;
  message: string;
  binStatus: {
    currentItemCount: number;
    capacityPercentage: number;
    isNearingCapacity: boolean;
  };
}

export interface ApiError {
  error: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'connection' | 'bin_update' | 'subscription' | 'pong';
  timestamp: number;
}

export interface ConnectionMessage extends WebSocketMessage {
  type: 'connection';
  status: string;
  message: string;
}

export interface BinUpdateMessage extends WebSocketMessage {
  type: 'bin_update';
  binId: number;
  schoolId: number;
  location: string;
  currentItemCount: number;
  maxCapacity: number;
  capacityPercentage: number;
  isNearingCapacity: boolean;
  itemsUntilThreshold: number;
  wasteComposition: WasteComposition;
  recyclablePercentage: number;
}

export interface SubscriptionMessage extends WebSocketMessage {
  type: 'subscription';
  status: string;
  schoolId: number;
}
