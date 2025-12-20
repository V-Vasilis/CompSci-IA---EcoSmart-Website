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
  // Predefined realistic data for consistent demo
  const binData = [
    { location: 'Main Cafeteria', paper: 75, plastic: 82, general: 68 },
    { location: 'Library - Floor 1', paper: 45, plastic: 38, general: 52 },
    { location: 'Science Building', paper: 88, plastic: 72, general: 65 },
    { location: 'Gymnasium', paper: 55, plastic: 90, general: 78 },
    { location: 'Admin Building', paper: 32, plastic: 28, general: 41 },
    { location: 'Library - Floor 2', paper: 61, plastic: 55, general: 48 },
    { location: 'Student Center', paper: 79, plastic: 85, general: 92 },
    { location: 'Arts Building', paper: 42, plastic: 35, general: 58 },
    { location: 'Sports Field', paper: 67, plastic: 74, general: 81 },
    { location: 'Computer Lab', paper: 53, plastic: 47, general: 39 }
  ];

  return binData.map((data, index) => {
    const maxLevel = Math.max(data.paper, data.plastic, data.general);
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (maxLevel > 80) status = 'critical';
    else if (maxLevel > 60) status = 'warning';

    return {
      id: `BIN-${String(index + 1).padStart(3, '0')}`,
      location: data.location,
      compartments: [
        { material: 'Paper', currentLevel: data.paper, capacity: 50, color: '#2196F3' },
        { material: 'Plastic', currentLevel: data.plastic, capacity: 50, color: '#4CAF50' },
        { material: 'General Waste', currentLevel: data.general, capacity: 50, color: '#F44336' }
      ],
      lastEmptied: new Date(Date.now() - (index + 1) * 12 * 60 * 60 * 1000), // Staggered times
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
