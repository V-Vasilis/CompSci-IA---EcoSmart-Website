import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { DashboardPreferences } from '../types/preferences';
import { LayoutGrid, BarChart3, Filter, TrendingUp, PieChart, Bell } from 'lucide-react';

interface DashboardSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: DashboardPreferences;
  onPreferencesChange: (preferences: DashboardPreferences) => void;
}

export function DashboardSettings({ 
  open, 
  onOpenChange, 
  preferences, 
  onPreferencesChange 
}: DashboardSettingsProps) {
  const widgets = [
    {
      id: 'showMetrics' as keyof DashboardPreferences,
      label: 'Key Metrics Bar',
      description: 'Display total bins, alerts, and recycling rate',
      icon: BarChart3
    },
    {
      id: 'showFilters' as keyof DashboardPreferences,
      label: 'Filter Panel',
      description: 'Location and status filtering options',
      icon: Filter
    },
    {
      id: 'showBinGrid' as keyof DashboardPreferences,
      label: 'Bin Grid View',
      description: 'Grid of all bin cards with capacity levels',
      icon: LayoutGrid
    },
    {
      id: 'showHistoricalTrends' as keyof DashboardPreferences,
      label: 'Historical Trends',
      description: 'Time-series data and trend analysis',
      icon: TrendingUp
    },
    {
      id: 'showWasteTypeBreakdown' as keyof DashboardPreferences,
      label: 'Waste Type Breakdown',
      description: 'Aggregate waste composition across all bins',
      icon: PieChart
    },
    {
      id: 'showAlerts' as keyof DashboardPreferences,
      label: 'Alert Summary',
      description: 'Critical bins and action items',
      icon: Bell
    }
  ];

  const handleToggle = (key: keyof DashboardPreferences) => {
    onPreferencesChange({
      ...preferences,
      [key]: !preferences[key]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dashboard Layout Settings</DialogTitle>
          <DialogDescription>
            Customize which widgets are visible on your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {widgets.map(widget => {
            const Icon = widget.icon;
            return (
              <div 
                key={widget.id}
                className="flex items-start justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div 
                    className="p-2 rounded-lg mt-1"
                    style={{ backgroundColor: '#2196F315' }}
                  >
                    <Icon size={18} style={{ color: '#2196F3' }} />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={widget.id} className="cursor-pointer">
                      {widget.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {widget.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={widget.id}
                  checked={preferences[widget.id]}
                  onCheckedChange={() => handleToggle(widget.id)}
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
