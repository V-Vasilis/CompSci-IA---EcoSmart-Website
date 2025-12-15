import { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bin } from '../types/bin';
import { generateHistoricalData, filterHistoricalData } from '../utils/historicalData';
import { Calendar, TrendingUp } from 'lucide-react';

interface HistoricalTrendsProps {
  bins: Bin[];
}

export function HistoricalTrends({ bins }: HistoricalTrendsProps) {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [selectedBin, setSelectedBin] = useState<string>('all');
  const [selectedWasteType, setSelectedWasteType] = useState<string>('all');

  const historicalData = useMemo(() => {
    const days = parseInt(period);
    return generateHistoricalData(bins, days);
  }, [bins, period]);

  const chartData = useMemo(() => {
    return filterHistoricalData(historicalData, selectedBin, selectedWasteType);
  }, [historicalData, selectedBin, selectedWasteType]);

  const getVisibleLines = () => {
    if (selectedWasteType === 'all') {
      return ['Paper', 'Plastic', 'General Waste'];
    }
    return [selectedWasteType];
  };

  const visibleLines = getVisibleLines();

  const formatDate = (date: Date) => {
    if (period === '7') {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (period === '30') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const lineColors = {
    'Paper': '#2196F3',
    'Plastic': '#4CAF50',
    'General Waste': '#F44336'
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={24} style={{ color: '#2196F3' }} />
        <h2>Historical Trends</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar size={16} />
            Time Period
          </Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as '7' | '30' | '90')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Filter by Bin</Label>
          <Select value={selectedBin} onValueChange={setSelectedBin}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bins (Average)</SelectItem>
              {bins.map(bin => (
                <SelectItem key={bin.id} value={bin.id}>
                  {bin.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Filter by Waste Type</Label>
          <Select value={selectedWasteType} onValueChange={setSelectedWasteType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Paper">Paper</SelectItem>
              <SelectItem value="Plastic">Plastic</SelectItem>
              <SelectItem value="General Waste">General Waste</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              angle={period === '90' ? -45 : 0}
              textAnchor={period === '90' ? 'end' : 'middle'}
              height={period === '90' ? 80 : 30}
            />
            <YAxis 
              label={{ value: 'Capacity Level (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip 
              labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend />
            {visibleLines.map(lineKey => (
              <Line
                key={lineKey}
                type="monotone"
                dataKey={lineKey}
                stroke={lineColors[lineKey as keyof typeof lineColors]}
                strokeWidth={2}
                dot={period === '7'}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Average Fill Rate</div>
          <div className="text-2xl" style={{ color: '#2196F3' }}>
            {chartData.length > 0 
              ? ((chartData.reduce((acc, curr) => acc + curr.Paper + curr.Plastic + curr['General Waste'], 0) / (chartData.length * 3))).toFixed(1)
              : 0}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Total Scans</div>
          <div className="text-2xl" style={{ color: '#4CAF50' }}>
            {chartData.reduce((acc, curr) => acc + curr.totalScans, 0).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Data Points</div>
          <div className="text-2xl" style={{ color: '#FF9800' }}>
            {chartData.length}
          </div>
        </div>
      </div>
    </Card>
  );
}
