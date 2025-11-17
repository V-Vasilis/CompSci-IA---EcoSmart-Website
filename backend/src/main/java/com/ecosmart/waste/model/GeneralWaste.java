package com.ecosmart.waste.model;

import java.time.LocalDateTime;

/**
 * Concrete implementation of WasteItem for general (non-recyclable) waste.
 * Demonstrates polymorphic behavior for non-recyclable items.
 */
public class GeneralWaste extends WasteItem {

    public GeneralWaste(Long binId, String imageUrl, String specificType) {
        super(binId, imageUrl, specificType);
    }

    public GeneralWaste(Long id, Long binId, String imageUrl, String specificType, LocalDateTime timestamp) {
        super(id, binId, imageUrl, specificType, timestamp);
    }

    @Override
    public boolean isRecyclable() {
        // General waste is not recyclable by definition
        return false;
    }

    @Override
    public String getRecyclingInstructions() {
        return "This item cannot be recycled through standard programs. " +
               "Dispose in general waste bin. Consider reducing usage of similar items in the future.";
    }

    @Override
    public String getCategory() {
        return "General";
    }
}
