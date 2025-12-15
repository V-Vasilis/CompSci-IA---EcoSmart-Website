import { Trash2, AlertTriangle, Activity, Recycle } from 'lucide-react';
import { Card } from './ui/card';

interface MetricsBarProps {
  totalBins: number;
  binsRequiringAttention: number;
  todayWasteCount: number;
  recyclingRate: number;
}

export function MetricsBar({ totalBins, binsRequiringAttention, todayWasteCount, recyclingRate }: MetricsBarProps) {
  const metrics = [
    {
      icon: Trash2,
      label: 'Total Bins',
      value: totalBins,
      color: '#2196F3'
    },
    {
      icon: AlertTriangle,
      label: 'Requiring Attention',
      value: binsRequiringAttention,
      color: '#FF9800'
    },
    {
      icon: Activity,
      label: "Today's Scans",
      value: todayWasteCount,
      color: '#4CAF50'
    },
    {
      icon: Recycle,
      label: 'Recycling Rate',
      value: `${recyclingRate.toFixed(1)}%`,
      color: '#4CAF50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${metric.color}15` }}
              >
                <Icon size={24} style={{ color: metric.color }} />
              </div>
              <div>
                <div className="text-sm text-gray-600">{metric.label}</div>
                <div className="text-2xl" style={{ color: metric.color }}>{metric.value}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
