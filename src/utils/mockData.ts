import { Bin, ScanActivity, PredictionData } from '../types/bin';

const locations = [
  'Main Cafeteria',
  'Library - Floor 1',
  'Science Building',
  'Gymnasium',
  'Admin Building',
  'Library - Floor 2',
  'Student Center',
  'Arts Building',
  'Sports Field',
  'Computer Lab'
];

export const generateBins = (): Bin[] => {
  return locations.map((location, index) => {
    const paperLevel = Math.random() * 100;
    const plasticLevel = Math.random() * 100;
    const generalLevel = Math.random() * 100;
    
    const maxLevel = Math.max(paperLevel, plasticLevel, generalLevel);
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (maxLevel > 80) status = 'critical';
    else if (maxLevel > 60) status = 'warning';

    return {
      id: `BIN-${String(index + 1).padStart(3, '0')}`,
      location,
      compartments: [
        { material: 'Paper', currentLevel: paperLevel, capacity: 50, color: '#2196F3' },
        { material: 'Plastic', currentLevel: plasticLevel, capacity: 50, color: '#4CAF50' },
        { material: 'General Waste', currentLevel: generalLevel, capacity: 50, color: '#F44336' }
      ],
      lastEmptied: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      status
    };
  });
};

export const generateScanActivity = (binId: string): ScanActivity[] => {
  const materials = ['Paper', 'Plastic', 'General Waste', 'Metal Can', 'Glass Bottle'];
  const activities: ScanActivity[] = [];
  
  for (let i = 0; i < 20; i++) {
    activities.push({
      id: `SCAN-${binId}-${i}`,
      timestamp: new Date(Date.now() - i * 3600000 - Math.random() * 3600000),
      material: materials[Math.floor(Math.random() * materials.length)],
      weight: Math.random() * 500 + 50,
      accepted: Math.random() > 0.1
    });
  }
  
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const generatePredictions = (compartments: any[]): PredictionData[] => {
  const predictions: PredictionData[] = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    predictions.push({
      date,
      paperLevel: Math.min(100, compartments[0].currentLevel + (i * 5) + Math.random() * 10),
      plasticLevel: Math.min(100, compartments[1].currentLevel + (i * 4) + Math.random() * 8),
      generalLevel: Math.min(100, compartments[2].currentLevel + (i * 6) + Math.random() * 12)
    });
  }
  
  return predictions;
};

export const calculateMetrics = (bins: Bin[]) => {
  const totalBins = bins.length;
  const binsRequiringAttention = bins.filter(b => b.status === 'warning' || b.status === 'critical').length;
  
  let totalScans = 0;
  let recyclableScans = 0;
  
  bins.forEach(bin => {
    const scans = Math.floor(Math.random() * 50 + 10);
    totalScans += scans;
    recyclableScans += Math.floor(scans * (0.6 + Math.random() * 0.2));
  });
  
  const recyclingRate = totalScans > 0 ? (recyclableScans / totalScans) * 100 : 0;
  
  return {
    totalBins,
    binsRequiringAttention,
    todayWasteCount: totalScans,
    recyclingRate
  };
};
