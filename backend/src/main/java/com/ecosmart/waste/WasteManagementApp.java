package com.ecosmart.waste;

import com.ecosmart.waste.api.RestApiController;
import com.ecosmart.waste.database.DatabaseManager;
import com.ecosmart.waste.websocket.BinWebSocket;

import static spark.Spark.*;

/**
 * Main application class for EcoSmart Waste Management System.
 * Initializes and configures the backend server with REST API and WebSocket support.
 */
public class WasteManagementApp {

    private static final int DEFAULT_PORT = 8080;
    private static final int WEBSOCKET_IDLE_TIMEOUT = 600000; // 10 minutes

    public static void main(String[] args) {
        // Print startup banner
        printBanner();

        // Configure server port
        int port = getPortFromEnvironment();
        port(port);

        // Configure server settings
        configureServer();

        // Initialize WebSocket handler
        BinWebSocket webSocketHandler = new BinWebSocket();

        // Configure WebSocket endpoint
        webSocket("/ws/bins", webSocketHandler);

        // Initialize REST API controller
        RestApiController apiController = new RestApiController(webSocketHandler);
        apiController.initializeRoutes();

        // Setup shutdown hook
        setupShutdownHook(webSocketHandler);

        // Wait for server initialization
        awaitInitialization();

        // Print startup success message
        System.out.println("\n=================================================");
        System.out.println("  EcoSmart Waste Management Backend Started!");
        System.out.println("=================================================");
        System.out.println("  Server running on port: " + port);
        System.out.println("  REST API: http://localhost:" + port + "/api");
        System.out.println("  WebSocket: ws://localhost:" + port + "/ws/bins");
        System.out.println("=================================================\n");

        // Test database connection
        testDatabaseConnection();
    }

    /**
     * Configures server settings including thread pool and timeouts.
     */
    private static void configureServer() {
        // Thread pool configuration
        int maxThreads = 20;
        int minThreads = 4;
        int timeOutMillis = 30000;

        threadPool(maxThreads, minThreads, timeOutMillis);

        // WebSocket idle timeout
        webSocketIdleTimeoutMillis(WEBSOCKET_IDLE_TIMEOUT);

        // Static file location (if needed for serving dashboard)
        // staticFiles.location("/public");

        // Enable exception handling
        exception(Exception.class, (e, req, res) -> {
            System.err.println("Unhandled exception: " + e.getMessage());
            e.printStackTrace();
        });

        // Add server initialization check
        init();
    }

    /**
     * Gets port from environment variable or uses default.
     */
    private static int getPortFromEnvironment() {
        String portEnv = System.getenv("PORT");
        if (portEnv != null) {
            try {
                return Integer.parseInt(portEnv);
            } catch (NumberFormatException e) {
                System.err.println("Invalid PORT environment variable, using default: " + DEFAULT_PORT);
            }
        }
        return DEFAULT_PORT;
    }

    /**
     * Sets up graceful shutdown hook.
     */
    private static void setupShutdownHook(BinWebSocket webSocketHandler) {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n=================================================");
            System.out.println("  Shutting down EcoSmart Backend...");
            System.out.println("=================================================");

            // Close all WebSocket connections
            System.out.println("Closing WebSocket connections...");
            webSocketHandler.closeAllSessions();

            // Close database connection
            System.out.println("Closing database connection...");
            DatabaseManager.getInstance().close();

            // Stop Spark server
            System.out.println("Stopping server...");
            stop();

            System.out.println("Shutdown complete.");
        }));
    }

    /**
     * Tests database connection on startup.
     */
    private static void testDatabaseConnection() {
        try {
            DatabaseManager dbManager = DatabaseManager.getInstance();

            if (dbManager.isUsingMockData()) {
                System.out.println("[✓] Mock Database: OK (Development Mode)");
                var schools = dbManager.getAllSchools();
                System.out.println("[✓] Mock data loaded: " + schools.size() + " schools available");
                System.out.println("\n    NOTE: Running with in-memory mock data.");
                System.out.println("    To use MySQL, configure DB_URL, DB_USER, DB_PASSWORD in .env");
                return;
            }

            if (dbManager.getConnection() != null && !dbManager.getConnection().isClosed()) {
                System.out.println("[✓] Database connection: OK");

                // Check if tables exist
                var schools = dbManager.getAllSchools();
                System.out.println("[✓] Database tables: OK (" + schools.size() + " schools found)");
            }
        } catch (Exception e) {
            System.err.println("[✗] Database connection: FAILED");
            System.err.println("    Error: " + e.getMessage());
            System.err.println("    Please check your database configuration.");
            System.err.println("\n    Environment variables:");
            System.err.println("    - DB_URL: " + System.getenv().getOrDefault("DB_URL", "not set"));
            System.err.println("    - DB_USER: " + System.getenv().getOrDefault("DB_USER", "not set"));
            System.err.println("    - DB_PASSWORD: " + (System.getenv("DB_PASSWORD") != null ? "***" : "not set"));
        }
    }

    /**
     * Prints application startup banner.
     */
    private static void printBanner() {
        System.out.println("\n");
        System.out.println("  ███████╗ ██████╗ ██████╗ ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗");
        System.out.println("  ██╔════╝██╔════╝██╔═══██╗██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝");
        System.out.println("  █████╗  ██║     ██║   ██║███████╗██╔████╔██║███████║██████╔╝   ██║   ");
        System.out.println("  ██╔══╝  ██║     ██║   ██║╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ");
        System.out.println("  ███████╗╚██████╗╚██████╔╝███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ");
        System.out.println("  ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ");
        System.out.println("\n  Waste Management Backend - Version 1.0.0");
        System.out.println("  Intelligent Waste Tracking & Analytics System\n");
    }

    /**
     * Prints environment configuration.
     */
    public static void printEnvironmentInfo() {
        System.out.println("\nEnvironment Configuration:");
        System.out.println("  - Java Version: " + System.getProperty("java.version"));
        System.out.println("  - OS: " + System.getProperty("os.name"));
        System.out.println("  - Working Directory: " + System.getProperty("user.dir"));
        System.out.println("  - Database URL: " + System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/ecosmart_waste"));
        System.out.println("  - Gemini API: " + (System.getenv("GEMINI_API_KEY") != null ? "Configured" : "Not configured"));
        System.out.println();
    }
}
