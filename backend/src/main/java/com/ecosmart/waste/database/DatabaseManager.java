package com.ecosmart.waste.database;

import com.ecosmart.waste.model.*;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Singleton pattern database manager for MySQL connectivity.
 * Maintains a single JDBC connection and provides data access methods.
 */
public class DatabaseManager {
    private static DatabaseManager instance;
    private Connection connection;

    // Database configuration
    private static final String DB_URL = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/ecosmart_waste");
    private static final String DB_USER = System.getenv().getOrDefault("DB_USER", "root");
    private static final String DB_PASSWORD = System.getenv().getOrDefault("DB_PASSWORD", "");

    /**
     * Private constructor to prevent instantiation.
     * Implements Singleton pattern.
     */
    private DatabaseManager() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            this.connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
            System.out.println("Database connection established successfully");
        } catch (ClassNotFoundException | SQLException e) {
            System.err.println("Failed to establish database connection: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Returns the singleton instance of DatabaseManager.
     */
    public static synchronized DatabaseManager getInstance() {
        if (instance == null) {
            instance = new DatabaseManager();
        }
        return instance;
    }

    /**
     * Gets the database connection.
     */
    public Connection getConnection() {
        try {
            // Check if connection is still valid
            if (connection == null || connection.isClosed()) {
                connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return connection;
    }

    // ==================== SCHOOL OPERATIONS ====================

    /**
     * Retrieves a school by ID.
     */
    public School getSchoolById(Long schoolId) throws SQLException {
        String query = "SELECT * FROM schools WHERE id = ?";

        try (PreparedStatement stmt = getConnection().prepareStatement(query)) {
            stmt.setLong(1, schoolId);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return new School(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("address"),
                        rs.getString("contact_email")
                );
            }
        }
        return null;
    }

    /**
     * Retrieves all schools.
     */
    public List<School> getAllSchools() throws SQLException {
        List<School> schools = new ArrayList<>();
        String query = "SELECT * FROM schools";

        try (Statement stmt = getConnection().createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            while (rs.next()) {
                schools.add(new School(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("address"),
                        rs.getString("contact_email")
                ));
            }
        }
        return schools;
    }

    // ==================== BIN OPERATIONS ====================

    /**
     * Retrieves all bins for a specific school.
     */
    public List<Bin> getBinsBySchoolId(Long schoolId) throws SQLException {
        List<Bin> bins = new ArrayList<>();
        String query = "SELECT * FROM bins WHERE school_id = ?";

        try (PreparedStatement stmt = getConnection().prepareStatement(query)) {
            stmt.setLong(1, schoolId);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                bins.add(new Bin(
                        rs.getLong("id"),
                        rs.getLong("school_id"),
                        rs.getString("location"),
                        rs.getInt("max_capacity")
                ));
            }
        }
        return bins;
    }

    /**
     * Retrieves a bin by ID with all its waste items loaded.
     */
    public Bin getBinById(Long binId) throws SQLException {
        String query = "SELECT * FROM bins WHERE id = ?";

        try (PreparedStatement stmt = getConnection().prepareStatement(query)) {
            stmt.setLong(1, binId);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                Bin bin = new Bin(
                        rs.getLong("id"),
                        rs.getLong("school_id"),
                        rs.getString("location"),
                        rs.getInt("max_capacity")
                );

                // Load waste items for this bin
                List<WasteItem> items = getWasteItemsByBinId(binId);
                bin.setItems(items);

                return bin;
            }
        }
        return null;
    }

    // ==================== WASTE ITEM OPERATIONS ====================

    /**
     * Retrieves all waste items for a specific bin.
     */
    public List<WasteItem> getWasteItemsByBinId(Long binId) throws SQLException {
        List<WasteItem> items = new ArrayList<>();
        String query = "SELECT * FROM waste_items WHERE bin_id = ? ORDER BY timestamp DESC";

        try (PreparedStatement stmt = getConnection().prepareStatement(query)) {
            stmt.setLong(1, binId);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                items.add(createWasteItemFromResultSet(rs));
            }
        }
        return items;
    }

    /**
     * Retrieves waste items for a bin within a date range.
     */
    public List<WasteItem> getWasteItemsByBinIdAndDateRange(Long binId, LocalDateTime start, LocalDateTime end) throws SQLException {
        List<WasteItem> items = new ArrayList<>();
        String query = "SELECT * FROM waste_items WHERE bin_id = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp DESC";

        try (PreparedStatement stmt = getConnection().prepareStatement(query)) {
            stmt.setLong(1, binId);
            stmt.setTimestamp(2, Timestamp.valueOf(start));
            stmt.setTimestamp(3, Timestamp.valueOf(end));
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                items.add(createWasteItemFromResultSet(rs));
            }
        }
        return items;
    }

    /**
     * Retrieves waste items for a school within a date range.
     */
    public List<WasteItem> getWasteItemsBySchoolIdAndDateRange(Long schoolId, LocalDateTime start, LocalDateTime end) throws SQLException {
        List<WasteItem> items = new ArrayList<>();
        String query = "SELECT wi.* FROM waste_items wi " +
                       "JOIN bins b ON wi.bin_id = b.id " +
                       "WHERE b.school_id = ? AND wi.timestamp BETWEEN ? AND ? " +
                       "ORDER BY wi.timestamp DESC";

        try (PreparedStatement stmt = getConnection().prepareStatement(query)) {
            stmt.setLong(1, schoolId);
            stmt.setTimestamp(2, Timestamp.valueOf(start));
            stmt.setTimestamp(3, Timestamp.valueOf(end));
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                items.add(createWasteItemFromResultSet(rs));
            }
        }
        return items;
    }

    /**
     * Inserts a new waste item into the database.
     */
    public Long insertWasteItem(WasteItem item) throws SQLException {
        String query = "INSERT INTO waste_items (bin_id, waste_type, category, image_url, timestamp) VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = getConnection().prepareStatement(query, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, item.getBinId());
            stmt.setString(2, item.getWasteType());
            stmt.setString(3, item.getCategory());
            stmt.setString(4, item.getImageUrl());
            stmt.setTimestamp(5, Timestamp.valueOf(item.getTimestamp()));

            int affectedRows = stmt.executeUpdate();

            if (affectedRows == 0) {
                throw new SQLException("Creating waste item failed, no rows affected.");
            }

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    Long id = generatedKeys.getLong(1);
                    item.setId(id);
                    return id;
                } else {
                    throw new SQLException("Creating waste item failed, no ID obtained.");
                }
            }
        }
    }

    /**
     * Creates appropriate WasteItem subclass instance from ResultSet.
     */
    private WasteItem createWasteItemFromResultSet(ResultSet rs) throws SQLException {
        Long id = rs.getLong("id");
        Long binId = rs.getLong("bin_id");
        String wasteType = rs.getString("waste_type");
        String category = rs.getString("category");
        String imageUrl = rs.getString("image_url");
        LocalDateTime timestamp = rs.getTimestamp("timestamp").toLocalDateTime();

        // Create appropriate subclass based on category
        WasteItem item;
        switch (category.toLowerCase()) {
            case "paper":
                item = new Paper(id, binId, imageUrl, wasteType, timestamp);
                break;
            case "plastic":
                item = new Plastic(id, binId, imageUrl, wasteType, timestamp);
                break;
            default:
                item = new GeneralWaste(id, binId, imageUrl, wasteType, timestamp);
                break;
        }

        return item;
    }

    /**
     * Closes the database connection.
     */
    public void close() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
                System.out.println("Database connection closed");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
