package com.ecosmart.waste.websocket;

import com.ecosmart.waste.model.Bin;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for real-time bin updates.
 * Maintains a concurrent set of active client sessions and broadcasts updates.
 */
@WebSocket
public class BinWebSocket {
    // Thread-safe set of active sessions
    private static final ConcurrentHashMap<Session, Long> sessions = new ConcurrentHashMap<>();
    private final Gson gson;

    public BinWebSocket() {
        this.gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
                .create();
    }

    /**
     * Called when a new WebSocket connection is established.
     */
    @OnWebSocketConnect
    public void onConnect(Session session) throws IOException {
        // Extract school ID from query parameter if provided
        String query = session.getUpgradeRequest().getQueryString();
        Long schoolId = extractSchoolId(query);

        sessions.put(session, schoolId);
        System.out.println("WebSocket connected: " + session.getRemoteAddress() +
                          " (School ID: " + (schoolId != null ? schoolId : "all") + ")");

        // Send welcome message
        Map<String, Object> welcome = new HashMap<>();
        welcome.put("type", "connection");
        welcome.put("status", "connected");
        welcome.put("message", "Real-time updates enabled");
        welcome.put("timestamp", System.currentTimeMillis());

        sendMessage(session, welcome);
    }

    /**
     * Called when a WebSocket connection is closed.
     */
    @OnWebSocketClose
    public void onClose(Session session, int statusCode, String reason) {
        sessions.remove(session);
        System.out.println("WebSocket closed: " + session.getRemoteAddress() +
                          " (Code: " + statusCode + ", Reason: " + reason + ")");
    }

    /**
     * Called when a message is received from a client.
     */
    @OnWebSocketMessage
    public void onMessage(Session session, String message) {
        System.out.println("WebSocket message received: " + message);

        try {
            // Parse message and handle different types
            Map<String, Object> data = gson.fromJson(message, Map.class);
            String type = (String) data.get("type");

            if ("subscribe".equals(type)) {
                // Update school filter for this session
                Double schoolIdDouble = (Double) data.get("schoolId");
                Long schoolId = schoolIdDouble != null ? schoolIdDouble.longValue() : null;
                sessions.put(session, schoolId);

                Map<String, Object> response = new HashMap<>();
                response.put("type", "subscription");
                response.put("status", "subscribed");
                response.put("schoolId", schoolId);

                sendMessage(session, response);
            } else if ("ping".equals(type)) {
                // Respond to ping for keep-alive
                Map<String, Object> pong = new HashMap<>();
                pong.put("type", "pong");
                pong.put("timestamp", System.currentTimeMillis());

                sendMessage(session, pong);
            }
        } catch (Exception e) {
            System.err.println("Error processing WebSocket message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Called when an error occurs.
     */
    @OnWebSocketError
    public void onError(Session session, Throwable error) {
        System.err.println("WebSocket error: " + error.getMessage());
        error.printStackTrace();
    }

    /**
     * Broadcasts bin update to all connected clients.
     * Implements real-time functionality for dashboard updates within 5-second window.
     */
    public void broadcastBinUpdate(Bin bin) {
        Map<String, Object> update = new HashMap<>();
        update.put("type", "bin_update");
        update.put("timestamp", System.currentTimeMillis());
        update.put("binId", bin.getId());
        update.put("schoolId", bin.getSchoolId());
        update.put("location", bin.getLocation());
        update.put("currentItemCount", bin.getCurrentItemCount());
        update.put("maxCapacity", bin.getMaxCapacity());
        update.put("capacityPercentage", bin.getCapacityPercentage());
        update.put("isNearingCapacity", bin.isNearingCapacity());
        update.put("itemsUntilThreshold", bin.getItemsUntilThreshold());
        update.put("wasteComposition", bin.getWasteComposition());
        update.put("recyclablePercentage", bin.getRecyclablePercentage());

        String jsonUpdate = gson.toJson(update);

        // Broadcast to all sessions subscribed to this school or all schools
        sessions.forEach((session, schoolId) -> {
            if (session.isOpen() && (schoolId == null || schoolId.equals(bin.getSchoolId()))) {
                try {
                    session.getRemote().sendString(jsonUpdate);
                } catch (IOException e) {
                    System.err.println("Failed to send WebSocket update: " + e.getMessage());
                }
            }
        });

        System.out.println("Broadcasted bin update for bin " + bin.getId() +
                          " to " + sessions.size() + " active sessions");
    }

    /**
     * Broadcasts a custom message to all connected clients.
     */
    public void broadcastMessage(String type, Map<String, Object> data) {
        data.put("type", type);
        data.put("timestamp", System.currentTimeMillis());

        String jsonMessage = gson.toJson(data);

        sessions.forEach((session, schoolId) -> {
            if (session.isOpen()) {
                try {
                    session.getRemote().sendString(jsonMessage);
                } catch (IOException e) {
                    System.err.println("Failed to send WebSocket message: " + e.getMessage());
                }
            }
        });
    }

    /**
     * Sends a message to a specific session.
     */
    private void sendMessage(Session session, Map<String, Object> data) {
        if (session.isOpen()) {
            try {
                String jsonMessage = gson.toJson(data);
                session.getRemote().sendString(jsonMessage);
            } catch (IOException e) {
                System.err.println("Failed to send message to session: " + e.getMessage());
            }
        }
    }

    /**
     * Extracts school ID from query string.
     */
    private Long extractSchoolId(String query) {
        if (query != null && query.contains("schoolId=")) {
            try {
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("schoolId=")) {
                        String value = param.split("=")[1];
                        return Long.parseLong(value);
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to parse schoolId from query: " + e.getMessage());
            }
        }
        return null;
    }

    /**
     * Returns the number of active WebSocket connections.
     */
    public int getActiveConnectionCount() {
        return sessions.size();
    }

    /**
     * Closes all active sessions (for shutdown).
     */
    public void closeAllSessions() {
        sessions.forEach((session, schoolId) -> {
            if (session.isOpen()) {
                session.close(1000, "Server shutdown");
            }
        });
        sessions.clear();
    }
}
