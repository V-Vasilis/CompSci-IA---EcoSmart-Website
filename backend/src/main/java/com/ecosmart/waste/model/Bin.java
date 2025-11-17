package com.ecosmart.waste.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Represents a physical waste bin in a school.
 * Demonstrates aggregation by maintaining a collection of WasteItem objects.
 */
public class Bin {
    private Long id;
    private Long schoolId;
    private String location;
    private int maxCapacity; // Maximum number of items the bin can hold
    private List<WasteItem> items; // Aggregated collection of waste items

    public Bin(Long id, Long schoolId, String location, int maxCapacity) {
        this.id = id;
        this.schoolId = schoolId;
        this.location = location;
        this.maxCapacity = maxCapacity;
        this.items = new ArrayList<>();
    }

    /**
     * Adds a waste item to this bin.
     */
    public void addItem(WasteItem item) {
        items.add(item);
    }

    /**
     * Returns the current number of items in the bin.
     */
    public int getCurrentItemCount() {
        return items.size();
    }

    /**
     * Calculates the current capacity percentage of the bin.
     * @return Percentage (0-100) of bin capacity filled
     */
    public double getCapacityPercentage() {
        if (maxCapacity == 0) {
            return 0.0;
        }
        return (double) items.size() / maxCapacity * 100.0;
    }

    /**
     * Checks if bin has reached or exceeded 80% capacity threshold.
     */
    public boolean isNearingCapacity() {
        return getCapacityPercentage() >= 80.0;
    }

    /**
     * Calculates the number of items remaining until 80% capacity.
     */
    public int getItemsUntilThreshold() {
        int thresholdCount = (int) Math.ceil(maxCapacity * 0.8);
        int remaining = thresholdCount - items.size();
        return Math.max(0, remaining);
    }

    /**
     * Generates a breakdown of waste composition by type.
     * Demonstrates iteration and grouping algorithms.
     * @return Map of category to count
     */
    public Map<String, Integer> getWasteComposition() {
        Map<String, Integer> composition = new HashMap<>();

        for (WasteItem item : items) {
            String category = item.getCategory();
            composition.put(category, composition.getOrDefault(category, 0) + 1);
        }

        return composition;
    }

    /**
     * Calculates the percentage of recyclable items in the bin.
     */
    public double getRecyclablePercentage() {
        if (items.isEmpty()) {
            return 0.0;
        }

        long recyclableCount = items.stream()
                                    .filter(WasteItem::isRecyclable)
                                    .count();

        return (double) recyclableCount / items.size() * 100.0;
    }

    /**
     * Gets items within a specific date range (useful for analytics).
     */
    public List<WasteItem> getItemsInDateRange(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        List<WasteItem> filteredItems = new ArrayList<>();

        for (WasteItem item : items) {
            if (item.getTimestamp().isAfter(start) && item.getTimestamp().isBefore(end)) {
                filteredItems.add(item);
            }
        }

        return filteredItems;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(Long schoolId) {
        this.schoolId = schoolId;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public int getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(int maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public List<WasteItem> getItems() {
        return new ArrayList<>(items); // Return defensive copy
    }

    public void setItems(List<WasteItem> items) {
        this.items = new ArrayList<>(items);
    }

    @Override
    public String toString() {
        return String.format("Bin[id=%d, location=%s, items=%d/%d (%.1f%%)]",
                id, location, getCurrentItemCount(), maxCapacity, getCapacityPercentage());
    }
}
