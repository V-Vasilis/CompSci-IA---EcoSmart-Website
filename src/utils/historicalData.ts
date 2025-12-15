import { Bin } from '../types/bin';

export interface HistoricalDataPoint {
  date: Date;
  binId: string;
  location: string;
  paperLevel: number;
  plasticLevel: number;
  generalLevel: number;
  totalScans: number;
}

export const generateHistoricalData = (bins: Bin[], days: number): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const now = new Date();

  bins.forEach(bin => {
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - i - 1));
      date.setHours(12, 0, 0, 0);

      // Simulate realistic growth patterns
      const dayProgress = i / days;
      const variance = Math.random() * 15 - 7.5;

      data.push({
        date,
        binId: bin.id,
        location: bin.location,
        paperLevel: Math.min(100, Math.max(0, bin.compartments[0].currentLevel * dayProgress + variance)),
        plasticLevel: Math.min(100, Math.max(0, bin.compartments[1].currentLevel * dayProgress + variance)),
        generalLevel: Math.min(100, Math.max(0, bin.compartments[2].currentLevel * dayProgress + variance)),
        totalScans: Math.floor(Math.random() * 50 + 20)
      });
    }
  });

  return data;
};

export const filterHistoricalData = (
  data: HistoricalDataPoint[],
  binId: string | null,
  wasteType: string | null
): any[] => {
  let filtered = data;

  if (binId && binId !== 'all') {
    filtered = filtered.filter(d => d.binId === binId);
  }

  // Aggregate by date
  const aggregated = filtered.reduce((acc, curr) => {
    const dateKey = curr.date.toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: curr.date,
        paperLevel: 0,
        plasticLevel: 0,
        generalLevel: 0,
        totalScans: 0,
        count: 0
      };
    }

    acc[dateKey].paperLevel += curr.paperLevel;
    acc[dateKey].plasticLevel += curr.plasticLevel;
    acc[dateKey].generalLevel += curr.generalLevel;
    acc[dateKey].totalScans += curr.totalScans;
    acc[dateKey].count += 1;

    return acc;
  }, {} as Record<string, any>);

  return Object.values(aggregated).map(item => ({
    date: item.date,
    Paper: item.paperLevel / item.count,
    Plastic: item.plasticLevel / item.count,
    'General Waste': item.generalLevel / item.count,
    totalScans: item.totalScans
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
};
