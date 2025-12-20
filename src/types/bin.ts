export interface BinCompartment {
  material: 'Paper' | 'Plastic' | 'General Waste';
  currentLevel: number; // 0-100 (percentage full based on item count)
  capacity: number; // max items
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
  accepted: boolean;
}

export interface PredictionData {
  date: Date;
  paperLevel: number;
  plasticLevel: number;
  generalLevel: number;
}
