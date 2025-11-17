package com.ecosmart.waste.service;

import com.ecosmart.waste.database.DatabaseManager;
import com.ecosmart.waste.model.Bin;
import com.ecosmart.waste.model.WasteItem;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating predictive analytics on bin capacity.
 * Combines statistical analysis with Google Gemini AI for enhanced accuracy.
 */
public class PredictionService {
    private static final String GEMINI_API_KEY = System.getenv().getOrDefault("GEMINI_API_KEY", "");
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    private static final int ANALYSIS_DAYS = 30;
    private static final double CAPACITY_THRESHOLD = 0.8; // 80%

    private final DatabaseManager dbManager;
    private final OkHttpClient httpClient;
    private final Gson gson;

    public PredictionService() {
        this.dbManager = DatabaseManager.getInstance();
        this.httpClient = new OkHttpClient();
        this.gson = new Gson();
    }

    /**
     * Generates a prediction for when a bin will reach 80% capacity.
     * Combines statistical analysis with AI-enhanced prediction.
     *
     * @param bin The bin to analyze
     * @return Map containing forecast date, confidence level, and additional metrics
     */
    public Map<String, Object> generatePrediction(Bin bin) {
        try {
            // Step 1: Retrieve last 30 days of waste items
            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate = endDate.minusDays(ANALYSIS_DAYS);
            List<WasteItem> historicalItems = dbManager.getWasteItemsByBinIdAndDateRange(
                    bin.getId(), startDate, endDate);

            // Step 2: Calculate statistical prediction
            Map<String, Object> statisticalPrediction = calculateStatisticalPrediction(bin, historicalItems);

            // Step 3: Generate AI-enhanced prediction using Gemini
            Map<String, Object> aiPrediction = generateAIPrediction(bin, historicalItems);

            // Step 4: Combine both predictions
            Map<String, Object> finalPrediction = combinePredictions(
                    statisticalPrediction, aiPrediction, bin);

            return finalPrediction;

        } catch (Exception e) {
            System.err.println("Error generating prediction: " + e.getMessage());
            e.printStackTrace();

            // Return fallback prediction
            return createFallbackPrediction(bin);
        }
    }

    /**
     * Calculates prediction based on statistical analysis.
     */
    private Map<String, Object> calculateStatisticalPrediction(Bin bin, List<WasteItem> historicalItems) {
        Map<String, Object> prediction = new HashMap<>();

        // Calculate daily average deposition rate
        double dailyAverage = calculateDailyAverage(historicalItems, ANALYSIS_DAYS);

        // Determine items remaining until 80% capacity
        int thresholdItemCount = (int) Math.ceil(bin.getMaxCapacity() * CAPACITY_THRESHOLD);
        int currentItemCount = bin.getCurrentItemCount();
        int itemsRemaining = Math.max(0, thresholdItemCount - currentItemCount);

        // Project days until threshold
        double daysUntilThreshold = dailyAverage > 0 ? itemsRemaining / dailyAverage : -1;

        // Calculate forecast date
        LocalDateTime forecastDate = null;
        if (daysUntilThreshold >= 0) {
            forecastDate = LocalDateTime.now().plusDays((long) Math.ceil(daysUntilThreshold));
        }

        // Calculate confidence based on data consistency
        double confidence = calculateConfidence(historicalItems, dailyAverage);

        prediction.put("method", "statistical");
        prediction.put("dailyAverage", Math.round(dailyAverage * 100.0) / 100.0);
        prediction.put("itemsRemaining", itemsRemaining);
        prediction.put("daysUntilThreshold", Math.round(daysUntilThreshold * 100.0) / 100.0);
        prediction.put("forecastDate", forecastDate != null ? forecastDate.toString() : null);
        prediction.put("confidence", Math.round(confidence * 100.0) / 100.0);

        return prediction;
    }

    /**
     * Generates AI-enhanced prediction using Google Gemini API.
     */
    private Map<String, Object> generateAIPrediction(Bin bin, List<WasteItem> historicalItems) {
        Map<String, Object> prediction = new HashMap<>();

        try {
            // Build prompt with historical patterns
            String prompt = buildGeminiPrompt(bin, historicalItems);

            // Call Gemini API
            String aiResponse = callGeminiAPI(prompt);

            // Parse AI response
            prediction = parseAIResponse(aiResponse, bin);
            prediction.put("method", "ai");

        } catch (Exception e) {
            System.err.println("AI prediction failed, using statistical only: " + e.getMessage());
            prediction.put("method", "ai");
            prediction.put("available", false);
            prediction.put("error", e.getMessage());
        }

        return prediction;
    }

    /**
     * Builds a structured prompt for Gemini AI.
     */
    private String buildGeminiPrompt(Bin bin, List<WasteItem> items) {
        // Analyze patterns by day of week and time
        Map<String, Integer> dayOfWeekCounts = new HashMap<>();
        Map<Integer, Integer> hourCounts = new HashMap<>();

        for (WasteItem item : items) {
            String dayOfWeek = item.getTimestamp().getDayOfWeek().toString();
            int hour = item.getTimestamp().getHour();

            dayOfWeekCounts.put(dayOfWeek, dayOfWeekCounts.getOrDefault(dayOfWeek, 0) + 1);
            hourCounts.put(hour, hourCounts.getOrDefault(hour, 0) + 1);
        }

        return String.format(
                "Analyze this waste bin data and predict when it will reach 80%% capacity:\n\n" +
                        "Current Status:\n" +
                        "- Location: %s\n" +
                        "- Current items: %d / %d (%.1f%% full)\n" +
                        "- Items until 80%% threshold: %d\n\n" +
                        "Historical Data (Last 30 days):\n" +
                        "- Total items collected: %d\n" +
                        "- Daily average: %.2f items\n" +
                        "- Distribution by day of week: %s\n" +
                        "- Peak hours: %s\n\n" +
                        "Waste Composition:\n" +
                        "%s\n\n" +
                        "Based on these patterns, predict:\n" +
                        "1. How many days until the bin reaches 80%% capacity?\n" +
                        "2. What is your confidence level (0-100)?\n" +
                        "3. Are there any concerning trends?\n\n" +
                        "Respond in JSON format with keys: daysUntilThreshold, confidence, insights",
                bin.getLocation(),
                bin.getCurrentItemCount(),
                bin.getMaxCapacity(),
                bin.getCapacityPercentage(),
                bin.getItemsUntilThreshold(),
                items.size(),
                calculateDailyAverage(items, ANALYSIS_DAYS),
                dayOfWeekCounts.toString(),
                getTopHours(hourCounts, 3).toString(),
                bin.getWasteComposition().toString()
        );
    }

    /**
     * Calls the Google Gemini API.
     */
    private String callGeminiAPI(String prompt) throws IOException {
        if (GEMINI_API_KEY.isEmpty()) {
            throw new IOException("GEMINI_API_KEY not configured");
        }

        // Build request body
        JsonObject requestBody = new JsonObject();
        JsonArray contents = new JsonArray();
        JsonObject content = new JsonObject();
        JsonArray parts = new JsonArray();
        JsonObject part = new JsonObject();

        part.addProperty("text", prompt);
        parts.add(part);
        content.add("parts", parts);
        contents.add(content);
        requestBody.add("contents", contents);

        // Make API call
        RequestBody body = RequestBody.create(
                requestBody.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(GEMINI_API_URL + "?key=" + GEMINI_API_KEY)
                .post(body)
                .build();

        try (okhttp3.Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Gemini API call failed: " + response.code());
            }

            return response.body().string();
        }
    }

    /**
     * Parses AI response from Gemini.
     */
    private Map<String, Object> parseAIResponse(String response, Bin bin) {
        Map<String, Object> prediction = new HashMap<>();

        try {
            JsonObject jsonResponse = gson.fromJson(response, JsonObject.class);
            JsonArray candidates = jsonResponse.getAsJsonArray("candidates");

            if (candidates != null && candidates.size() > 0) {
                JsonObject candidate = candidates.get(0).getAsJsonObject();
                JsonObject content = candidate.getAsJsonObject("content");
                JsonArray parts = content.getAsJsonArray("parts");

                if (parts != null && parts.size() > 0) {
                    String text = parts.get(0).getAsJsonObject().get("text").getAsString();

                    // Extract JSON from response (AI might wrap it in markdown)
                    text = text.replaceAll("```json\\n", "").replaceAll("```", "").trim();

                    // Parse the AI's prediction
                    JsonObject aiPrediction = gson.fromJson(text, JsonObject.class);

                    double daysUntilThreshold = aiPrediction.get("daysUntilThreshold").getAsDouble();
                    double confidence = aiPrediction.get("confidence").getAsDouble();
                    String insights = aiPrediction.has("insights") ?
                            aiPrediction.get("insights").getAsString() : "";

                    LocalDateTime forecastDate = LocalDateTime.now().plusDays((long) Math.ceil(daysUntilThreshold));

                    prediction.put("daysUntilThreshold", Math.round(daysUntilThreshold * 100.0) / 100.0);
                    prediction.put("forecastDate", forecastDate.toString());
                    prediction.put("confidence", confidence);
                    prediction.put("insights", insights);
                    prediction.put("available", true);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse AI response: " + e.getMessage());
            prediction.put("available", false);
        }

        return prediction;
    }

    /**
     * Combines statistical and AI predictions by averaging.
     */
    private Map<String, Object> combinePredictions(
            Map<String, Object> statistical,
            Map<String, Object> ai,
            Bin bin) {

        Map<String, Object> combined = new HashMap<>();

        // Get statistical values
        double statDays = (double) statistical.get("daysUntilThreshold");
        double statConfidence = (double) statistical.get("confidence");

        // Check if AI prediction is available
        boolean aiAvailable = ai.containsKey("available") && (boolean) ai.get("available");

        double finalDays;
        double finalConfidence;
        LocalDateTime forecastDate;

        if (aiAvailable && ai.containsKey("daysUntilThreshold")) {
            // Average both predictions
            double aiDays = (double) ai.get("daysUntilThreshold");
            double aiConfidence = (double) ai.get("confidence");

            finalDays = (statDays + aiDays) / 2.0;
            finalConfidence = (statConfidence + aiConfidence) / 2.0;

            combined.put("aiInsights", ai.get("insights"));
            combined.put("predictionMethod", "hybrid");
        } else {
            // Use statistical only
            finalDays = statDays;
            finalConfidence = statConfidence;
            combined.put("predictionMethod", "statistical");
        }

        forecastDate = finalDays >= 0 ?
                LocalDateTime.now().plusDays((long) Math.ceil(finalDays)) : null;

        // Build final prediction
        combined.put("binId", bin.getId());
        combined.put("location", bin.getLocation());
        combined.put("currentStatus", Map.of(
                "currentItems", bin.getCurrentItemCount(),
                "maxCapacity", bin.getMaxCapacity(),
                "capacityPercentage", Math.round(bin.getCapacityPercentage() * 100.0) / 100.0,
                "itemsUntilThreshold", bin.getItemsUntilThreshold()
        ));
        combined.put("daysUntilThreshold", Math.round(finalDays * 100.0) / 100.0);
        combined.put("forecastDate", forecastDate != null ? forecastDate.toString() : null);
        combined.put("confidence", Math.round(finalConfidence * 100.0) / 100.0);
        combined.put("dailyAverage", statistical.get("dailyAverage"));
        combined.put("wasteComposition", bin.getWasteComposition());
        combined.put("timestamp", LocalDateTime.now().toString());

        return combined;
    }

    /**
     * Calculates daily average deposition rate.
     */
    private double calculateDailyAverage(List<WasteItem> items, int days) {
        if (items.isEmpty() || days == 0) {
            return 0.0;
        }
        return (double) items.size() / days;
    }

    /**
     * Calculates confidence based on data consistency.
     */
    private double calculateConfidence(List<WasteItem> items, double average) {
        if (items.isEmpty() || average == 0) {
            return 0.0;
        }

        // Group items by day and calculate variance
        Map<LocalDate, Long> dailyCounts = items.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getTimestamp().toLocalDate(),
                        Collectors.counting()
                ));

        // Calculate standard deviation
        double variance = dailyCounts.values().stream()
                .mapToDouble(count -> Math.pow(count - average, 2))
                .average()
                .orElse(0.0);

        double stdDev = Math.sqrt(variance);

        // Convert to confidence (lower variance = higher confidence)
        double coefficientOfVariation = average > 0 ? stdDev / average : 1.0;
        double confidence = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));

        return confidence;
    }

    /**
     * Gets top N hours by item count.
     */
    private List<Integer> getTopHours(Map<Integer, Integer> hourCounts, int n) {
        return hourCounts.entrySet().stream()
                .sorted(Map.Entry.<Integer, Integer>comparingByValue().reversed())
                .limit(n)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /**
     * Creates a fallback prediction when analysis fails.
     */
    private Map<String, Object> createFallbackPrediction(Bin bin) {
        Map<String, Object> fallback = new HashMap<>();

        fallback.put("binId", bin.getId());
        fallback.put("location", bin.getLocation());
        fallback.put("currentStatus", Map.of(
                "currentItems", bin.getCurrentItemCount(),
                "maxCapacity", bin.getMaxCapacity(),
                "capacityPercentage", bin.getCapacityPercentage()
        ));
        fallback.put("predictionMethod", "fallback");
        fallback.put("daysUntilThreshold", -1);
        fallback.put("forecastDate", null);
        fallback.put("confidence", 0);
        fallback.put("error", "Insufficient data for prediction");

        return fallback;
    }
}
