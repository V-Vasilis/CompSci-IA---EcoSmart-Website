import { Bin } from '../types/bin';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { ArrowLeft, MapPin, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateScanActivity, generatePredictions } from '../utils/mockData';
import { useMemo } from 'react';

interface BinDetailProps {
  bin: Bin;
  onBack: () => void;
}

export function BinDetail({ bin, onBack }: BinDetailProps) {
  const scanActivity = useMemo(() => generateScanActivity(bin.id), [bin.id]);
  const predictions = useMemo(() => generatePredictions(bin.compartments), [bin.compartments]);

  const pieData = useMemo(() => {
    const total = bin.compartments.reduce((sum, comp) => sum + comp.currentLevel, 0);
    if (total === 0) {
      return bin.compartments.map(comp => ({
        name: comp.material,
        value: 33.33,
        color: comp.color
      }));
    }
    return bin.compartments.map(comp => ({
      name: comp.material,
      value: (comp.currentLevel / total) * 100,
      color: comp.color
    }));
  }, [bin.compartments]);

  const getRecommendedEmptyingDate = () => {
    const criticalPrediction = predictions.find(p => 
      p.paperLevel >= 80 || p.plasticLevel >= 80 || p.generalLevel >= 80
    );
    return criticalPrediction?.date || null;
  };

  const recommendedDate = getRecommendedEmptyingDate();

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft size={18} />
        Back to Dashboard
      </Button>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <h1>{bin.location}</h1>
          <Badge 
            style={{ 
              backgroundColor: `${bin.status === 'critical' ? '#F44336' : bin.status === 'warning' ? '#FF9800' : '#4CAF50'}15`,
              color: bin.status === 'critical' ? '#F44336' : bin.status === 'warning' ? '#FF9800' : '#4CAF50',
              border: `1px solid ${bin.status === 'critical' ? '#F44336' : bin.status === 'warning' ? '#FF9800' : '#4CAF50'}40`
            }}
          >
            {bin.status === 'critical' ? 'Critical' : bin.status === 'warning' ? 'Warning' : 'Normal'}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            {bin.id}
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            Last emptied: {new Date(bin.lastEmptied).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {bin.compartments.map((compartment, index) => (
          <Card key={index} className="p-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-4">{compartment.material}</div>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={compartment.color}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - compartment.currentLevel / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl" style={{ color: compartment.color }}>
                      {compartment.currentLevel.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Full
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="mb-4">Capacity Prediction (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Legend />
              <Line type="monotone" dataKey="paperLevel" stroke="#2196F3" name="Paper" strokeWidth={2} />
              <Line type="monotone" dataKey="plasticLevel" stroke="#4CAF50" name="Plastic" strokeWidth={2} />
              <Line type="monotone" dataKey="generalLevel" stroke="#F44336" name="General Waste" strokeWidth={2} />
              <Line 
                type="monotone" 
                dataKey={() => 80} 
                stroke="#FF9800" 
                strokeDasharray="5 5" 
                name="80% Threshold"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
          {recommendedDate && (
            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#FF980015' }}>
              <div className="text-sm">
                <span style={{ color: '#FF9800' }}>Recommended emptying:</span>{' '}
                {recommendedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4">Waste Composition</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4">Recent Scan Activity</h3>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {scanActivity.map((scan) => (
              <div 
                key={scan.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  {scan.accepted ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <XCircle size={20} className="text-red-500" />
                  )}
                  <div>
                    <div className="text-sm">{scan.material}</div>
                    <div className="text-xs text-gray-500">
                      {scan.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {scan.accepted ? 'Accepted' : 'Rejected'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
