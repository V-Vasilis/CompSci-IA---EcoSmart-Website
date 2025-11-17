package com.ecosmart.waste.model;

import java.time.LocalDateTime;

/**
 * Concrete implementation of WasteItem for plastic products.
 * Demonstrates polymorphic behavior specific to plastic waste.
 */
public class Plastic extends WasteItem {

    public Plastic(Long binId, String imageUrl, String specificType) {
        super(binId, imageUrl, specificType);
    }

    public Plastic(Long id, Long binId, String imageUrl, String specificType, LocalDateTime timestamp) {
        super(id, binId, imageUrl, specificType, timestamp);
    }

    @Override
    public boolean isRecyclable() {
        // Check if plastic type is recyclable (types 1, 2, 4, 5 are commonly recyclable)
        String type = getWasteType().toLowerCase();
        return type.contains("pet") || type.contains("hdpe") ||
               type.contains("ldpe") || type.contains("pp") ||
               type.contains("bottle") || type.contains("container");
    }

    @Override
    public String getRecyclingInstructions() {
        if (isRecyclable()) {
            return "Rinse containers to remove food residue. Remove caps and labels if possible. " +
                   "Crush bottles to save space. Place in yellow recycling bin.";
        } else {
            return "This plastic type is not recyclable in standard facilities. " +
                   "Check for specialized recycling programs or dispose in general waste.";
        }
    }

    @Override
    public String getCategory() {
        return "Plastic";
    }
}
