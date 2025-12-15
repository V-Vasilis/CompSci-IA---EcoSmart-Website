import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Bin } from '../types/bin';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';

interface AlertSummaryProps {
  bins: Bin[];
  onBinClick: (bin: Bin) => void;
}

export function AlertSummary({ bins, onBinClick }: AlertSummaryProps) {
  const criticalBins = bins.filter(b => b.status === 'critical');
  const warningBins = bins.filter(b => b.status === 'warning');

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle size={24} style={{ color: '#FF9800' }} />
        <h2>Alert Summary</h2>
      </div>

      <div className="space-y-4">
        {criticalBins.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge style={{ backgroundColor: '#F4433615', color: '#F44336' }}>
                {criticalBins.length} Critical
              </Badge>
            </div>
            <div className="space-y-2">
              {criticalBins.map(bin => (
                <div
                  key={bin.id}
                  onClick={() => onBinClick(bin)}
                  className="p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#F44336' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-500" />
                      <span className="text-sm">{bin.location}</span>
                    </div>
                    <span className="text-xs text-gray-500">{bin.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} />
                    Last emptied {Math.floor((Date.now() - new Date(bin.lastEmptied).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                  <div className="mt-2 flex gap-2">
                    {bin.compartments.map((comp, idx) => (
                      comp.currentLevel > 80 && (
                        <Badge 
                          key={idx}
                          style={{ 
                            backgroundColor: `${comp.color}15`, 
                            color: comp.color,
                            fontSize: '0.65rem'
                          }}
                        >
                          {comp.material}: {comp.currentLevel.toFixed(0)}%
                        </Badge>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {warningBins.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge style={{ backgroundColor: '#FF980015', color: '#FF9800' }}>
                {warningBins.length} Warning
              </Badge>
            </div>
            <div className="space-y-2">
              {warningBins.slice(0, 3).map(bin => (
                <div
                  key={bin.id}
                  onClick={() => onBinClick(bin)}
                  className="p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#FF9800' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-500" />
                      <span className="text-sm">{bin.location}</span>
                    </div>
                    <span className="text-xs text-gray-500">{bin.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} />
                    Last emptied {Math.floor((Date.now() - new Date(bin.lastEmptied).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                </div>
              ))}
              {warningBins.length > 3 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  + {warningBins.length - 3} more warnings
                </div>
              )}
            </div>
          </div>
        )}

        {criticalBins.length === 0 && warningBins.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{ backgroundColor: '#4CAF5015' }}>
              <AlertTriangle size={32} style={{ color: '#4CAF50' }} />
            </div>
            <div className="text-gray-600">All bins are operating normally</div>
            <div className="text-sm text-gray-500 mt-1">No alerts at this time</div>
          </div>
        )}
      </div>
    </Card>
  );
}
