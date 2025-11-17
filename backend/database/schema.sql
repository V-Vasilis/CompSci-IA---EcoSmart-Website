-- EcoSmart Waste Management System Database Schema
-- MySQL Database Setup

-- Create database
CREATE DATABASE IF NOT EXISTS ecosmart_waste
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ecosmart_waste;

-- ==================== SCHOOLS TABLE ====================
-- Stores information about schools using the system

CREATE TABLE IF NOT EXISTS schools (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_school_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== BINS TABLE ====================
-- Stores information about waste bins in schools
-- Foreign key relationship to schools table

CREATE TABLE IF NOT EXISTS bins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    school_id BIGINT NOT NULL,
    location VARCHAR(255) NOT NULL COMMENT 'Physical location of bin (e.g., "Cafeteria", "Main Hallway")',
    max_capacity INT NOT NULL DEFAULT 100 COMMENT 'Maximum number of items the bin can hold',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_bin_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Indexes for performance
    INDEX idx_bin_school (school_id),
    INDEX idx_bin_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== WASTE_ITEMS TABLE ====================
-- Stores individual waste items scanned by AI cameras
-- Foreign key relationship to bins table

CREATE TABLE IF NOT EXISTS waste_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bin_id BIGINT NOT NULL,
    waste_type VARCHAR(255) NOT NULL COMMENT 'Specific type identified by AI (e.g., "PET Bottle", "Cardboard Box")',
    category ENUM('Paper', 'Plastic', 'General') NOT NULL COMMENT 'General category of waste',
    image_url VARCHAR(1000) COMMENT 'URL to image captured by AI camera',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the item was deposited',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_item_bin
        FOREIGN KEY (bin_id)
        REFERENCES bins(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Indexes for performance
    INDEX idx_item_bin (bin_id),
    INDEX idx_item_timestamp (timestamp),
    INDEX idx_item_category (category),
    INDEX idx_item_bin_timestamp (bin_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== SAMPLE DATA ====================
-- Insert sample schools

INSERT INTO schools (name, address, contact_email) VALUES
('Green Valley High School', '123 Education St, Green Valley, CA 94000', 'admin@greenvalley.edu'),
('Riverside Academy', '456 River Rd, Riverside, CA 94100', 'contact@riverside.edu'),
('Mountain View School', '789 Mountain Ave, Mountain View, CA 94200', 'info@mountainview.edu');

-- Insert sample bins
INSERT INTO bins (school_id, location, max_capacity) VALUES
-- Green Valley High School bins
(1, 'Main Cafeteria', 150),
(1, 'Library Entrance', 80),
(1, 'Gymnasium', 100),
(1, 'Science Building Hallway', 120),

-- Riverside Academy bins
(2, 'Student Commons', 140),
(2, 'Auditorium Lobby', 90),
(2, 'Athletic Field', 110),

-- Mountain View School bins
(3, 'Main Office', 70),
(3, 'Playground Area', 130),
(3, 'Computer Lab Hallway', 85);

-- Insert sample waste items (recent data for testing)
INSERT INTO waste_items (bin_id, waste_type, category, image_url, timestamp) VALUES
-- Main Cafeteria (Bin 1) - Recent items
(1, 'Plastic Water Bottle', 'Plastic', 'https://example.com/images/item001.jpg', NOW() - INTERVAL 2 HOUR),
(1, 'Cardboard Food Container', 'Paper', 'https://example.com/images/item002.jpg', NOW() - INTERVAL 3 HOUR),
(1, 'Food Wrapper', 'General', 'https://example.com/images/item003.jpg', NOW() - INTERVAL 5 HOUR),
(1, 'Notebook Paper', 'Paper', 'https://example.com/images/item004.jpg', NOW() - INTERVAL 1 DAY),
(1, 'Plastic Fork', 'Plastic', 'https://example.com/images/item005.jpg', NOW() - INTERVAL 1 DAY + INTERVAL 2 HOUR),

-- Library Entrance (Bin 2)
(2, 'Newspaper', 'Paper', 'https://example.com/images/item006.jpg', NOW() - INTERVAL 4 HOUR),
(2, 'Magazine', 'Paper', 'https://example.com/images/item007.jpg', NOW() - INTERVAL 6 HOUR),
(2, 'Coffee Cup', 'General', 'https://example.com/images/item008.jpg', NOW() - INTERVAL 8 HOUR),

-- Gymnasium (Bin 3)
(3, 'Sports Drink Bottle', 'Plastic', 'https://example.com/images/item009.jpg', NOW() - INTERVAL 3 HOUR),
(3, 'Energy Bar Wrapper', 'General', 'https://example.com/images/item010.jpg', NOW() - INTERVAL 5 HOUR),

-- Student Commons (Bin 5)
(5, 'Soda Can', 'Plastic', 'https://example.com/images/item011.jpg', NOW() - INTERVAL 1 HOUR),
(5, 'Pizza Box', 'Paper', 'https://example.com/images/item012.jpg', NOW() - INTERVAL 2 HOUR),
(5, 'Napkins', 'Paper', 'https://example.com/images/item013.jpg', NOW() - INTERVAL 3 HOUR);

-- Add historical data for prediction testing (last 30 days)
-- Simulating daily waste deposition with varying rates

DELIMITER $$

CREATE PROCEDURE generate_historical_data()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE days INT DEFAULT 30;
    DECLARE items_per_day INT;
    DECLARE current_date TIMESTAMP;

    WHILE i < days DO
        SET items_per_day = FLOOR(3 + (RAND() * 7)); -- 3-10 items per day
        SET current_date = NOW() - INTERVAL i DAY;

        -- Generate random items for this day
        WHILE items_per_day > 0 DO
            INSERT INTO waste_items (bin_id, waste_type, category, image_url, timestamp)
            VALUES (
                1 + FLOOR(RAND() * 10), -- Random bin
                CASE FLOOR(RAND() * 5)
                    WHEN 0 THEN 'Plastic Bottle'
                    WHEN 1 THEN 'Paper Sheet'
                    WHEN 2 THEN 'Food Wrapper'
                    WHEN 3 THEN 'Cardboard Box'
                    ELSE 'General Waste'
                END,
                CASE FLOOR(RAND() * 3)
                    WHEN 0 THEN 'Plastic'
                    WHEN 1 THEN 'Paper'
                    ELSE 'General'
                END,
                CONCAT('https://example.com/images/hist', UUID(), '.jpg'),
                current_date + INTERVAL FLOOR(RAND() * 23) HOUR
            );

            SET items_per_day = items_per_day - 1;
        END WHILE;

        SET i = i + 1;
    END WHILE;
END$$

DELIMITER ;

-- Execute the procedure to generate historical data
CALL generate_historical_data();

-- Drop the procedure after use
DROP PROCEDURE IF EXISTS generate_historical_data;

-- ==================== VIEWS ====================
-- Useful views for analytics

-- Bin capacity status view
CREATE OR REPLACE VIEW bin_capacity_status AS
SELECT
    b.id AS bin_id,
    b.school_id,
    s.name AS school_name,
    b.location,
    b.max_capacity,
    COUNT(wi.id) AS current_items,
    ROUND((COUNT(wi.id) / b.max_capacity) * 100, 2) AS capacity_percentage,
    CASE
        WHEN (COUNT(wi.id) / b.max_capacity) >= 0.8 THEN 'Critical'
        WHEN (COUNT(wi.id) / b.max_capacity) >= 0.6 THEN 'Warning'
        ELSE 'Normal'
    END AS status
FROM bins b
LEFT JOIN waste_items wi ON b.id = wi.bin_id
JOIN schools s ON b.school_id = s.id
GROUP BY b.id, b.school_id, s.name, b.location, b.max_capacity;

-- Daily waste statistics view
CREATE OR REPLACE VIEW daily_waste_stats AS
SELECT
    DATE(wi.timestamp) AS collection_date,
    b.school_id,
    s.name AS school_name,
    COUNT(wi.id) AS total_items,
    SUM(CASE WHEN wi.category = 'Paper' THEN 1 ELSE 0 END) AS paper_count,
    SUM(CASE WHEN wi.category = 'Plastic' THEN 1 ELSE 0 END) AS plastic_count,
    SUM(CASE WHEN wi.category = 'General' THEN 1 ELSE 0 END) AS general_count
FROM waste_items wi
JOIN bins b ON wi.bin_id = b.id
JOIN schools s ON b.school_id = s.id
GROUP BY DATE(wi.timestamp), b.school_id, s.name
ORDER BY collection_date DESC;

-- ==================== INDEXES FOR PERFORMANCE ====================
-- Additional composite indexes for common queries

CREATE INDEX idx_waste_items_bin_category ON waste_items(bin_id, category);
CREATE INDEX idx_waste_items_timestamp_category ON waste_items(timestamp, category);

-- ==================== PERMISSIONS ====================
-- Create application user with appropriate permissions
-- Note: Modify username and password as needed

CREATE USER IF NOT EXISTS 'ecosmart_app'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON ecosmart_waste.* TO 'ecosmart_app'@'localhost';
FLUSH PRIVILEGES;

-- ==================== COMPLETION MESSAGE ====================
SELECT 'Database schema created successfully!' AS Status;
SELECT COUNT(*) AS 'Total Schools' FROM schools;
SELECT COUNT(*) AS 'Total Bins' FROM bins;
SELECT COUNT(*) AS 'Total Waste Items' FROM waste_items;
