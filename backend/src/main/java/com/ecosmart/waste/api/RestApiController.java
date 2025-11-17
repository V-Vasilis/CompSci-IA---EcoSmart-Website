package com.ecosmart.waste.api;

import com.ecosmart.waste.database.DatabaseManager;
import com.ecosmart.waste.model.*;
import com.ecosmart.waste.service.PredictionService;
import com.ecosmart.waste.service.CSVExporter;
import com.ecosmart.waste.websocket.BinWebSocket;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import spark.Request;
import spark.Response;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static spark.Spark.*;

/**
 * REST API Controller using Spark framework.
 * Provides lightweight endpoints for the waste management system.
 */
public class RestApiController {
    private final DatabaseManager dbManager;
    private final PredictionService predictionService;
    private final CSVExporter csvExporter;
    private final BinWebSocket webSocketHandler;
    private final Gson gson;

    public RestApiController(BinWebSocket webSocketHandler) {
        this.dbManager = DatabaseManager.getInstance();
        this.predictionService = new PredictionService();
        this.csvExporter = new CSVExporter();
        this.webSocketHandler = webSocketHandler;
        this.gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
                .create();
    }

    /**
     * Initializes all REST API endpoints.
     */
    public void initializeRoutes() {
        // Enable CORS
        enableCORS();

        // API Routes
        path("/api", () -> {
            // Get all bins for a school
            get("/schools/:schoolId/bins", this::getSchoolBins);

            // Get individual bin details
            get("/bins/:binId", this::getBinDetails);

            // Receive new waste item from AI camera
            post("/bins/:binId/items", this::addWasteItem);

            // Get predictions for a bin
            get("/bins/:binId/predictions", this::getBinPredictions);

            // Export CSV data
            get("/export/:schoolId", this::exportSchoolData);

            // Get school statistics
            get("/schools/:schoolId/statistics", this::getSchoolStatistics);
        });

        // Exception handling
        exception(Exception.class, (e, req, res) -> {
            res.status(500);
            res.type("application/json");
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            res.body(gson.toJson(error));
            e.printStackTrace();
        });

        // Not found
        notFound((req, res) -> {
            res.type("application/json");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Route not found");
            return gson.toJson(error);
        });
    }

    /**
     * GET /api/schools/:schoolId/bins
     * Retrieves all bins for a specific school with current status.
     */
    private String getSchoolBins(Request req, Response res) {
        try {
            Long schoolId = Long.parseLong(req.params(":schoolId"));
            List<Bin> bins = dbManager.getBinsBySchoolId(schoolId);

            // Load items for each bin
            for (Bin bin : bins) {
                List<WasteItem> items = dbManager.getWasteItemsByBinId(bin.getId());
                bin.setItems(items);
            }

            res.type("application/json");
            return gson.toJson(bins);
        } catch (Exception e) {
            res.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve bins: " + e.getMessage());
            return gson.toJson(error);
        }
    }

    /**
     * GET /api/bins/:binId
     * Retrieves detailed information about a specific bin.
     */
    private String getBinDetails(Request req, Response res) {
        try {
            Long binId = Long.parseLong(req.params(":binId"));
            Bin bin = dbManager.getBinById(binId);

            if (bin == null) {
                res.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Bin not found");
                return gson.toJson(error);
            }

            // Build detailed response
            Map<String, Object> response = new HashMap<>();
            response.put("id", bin.getId());
            response.put("schoolId", bin.getSchoolId());
            response.put("location", bin.getLocation());
            response.put("maxCapacity", bin.getMaxCapacity());
            response.put("currentItemCount", bin.getCurrentItemCount());
            response.put("capacityPercentage", bin.getCapacityPercentage());
            response.put("isNearingCapacity", bin.isNearingCapacity());
            response.put("itemsUntilThreshold", bin.getItemsUntilThreshold());
            response.put("wasteComposition", bin.getWasteComposition());
            response.put("recyclablePercentage", bin.getRecyclablePercentage());
            response.put("items", bin.getItems());

            res.type("application/json");
            return gson.toJson(response);
        } catch (Exception e) {
            res.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve bin details: " + e.getMessage());
            return gson.toJson(error);
        }
    }

    /**
     * POST /api/bins/:binId/items
     * Receives new waste item from AI camera system.
     * Body: { "wasteType": "...", "category": "...", "imageUrl": "..." }
     */
    private String addWasteItem(Request req, Response res) {
        try {
            Long binId = Long.parseLong(req.params(":binId"));

            // Parse request body
            JsonObject jsonBody = gson.fromJson(req.body(), JsonObject.class);
            String wasteType = jsonBody.get("wasteType").getAsString();
            String category = jsonBody.get("category").getAsString();
            String imageUrl = jsonBody.get("imageUrl").getAsString();

            // Create appropriate WasteItem subclass
            WasteItem item = createWasteItem(binId, wasteType, category, imageUrl);

            // Insert into database
            Long itemId = dbManager.insertWasteItem(item);

            // Broadcast update via WebSocket for real-time dashboard updates
            Bin updatedBin = dbManager.getBinById(binId);
            webSocketHandler.broadcastBinUpdate(updatedBin);

            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("itemId", itemId);
            response.put("message", "Waste item added successfully");
            response.put("binStatus", Map.of(
                    "currentItemCount", updatedBin.getCurrentItemCount(),
                    "capacityPercentage", updatedBin.getCapacityPercentage(),
                    "isNearingCapacity", updatedBin.isNearingCapacity()
            ));

            res.status(201);
            res.type("application/json");
            return gson.toJson(response);
        } catch (Exception e) {
            res.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to add waste item: " + e.getMessage());
            return gson.toJson(error);
        }
    }

    /**
     * GET /api/bins/:binId/predictions
     * Generates predictions for when the bin will reach 80% capacity.
     */
    private String getBinPredictions(Request req, Response res) {
        try {
            Long binId = Long.parseLong(req.params(":binId"));
            Bin bin = dbManager.getBinById(binId);

            if (bin == null) {
                res.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Bin not found");
                return gson.toJson(error);
            }

            // Generate prediction
            Map<String, Object> prediction = predictionService.generatePrediction(bin);

            res.type("application/json");
            return gson.toJson(prediction);
        } catch (Exception e) {
            res.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to generate prediction: " + e.getMessage());
            return gson.toJson(error);
        }
    }

    /**
     * GET /api/export/:schoolId
     * Exports waste data as CSV for a school.
     * Query params: startDate, endDate (ISO format)
     */
    private String exportSchoolData(Request req, Response res) {
        try {
            Long schoolId = Long.parseLong(req.params(":schoolId"));

            // Parse date range from query parameters
            String startDateStr = req.queryParams("startDate");
            String endDateStr = req.queryParams("endDate");

            LocalDateTime startDate = startDateStr != null ? LocalDateTime.parse(startDateStr) : LocalDateTime.now().minusDays(30);
            LocalDateTime endDate = endDateStr != null ? LocalDateTime.parse(endDateStr) : LocalDateTime.now();

            // Get waste items for this school in date range
            List<WasteItem> items = dbManager.getWasteItemsBySchoolIdAndDateRange(schoolId, startDate, endDate);

            // Get bin information for context
            List<Bin> bins = dbManager.getBinsBySchoolId(schoolId);
            Map<Long, String> binLocations = new HashMap<>();
            for (Bin bin : bins) {
                binLocations.put(bin.getId(), bin.getLocation());
            }

            // Generate CSV
            String csv = csvExporter.exportToCSV(items, binLocations);

            res.type("text/csv");
            res.header("Content-Disposition", "attachment; filename=waste_data_school_" + schoolId + ".csv");
            return csv;
        } catch (Exception e) {
            res.status(500);
            res.type("application/json");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to export data: " + e.getMessage());
            return gson.toJson(error);
        }
    }

    /**
     * GET /api/schools/:schoolId/statistics
     * Retrieves comprehensive statistics for a school.
     */
    private String getSchoolStatistics(Request req, Response res) {
        try {
            Long schoolId = Long.parseLong(req.params(":schoolId"));
            School school = dbManager.getSchoolById(schoolId);

            if (school == null) {
                res.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "School not found");
                return gson.toJson(error);
            }

            // Load bins and items
            List<Bin> bins = dbManager.getBinsBySchoolId(schoolId);
            for (Bin bin : bins) {
                List<WasteItem> items = dbManager.getWasteItemsByBinId(bin.getId());
                bin.setItems(items);
                school.addBin(bin);
            }

            // Get school statistics
            Map<String, Object> stats = school.getSchoolStatistics();

            res.type("application/json");
            return gson.toJson(stats);
        } catch (Exception e) {
            res.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve statistics: " + e.getMessage());
            return gson.toJson(error);
        }
    }

    /**
     * Creates appropriate WasteItem subclass based on category.
     */
    private WasteItem createWasteItem(Long binId, String wasteType, String category, String imageUrl) {
        switch (category.toLowerCase()) {
            case "paper":
                return new Paper(binId, imageUrl, wasteType);
            case "plastic":
                return new Plastic(binId, imageUrl, wasteType);
            default:
                return new GeneralWaste(binId, imageUrl, wasteType);
        }
    }

    /**
     * Enables CORS for cross-origin requests.
     */
    private void enableCORS() {
        options("/*", (request, response) -> {
            String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
            if (accessControlRequestHeaders != null) {
                response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
            }

            String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
            if (accessControlRequestMethod != null) {
                response.header("Access-Control-Allow-Methods", accessControlRequestMethod);
            }

            return "OK";
        });

        before((request, response) -> {
            response.header("Access-Control-Allow-Origin", "*");
            response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        });
    }
}
