import { useState, useMemo, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { MetricsBar } from './components/MetricsBar';
import { FilterPanel } from './components/FilterPanel';
import { BinCard } from './components/BinCard';
import { BinDetail } from './components/BinDetail';
import { ExportDialog } from './components/ExportDialog';
import { DashboardSettings } from './components/DashboardSettings';
import { HistoricalTrends } from './components/HistoricalTrends';
import { WasteTypeBreakdown } from './components/WasteTypeBreakdown';
import { AlertSummary } from './components/AlertSummary';
import { useSchoolBins } from './hooks/useSchoolBins';
import { useBinWebSocket } from './hooks/useBinWebSocket';
import { calculateMetrics } from './utils/mockData';
import { Bin } from './types/bin';
import { DashboardPreferences, defaultPreferences } from './types/preferences';
import { LogOut, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './components/ui/button';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<DashboardPreferences>(defaultPreferences);

  // Fetch bins from API
  const { bins, loading, error, refetch } = useSchoolBins(isAuthenticated ? schoolId : null);

  // Connect to WebSocket for real-time updates
  const { connected: wsConnected, latestUpdate } = useBinWebSocket(isAuthenticated ? schoolId : null);

  // Update bins when WebSocket receives updates
  useEffect(() => {
    if (latestUpdate) {
      console.log('Processing bin update from WebSocket:', latestUpdate);
      // Refetch bins to get latest data
      refetch();
    }
  }, [latestUpdate, refetch]);

  const handleLogin = (id: string) => {
    setSchoolId(id);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSchoolId('');
    setSelectedBin(null);
  };

  const locations = useMemo(() => {
    return Array.from(new Set(bins.map(b => b.location))).sort();
  }, [bins]);

  const filteredAndSortedBins = useMemo(() => {
    let filtered = bins;

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(b => b.location === selectedLocation);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }

    return filtered.sort((a, b) => {
      const statusOrder = { critical: 0, warning: 1, normal: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [bins, selectedLocation, selectedStatus]);

  const metrics = useMemo(() => calculateMetrics(bins), [bins]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (selectedBin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <BinDetail bin={selectedBin} onBack={() => setSelectedBin(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 style={{ color: '#2196F3' }}>EcoSmartBins Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time monitoring and analytics for AI-powered waste bins</p>
              <p className="text-xs text-gray-500 mt-1">School ID: {schoolId}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {wsConnected ? (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Wifi size={16} />
                    <span className="hidden sm:inline">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <WifiOff size={16} />
                    <span className="hidden sm:inline">Offline</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <Button
                variant="outline"
                onClick={refetch}
                className="gap-2"
                size="sm"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(true)}
                className="gap-2"
                size="sm"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Layout</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
                size="sm"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 max-w-7xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              onClick={refetch}
              className="mt-2"
              size="sm"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        )}

        {loading && bins.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw size={32} className="animate-spin mx-auto text-blue-500 mb-4" />
              <p className="text-gray-600">Loading bins...</p>
            </div>
          </div>
        )}

        {preferences.showMetrics && bins.length > 0 && (
          <MetricsBar
            totalBins={metrics.totalBins}
            binsRequiringAttention={metrics.binsRequiringAttention}
            todayWasteCount={metrics.todayWasteCount}
            recyclingRate={metrics.recyclingRate}
          />
        )}

        {preferences.showFilters && bins.length > 0 && (
          <FilterPanel
            locations={locations}
            selectedLocation={selectedLocation}
            selectedStatus={selectedStatus}
            onLocationChange={setSelectedLocation}
            onStatusChange={setSelectedStatus}
            onExport={() => setExportDialogOpen(true)}
          />
        )}

        {preferences.showHistoricalTrends && bins.length > 0 && (
          <div className="mb-6">
            <HistoricalTrends bins={bins} />
          </div>
        )}

        {bins.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {preferences.showWasteTypeBreakdown && (
              <div className="lg:col-span-2">
                <WasteTypeBreakdown bins={bins} />
              </div>
            )}

            {preferences.showAlerts && (
              <div className={preferences.showWasteTypeBreakdown ? 'lg:col-span-1' : 'lg:col-span-3'}>
                <AlertSummary bins={bins} onBinClick={setSelectedBin} />
              </div>
            )}
          </div>
        )}

        {preferences.showBinGrid && bins.length > 0 && (
          <>
            <h2 className="mb-4">All Bins</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedBins.map(bin => (
                <BinCard
                  key={bin.id}
                  bin={bin}
                  onClick={() => setSelectedBin(bin)}
                />
              ))}
            </div>

            {filteredAndSortedBins.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No bins match the selected filters</p>
              </div>
            )}
          </>
        )}
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        bins={filteredAndSortedBins}
      />

      <DashboardSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        preferences={preferences}
        onPreferencesChange={setPreferences}
      />
    </div>
  );
}
