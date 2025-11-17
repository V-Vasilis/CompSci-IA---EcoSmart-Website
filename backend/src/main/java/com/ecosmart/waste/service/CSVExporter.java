package com.ecosmart.waste.service;

import com.ecosmart.waste.model.WasteItem;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

import java.io.IOException;
import java.io.StringWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * CSV implementation of DataExporter interface.
 * Uses encapsulated getters to access item data safely.
 */
public class CSVExporter implements DataExporter {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Exports waste items to CSV format.
     * Includes headers for item ID, bin location, waste type, timestamp, and metadata.
     */
    @Override
    public String exportToCSV(List<WasteItem> items, Map<Long, String> binLocations) {
        StringWriter writer = new StringWriter();

        try {
            // Define CSV format with headers
            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader(
                            "Item ID",
                            "Bin ID",
                            "Bin Location",
                            "Category",
                            "Waste Type",
                            "Recyclable",
                            "Timestamp",
                            "Image URL",
                            "Recycling Instructions"
                    )
                    .build();

            try (CSVPrinter csvPrinter = new CSVPrinter(writer, csvFormat)) {
                // Write data rows using encapsulated getters
                for (WasteItem item : items) {
                    csvPrinter.printRecord(
                            item.getId(),
                            item.getBinId(),
                            binLocations.getOrDefault(item.getBinId(), "Unknown"),
                            item.getCategory(),
                            item.getWasteType(),
                            item.isRecyclable() ? "Yes" : "No",
                            item.getTimestamp().format(DATE_FORMATTER),
                            item.getImageUrl() != null ? item.getImageUrl() : "",
                            cleanForCSV(item.getRecyclingInstructions())
                    );
                }
            }

        } catch (IOException e) {
            System.err.println("Error generating CSV: " + e.getMessage());
            e.printStackTrace();
            return "Error generating CSV export";
        }

        return writer.toString();
    }

    /**
     * Cleans text for CSV output by removing problematic characters.
     */
    private String cleanForCSV(String text) {
        if (text == null) {
            return "";
        }
        // Remove newlines and excess whitespace
        return text.replaceAll("\\r?\\n", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    @Override
    public String getFormatName() {
        return "CSV";
    }

    /**
     * Exports with custom headers (optional enhancement).
     */
    public String exportToCSVWithCustomHeaders(
            List<WasteItem> items,
            Map<Long, String> binLocations,
            String[] customHeaders) {

        StringWriter writer = new StringWriter();

        try {
            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader(customHeaders)
                    .build();

            try (CSVPrinter csvPrinter = new CSVPrinter(writer, csvFormat)) {
                for (WasteItem item : items) {
                    // Build record based on custom headers
                    Object[] record = buildCustomRecord(item, binLocations, customHeaders);
                    csvPrinter.printRecord(record);
                }
            }

        } catch (IOException e) {
            System.err.println("Error generating custom CSV: " + e.getMessage());
            return "Error generating CSV export";
        }

        return writer.toString();
    }

    /**
     * Builds a record array based on custom headers.
     */
    private Object[] buildCustomRecord(WasteItem item, Map<Long, String> binLocations, String[] headers) {
        Object[] record = new Object[headers.length];

        for (int i = 0; i < headers.length; i++) {
            String header = headers[i].toLowerCase();

            switch (header) {
                case "item id":
                case "id":
                    record[i] = item.getId();
                    break;
                case "bin id":
                    record[i] = item.getBinId();
                    break;
                case "bin location":
                case "location":
                    record[i] = binLocations.getOrDefault(item.getBinId(), "Unknown");
                    break;
                case "category":
                    record[i] = item.getCategory();
                    break;
                case "waste type":
                case "type":
                    record[i] = item.getWasteType();
                    break;
                case "recyclable":
                    record[i] = item.isRecyclable() ? "Yes" : "No";
                    break;
                case "timestamp":
                case "date":
                    record[i] = item.getTimestamp().format(DATE_FORMATTER);
                    break;
                case "image url":
                case "image":
                    record[i] = item.getImageUrl() != null ? item.getImageUrl() : "";
                    break;
                default:
                    record[i] = "";
            }
        }

        return record;
    }
}
