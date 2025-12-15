import { Bin } from '../types/bin';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin } from 'lucide-react';

interface BinCardProps {
  bin: Bin;
  onClick: () => void;
}

export function BinCard({ bin, onClick }: BinCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#4CAF50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      default: return 'Normal';
    }
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-gray-500" />
          <span className="text-sm">{bin.location}</span>
        </div>
        <Badge 
          style={{ 
            backgroundColor: `${getStatusColor(bin.status)}15`,
            color: getStatusColor(bin.status),
            border: `1px solid ${getStatusColor(bin.status)}40`
          }}
        >
          {getStatusLabel(bin.status)}
        </Badge>
      </div>

      <div className="text-xs text-gray-500 mb-3">{bin.id}</div>

      <div className="space-y-3">
        {bin.compartments.map((compartment, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">{compartment.material}</span>
              <span className="text-xs" style={{ color: compartment.color }}>
                {compartment.currentLevel.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${compartment.currentLevel}%`,
                  backgroundColor: compartment.color
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          Last emptied: {new Date(bin.lastEmptied).toLocaleDateString()}
        </span>
      </div>
    </Card>
  );
}
