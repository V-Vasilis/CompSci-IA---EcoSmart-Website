package com.ecosmart.waste.service;

import com.ecosmart.waste.model.WasteItem;

import java.util.List;
import java.util.Map;

/**
 * Interface for data export functionality.
 * Implements the Strategy pattern for different export formats.
 */
public interface DataExporter {

    /**
     * Exports waste items to a specific format.
     *
     * @param items        List of waste items to export
     * @param binLocations Map of bin IDs to location names
     * @return Formatted export string
     */
    String exportToCSV(List<WasteItem> items, Map<Long, String> binLocations);

    /**
     * Gets the export format name.
     */
    String getFormatName();
}
