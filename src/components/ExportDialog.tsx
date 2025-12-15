import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Bin } from '../types/bin';
import { Download } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bins: Bin[];
}

export function ExportDialog({ open, onOpenChange, bins }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState('7');
  const [includeFields, setIncludeFields] = useState({
    location: true,
    status: true,
    levels: true,
    lastEmptied: true
  });

  const handleExport = () => {
    const dataToExport = bins.map(bin => ({
      ...(includeFields.location && { id: bin.id, location: bin.location }),
      ...(includeFields.status && { status: bin.status }),
      ...(includeFields.levels && {
        paperLevel: bin.compartments[0].currentLevel.toFixed(1),
        plasticLevel: bin.compartments[1].currentLevel.toFixed(1),
        generalWasteLevel: bin.compartments[2].currentLevel.toFixed(1)
      }),
      ...(includeFields.lastEmptied && { lastEmptied: bin.lastEmptied.toISOString() })
    }));

    if (format === 'csv') {
      const headers = Object.keys(dataToExport[0] || {});
      const csv = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => JSON.stringify(row[header as keyof typeof row] || '')).join(',')
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecosmartbins-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecosmartbins-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Configure your export settings and download the data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Include Fields</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="location" 
                  checked={includeFields.location}
                  onCheckedChange={(checked) => 
                    setIncludeFields(prev => ({ ...prev, location: checked as boolean }))
                  }
                />
                <label htmlFor="location" className="text-sm cursor-pointer">
                  Location & ID
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="status" 
                  checked={includeFields.status}
                  onCheckedChange={(checked) => 
                    setIncludeFields(prev => ({ ...prev, status: checked as boolean }))
                  }
                />
                <label htmlFor="status" className="text-sm cursor-pointer">
                  Status
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="levels" 
                  checked={includeFields.levels}
                  onCheckedChange={(checked) => 
                    setIncludeFields(prev => ({ ...prev, levels: checked as boolean }))
                  }
                />
                <label htmlFor="levels" className="text-sm cursor-pointer">
                  Capacity Levels
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="lastEmptied" 
                  checked={includeFields.lastEmptied}
                  onCheckedChange={(checked) => 
                    setIncludeFields(prev => ({ ...prev, lastEmptied: checked as boolean }))
                  }
                />
                <label htmlFor="lastEmptied" className="text-sm cursor-pointer">
                  Last Emptied
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleExport} className="flex-1 gap-2" style={{ backgroundColor: '#2196F3' }}>
            <Download size={18} />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
