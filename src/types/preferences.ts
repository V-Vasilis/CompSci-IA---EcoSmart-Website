export interface DashboardPreferences {
  showMetrics: boolean;
  showFilters: boolean;
  showBinGrid: boolean;
  showHistoricalTrends: boolean;
  showWasteTypeBreakdown: boolean;
  showAlerts: boolean;
}

export const defaultPreferences: DashboardPreferences = {
  showMetrics: true,
  showFilters: true,
  showBinGrid: true,
  showHistoricalTrends: true,
  showWasteTypeBreakdown: true,
  showAlerts: true,
};
