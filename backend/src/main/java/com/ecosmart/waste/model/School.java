package com.ecosmart.waste.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Represents a school in the waste management system.
 * Demonstrates aggregation by maintaining multiple Bin objects
 * and implements school-wide data aggregation algorithms.
 */
public class School {
    private Long id;
    private String name;
    private String address;
    private String contactEmail;
    private List<Bin> bins; // Aggregated collection of bins

    public School(Long id, String name, String address, String contactEmail) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.contactEmail = contactEmail;
        this.bins = new ArrayList<>();
    }

    /**
     * Adds a bin to this school.
     */
    public void addBin(Bin bin) {
        bins.add(bin);
    }

    /**
     * Calculates the total number of waste items across all bins.
     */
    public int getTotalItemCount() {
        int total = 0;
        for (Bin bin : bins) {
            total += bin.getCurrentItemCount();
        }
        return total;
    }

    /**
     * Calculates the average capacity percentage across all bins.
     */
    public double getAverageCapacityPercentage() {
        if (bins.isEmpty()) {
            return 0.0;
        }

        double totalPercentage = 0.0;
        for (Bin bin : bins) {
            totalPercentage += bin.getCapacityPercentage();
        }

        return totalPercentage / bins.size();
    }

    /**
     * Gets a list of all bins that are nearing capacity (>= 80%).
     */
    public List<Bin> getBinsNearingCapacity() {
        List<Bin> nearingCapacity = new ArrayList<>();

        for (Bin bin : bins) {
            if (bin.isNearingCapacity()) {
                nearingCapacity.add(bin);
            }
        }

        return nearingCapacity;
    }

    /**
     * Aggregates waste composition across all bins in the school.
     * Combines statistics from multiple bins by category.
     * @return Map of category to total count across all bins
     */
    public Map<String, Integer> getSchoolWideWasteComposition() {
        Map<String, Integer> schoolComposition = new HashMap<>();

        // Iterate through each bin
        for (Bin bin : bins) {
            // Get composition for this bin
            Map<String, Integer> binComposition = bin.getWasteComposition();

            // Aggregate into school-wide statistics
            for (Map.Entry<String, Integer> entry : binComposition.entrySet()) {
                String category = entry.getKey();
                int count = entry.getValue();
                schoolComposition.put(category, schoolComposition.getOrDefault(category, 0) + count);
            }
        }

        return schoolComposition;
    }

    /**
     * Calculates the school-wide recyclable percentage.
     */
    public double getSchoolWideRecyclablePercentage() {
        int totalItems = 0;
        int recyclableItems = 0;

        for (Bin bin : bins) {
            for (WasteItem item : bin.getItems()) {
                totalItems++;
                if (item.isRecyclable()) {
                    recyclableItems++;
                }
            }
        }

        if (totalItems == 0) {
            return 0.0;
        }

        return (double) recyclableItems / totalItems * 100.0;
    }

    /**
     * Gets total capacity across all bins.
     */
    public int getTotalCapacity() {
        int total = 0;
        for (Bin bin : bins) {
            total += bin.getMaxCapacity();
        }
        return total;
    }

    /**
     * Gets summary statistics for the school.
     */
    public Map<String, Object> getSchoolStatistics() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("schoolId", id);
        stats.put("schoolName", name);
        stats.put("totalBins", bins.size());
        stats.put("totalItems", getTotalItemCount());
        stats.put("totalCapacity", getTotalCapacity());
        stats.put("averageCapacity", getAverageCapacityPercentage());
        stats.put("binsNearingCapacity", getBinsNearingCapacity().size());
        stats.put("wasteComposition", getSchoolWideWasteComposition());
        stats.put("recyclablePercentage", getSchoolWideRecyclablePercentage());

        return stats;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public List<Bin> getBins() {
        return new ArrayList<>(bins); // Return defensive copy
    }

    public void setBins(List<Bin> bins) {
        this.bins = new ArrayList<>(bins);
    }

    @Override
    public String toString() {
        return String.format("School[id=%d, name=%s, bins=%d, totalItems=%d]",
                id, name, bins.size(), getTotalItemCount());
    }
}
