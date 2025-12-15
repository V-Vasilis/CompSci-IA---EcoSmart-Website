import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Download, Filter } from 'lucide-react';

interface FilterPanelProps {
  locations: string[];
  selectedLocation: string;
  selectedStatus: string;
  onLocationChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onExport: () => void;
}

export function FilterPanel({ 
  locations, 
  selectedLocation, 
  selectedStatus, 
  onLocationChange, 
  onStatusChange,
  onExport 
}: FilterPanelProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="flex items-center gap-2 flex-1">
        <Filter size={20} className="text-gray-500" />
        <Select value={selectedLocation} onValueChange={onLocationChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onExport} variant="outline" className="gap-2">
        <Download size={18} />
        Export Data
      </Button>
    </div>
  );
}
