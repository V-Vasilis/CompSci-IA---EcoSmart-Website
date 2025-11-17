package com.ecosmart.waste.model;

import java.time.LocalDateTime;

/**
 * Concrete implementation of WasteItem for paper products.
 * Demonstrates polymorphic behavior specific to paper waste.
 */
public class Paper extends WasteItem {

    public Paper(Long binId, String imageUrl, String specificType) {
        super(binId, imageUrl, specificType);
    }

    public Paper(Long id, Long binId, String imageUrl, String specificType, LocalDateTime timestamp) {
        super(id, binId, imageUrl, specificType, timestamp);
    }

    @Override
    public boolean isRecyclable() {
        // Paper is generally recyclable unless contaminated
        String type = getWasteType().toLowerCase();
        return !type.contains("contaminated") && !type.contains("greasy");
    }

    @Override
    public String getRecyclingInstructions() {
        if (isRecyclable()) {
            return "Flatten cardboard boxes, remove any plastic tape or labels. " +
                   "Ensure paper is clean and dry. Place in blue recycling bin.";
        } else {
            return "This paper item appears contaminated. Please dispose in general waste bin.";
        }
    }

    @Override
    public String getCategory() {
        return "Paper";
    }
}
