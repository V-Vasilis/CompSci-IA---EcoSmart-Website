package com.ecosmart.waste.model;

import java.time.LocalDateTime;

/**
 * Abstract base class for all waste items in the system.
 * Demonstrates inheritance hierarchy and polymorphism.
 */
public abstract class WasteItem {
    private Long id;
    private Long binId;
    private String imageUrl;
    private LocalDateTime timestamp;
    private String wasteType;

    public WasteItem(Long binId, String imageUrl, String wasteType) {
        this.binId = binId;
        this.imageUrl = imageUrl;
        this.wasteType = wasteType;
        this.timestamp = LocalDateTime.now();
    }

    public WasteItem(Long id, Long binId, String imageUrl, String wasteType, LocalDateTime timestamp) {
        this.id = id;
        this.binId = binId;
        this.imageUrl = imageUrl;
        this.wasteType = wasteType;
        this.timestamp = timestamp;
    }

    /**
     * Polymorphic method to determine if the waste item is recyclable.
     * Each subclass implements its own logic.
     */
    public abstract boolean isRecyclable();

    /**
     * Polymorphic method to provide recycling instructions specific to the waste type.
     */
    public abstract String getRecyclingInstructions();

    /**
     * Returns the category of this waste item for classification purposes.
     */
    public abstract String getCategory();

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBinId() {
        return binId;
    }

    public void setBinId(Long binId) {
        this.binId = binId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getWasteType() {
        return wasteType;
    }

    public void setWasteType(String wasteType) {
        this.wasteType = wasteType;
    }

    @Override
    public String toString() {
        return String.format("%s[id=%d, type=%s, recyclable=%b, timestamp=%s]",
                getClass().getSimpleName(), id, wasteType, isRecyclable(), timestamp);
    }
}
