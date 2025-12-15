export interface BinCompartment {
  material: 'Paper' | 'Plastic' | 'General Waste';
  currentLevel: number; // 0-100
  capacity: number; // liters
  color: string;
}

export interface Bin {
  id: string;
  location: string;
  compartments: BinCompartment[];
  lastEmptied: Date;
  status: 'normal' | 'warning' | 'critical';
}

export interface ScanActivity {
  id: string;
  timestamp: Date;
  material: string;
  weight: number;
  accepted: boolean;
}

export interface PredictionData {
  date: Date;
  paperLevel: number;
  plasticLevel: number;
  generalLevel: number;
}
