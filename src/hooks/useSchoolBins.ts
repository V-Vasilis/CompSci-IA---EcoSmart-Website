import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BinApiResponse } from '../types/api';
import { Bin } from '../types/bin';

/**
 * Convert API bin response to frontend Bin type
 */
function convertApiBinToBin(apiBin: BinApiResponse): Bin {
  const { wasteComposition } = apiBin;

  // Calculate current levels based on composition and capacity
  const totalItems = apiBin.currentItemCount;
  const paperCount = wasteComposition.Paper || 0;
  const plasticCount = wasteComposition.Plastic || 0;
  const generalCount = wasteComposition.General || 0;

  // Calculate percentage for each compartment
  const paperLevel = totalItems > 0 ? (paperCount / totalItems) * apiBin.capacityPercentage : 0;
  const plasticLevel = totalItems > 0 ? (plasticCount / totalItems) * apiBin.capacityPercentage : 0;
  const generalLevel = totalItems > 0 ? (generalCount / totalItems) * apiBin.capacityPercentage : 0;

  // Determine status based on capacity
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (apiBin.capacityPercentage >= 80) status = 'critical';
  else if (apiBin.capacityPercentage >= 60) status = 'warning';

  return {
    id: `BIN-${String(apiBin.id).padStart(3, '0')}`,
    location: apiBin.location,
    compartments: [
      { material: 'Paper', currentLevel: paperLevel, capacity: 50, color: '#2196F3' },
      { material: 'Plastic', currentLevel: plasticLevel, capacity: 50, color: '#4CAF50' },
      { material: 'General Waste', currentLevel: generalLevel, capacity: 50, color: '#F44336' },
    ],
    lastEmptied: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // TODO: Get from API
    status,
  };
}

interface UseSchoolBinsResult {
  bins: Bin[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage bins for a school
 */
export function useSchoolBins(schoolId: string | null): UseSchoolBinsResult {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBins = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const apiBins = await api.getSchoolBins(parseInt(schoolId));
      const convertedBins = apiBins.map(convertApiBinToBin);

      setBins(convertedBins);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bins';
      setError(errorMessage);
      console.error('Error fetching bins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, [schoolId]);

  return {
    bins,
    loading,
    error,
    refetch: fetchBins,
  };
}
