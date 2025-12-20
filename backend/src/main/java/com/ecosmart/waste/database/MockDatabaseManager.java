package com.ecosmart.waste.database;

import com.ecosmart.waste.model.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Mock database manager that provides in-memory data storage.
 * Used for development and testing when MySQL is not available.
 */
public class MockDatabaseManager {
    private static MockDatabaseManager instance;

    // In-memory storage
    private final Map<Long, School> schools = new HashMap<>();
    private final Map<Long, Bin> bins = new HashMap<>();
    private final List<WasteItem> wasteItems = new ArrayList<>();
    private final AtomicLong wasteItemIdGenerator = new AtomicLong(100);

    private MockDatabaseManager() {
        initializeMockData();
    }

    public static synchronized MockDatabaseManager getInstance() {
        if (instance == null) {
            instance = new MockDatabaseManager();
        }
        return instance;
    }

    /**
     * Initialize with sample data for development.
     */
    private void initializeMockData() {
        System.out.println("[Mock DB] Initializing mock data...");

        // Create sample school
        School school1 = new School(1L, "Demo High School", "123 Education Lane", "admin@demohigh.edu");
        schools.put(1L, school1);

        // Create sample bins with various locations
        String[] locations = {
            "Main Entrance",
            "Cafeteria - North",
            "Cafeteria - South",
            "Library",
            "Science Building",
            "Gymnasium",
            "Art Room",
            "Computer Lab"
        };

        int[] capacities = {50, 100, 100, 40, 60, 80, 45, 35};

        for (int i = 0; i < locations.length; i++) {
            Long binId = (long) (i + 1);
            Bin bin = new Bin(binId, 1L, locations[i], capacities[i]);
            bins.put(binId, bin);

            // Add some sample waste items to each bin
            addSampleWasteItems(bin, (int) (Math.random() * 20) + 5);
        }

        System.out.println("[Mock DB] Created " + schools.size() + " schools");
        System.out.println("[Mock DB] Created " + bins.size() + " bins");
        System.out.println("[Mock DB] Created " + wasteItems.size() + " waste items");
    }

    /**
     * Add sample waste items to a bin.
     */
    private void addSampleWasteItems(Bin bin, int count) {
        String[] paperTypes = {"Notebook paper", "Cardboard box", "Newspaper", "Magazine"};
        String[] plasticTypes = {"PET bottle", "HDPE container", "Plastic bag", "Food wrapper"};
        String[] generalTypes = {"Food waste", "Styrofoam", "Mixed materials", "Tissue"};

        Random rand = new Random();

        for (int i = 0; i < count; i++) {
            WasteItem item;
            Long itemId = wasteItemIdGenerator.getAndIncrement();
            LocalDateTime timestamp = LocalDateTime.now().minusHours(rand.nextInt(168)); // Within last week

            int category = rand.nextInt(3);
            switch (category) {
                case 0:
                    item = new Paper(itemId, bin.getId(), "/images/paper.jpg",
                                    paperTypes[rand.nextInt(paperTypes.length)], timestamp);
                    break;
                case 1:
                    item = new Plastic(itemId, bin.getId(), "/images/plastic.jpg",
                                      plasticTypes[rand.nextInt(plasticTypes.length)], timestamp);
                    break;
                default:
                    item = new GeneralWaste(itemId, bin.getId(), "/images/general.jpg",
                                           generalTypes[rand.nextInt(generalTypes.length)], timestamp);
                    break;
            }

            wasteItems.add(item);
            bin.addItem(item);
        }
    }

    // ==================== SCHOOL OPERATIONS ====================

    public School getSchoolById(Long schoolId) {
        return schools.get(schoolId);
    }

    public List<School> getAllSchools() {
        return new ArrayList<>(schools.values());
    }

    // ==================== BIN OPERATIONS ====================

    public List<Bin> getBinsBySchoolId(Long schoolId) {
        List<Bin> result = new ArrayList<>();
        for (Bin bin : bins.values()) {
            if (bin.getSchoolId().equals(schoolId)) {
                result.add(bin);
            }
        }
        return result;
    }

    public Bin getBinById(Long binId) {
        return bins.get(binId);
    }

    // ==================== WASTE ITEM OPERATIONS ====================

    public List<WasteItem> getWasteItemsByBinId(Long binId) {
        List<WasteItem> result = new ArrayList<>();
        for (WasteItem item : wasteItems) {
            if (item.getBinId().equals(binId)) {
                result.add(item);
            }
        }
        // Sort by timestamp descending
        result.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return result;
    }

    public List<WasteItem> getWasteItemsByBinIdAndDateRange(Long binId, LocalDateTime start, LocalDateTime end) {
        List<WasteItem> result = new ArrayList<>();
        for (WasteItem item : wasteItems) {
            if (item.getBinId().equals(binId) &&
                item.getTimestamp().isAfter(start) &&
                item.getTimestamp().isBefore(end)) {
                result.add(item);
            }
        }
        result.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return result;
    }

    public List<WasteItem> getWasteItemsBySchoolIdAndDateRange(Long schoolId, LocalDateTime start, LocalDateTime end) {
        List<WasteItem> result = new ArrayList<>();
        Set<Long> schoolBinIds = new HashSet<>();

        for (Bin bin : bins.values()) {
            if (bin.getSchoolId().equals(schoolId)) {
                schoolBinIds.add(bin.getId());
            }
        }

        for (WasteItem item : wasteItems) {
            if (schoolBinIds.contains(item.getBinId()) &&
                item.getTimestamp().isAfter(start) &&
                item.getTimestamp().isBefore(end)) {
                result.add(item);
            }
        }
        result.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return result;
    }

    public Long insertWasteItem(WasteItem item) {
        Long newId = wasteItemIdGenerator.getAndIncrement();
        item.setId(newId);
        wasteItems.add(item);

        // Also add to bin
        Bin bin = bins.get(item.getBinId());
        if (bin != null) {
            bin.addItem(item);
        }

        return newId;
    }

    public void close() {
        System.out.println("[Mock DB] Mock database closed");
    }
}
