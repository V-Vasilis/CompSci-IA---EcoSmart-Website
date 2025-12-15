import { useMemo } from 'react';
import { Card } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Bin } from '../types/bin';
import { Recycle } from 'lucide-react';

interface WasteTypeBreakdownProps {
  bins: Bin[];
}

export function WasteTypeBreakdown({ bins }: WasteTypeBreakdownProps) {
  const aggregateData = useMemo(() => {
    const totals = {
      Paper: 0,
      Plastic: 0,
      'General Waste': 0
    };

    bins.forEach(bin => {
      totals.Paper += bin.compartments[0].currentLevel;
      totals.Plastic += bin.compartments[1].currentLevel;
      totals['General Waste'] += bin.compartments[2].currentLevel;
    });

    return [
      { name: 'Paper', value: totals.Paper / bins.length, color: '#2196F3' },
      { name: 'Plastic', value: totals.Plastic / bins.length, color: '#4CAF50' },
      { name: 'General Waste', value: totals['General Waste'] / bins.length, color: '#F44336' }
    ];
  }, [bins]);

  const totalVolume = useMemo(() => {
    return bins.reduce((acc, bin) => {
      return acc + bin.compartments.reduce((sum, comp) => {
        return sum + (comp.currentLevel / 100 * comp.capacity);
      }, 0);
    }, 0);
  }, [bins]);

  const recyclablePercentage = useMemo(() => {
    const recyclable = aggregateData[0].value + aggregateData[1].value;
    const total = aggregateData.reduce((acc, curr) => acc + curr.value, 0);
    return (recyclable / total) * 100;
  }, [aggregateData]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Recycle size={24} style={{ color: '#4CAF50' }} />
        <h2>Waste Type Breakdown</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={aggregateData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {aggregateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-center space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">Total Volume Collected</div>
            <div className="text-3xl" style={{ color: '#2196F3' }}>
              {totalVolume.toFixed(1)}L
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">Recyclable Material</div>
            <div className="text-3xl" style={{ color: '#4CAF50' }}>
              {recyclablePercentage.toFixed(1)}%
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-2">
            {aggregateData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-sm" style={{ color: item.color }}>
                  {item.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
