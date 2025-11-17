# EcoSmart Waste Management Backend

A robust Java backend for intelligent waste management system using three-tier architecture, REST API, real-time WebSocket updates, and AI-powered predictive analytics.

## Architecture Overview

### Three-Tier Architecture

1. **Presentation Layer**: REST API endpoints (Spark Framework) + WebSocket for real-time updates
2. **Business Logic Layer**: Services (Prediction, CSV Export), Object-Oriented models
3. **Data Access Layer**: DatabaseManager (Singleton pattern) with MySQL connectivity

### Key Design Patterns

- **Singleton**: DatabaseManager for single database connection
- **Inheritance & Polymorphism**: Abstract WasteItem base class with Paper, Plastic, GeneralWaste subclasses
- **Aggregation**: Bin contains List<WasteItem>, School contains List<Bin>
- **Strategy Pattern**: DataExporter interface with CSVExporter implementation

## Features

### Object-Oriented Design

- **Inheritance Hierarchy**:
  - Abstract `WasteItem` base class
  - Concrete subclasses: `Paper`, `Plastic`, `GeneralWaste`
  - Polymorphic methods: `isRecyclable()`, `getRecyclingInstructions()`, `getCategory()`

- **Aggregation**:
  - `Bin` class maintains `List<WasteItem>` collection
  - `School` class aggregates multiple `Bin` objects
  - Data aggregation algorithms for statistics and composition

### REST API Endpoints

Built with Spark Framework for lightweight, stateless operation:

- `GET /api/schools/:schoolId/bins` - Retrieve all bins for a school
- `GET /api/bins/:binId` - Get detailed bin information
- `POST /api/bins/:binId/items` - Add new waste item from AI camera
- `GET /api/bins/:binId/predictions` - Generate capacity predictions
- `GET /api/export/:schoolId` - Export waste data as CSV
- `GET /api/schools/:schoolId/statistics` - Get school-wide statistics

### Real-Time WebSocket Updates

- Maintains concurrent set of active client sessions
- Broadcasts JSON-serialized bin updates immediately when items added
- Ensures dashboard reflects changes within 5-second window
- Thread-safe with proper synchronization

### Predictive Analytics

Combines statistical analysis with Google Gemini AI:

1. Retrieves last 30 days of waste items
2. Calculates daily average deposition rate
3. Determines items remaining until 80% capacity threshold
4. Projects days until threshold reached
5. Sends structured prompt to Gemini AI with historical patterns
6. Averages both predictions for final forecast
7. Returns forecast date with confidence level

### CSV Data Export

- Implements DataExporter interface pattern
- CSVExporter queries waste items filtered by date range and school
- Uses encapsulated getters for safe data access
- Generates properly formatted CSV with headers:
  - Item ID, Bin Location, Waste Type, Category, Timestamp
  - Recyclable status, Image URL, Recycling Instructions

### Database Schema

Three related MySQL tables:

1. **schools**: School information
2. **bins**: Bin data with foreign key to schools, tracks max_capacity as item count
3. **waste_items**: Individual scanned items with foreign key to bins, stores timestamps and image URLs

## Technology Stack

- **Java 11+**: Core programming language
- **Spark Framework**: Lightweight REST API framework
- **MySQL**: Relational database
- **JDBC**: Database connectivity
- **Java-WebSocket**: Real-time communication
- **Google Gemini AI**: Predictive analytics enhancement
- **Gson**: JSON processing
- **Apache Commons CSV**: CSV export functionality
- **OkHttp**: HTTP client for AI API calls
- **Maven**: Dependency management and build tool

## Setup Instructions

### Prerequisites

- Java Development Kit (JDK) 11 or higher
- Maven 3.6+
- MySQL 8.0+
- Google Gemini API key (for predictive analytics)

### Database Setup

1. Install MySQL and start the service

2. Create the database and tables:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. The schema will:
   - Create `ecosmart_waste` database
   - Create all required tables with relationships
   - Insert sample data for testing
   - Create useful views for analytics
   - Set up database user with appropriate permissions

### Application Setup

1. Clone the repository:
   ```bash
   cd backend
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your actual configuration
   ```

   Required environment variables:
   - `DB_URL`: MySQL connection string (default: jdbc:mysql://localhost:3306/ecosmart_waste)
   - `DB_USER`: Database username (default: ecosmart_app)
   - `DB_PASSWORD`: Database password
   - `GEMINI_API_KEY`: Google Gemini API key
   - `PORT`: Server port (default: 8080)

3. Build the project:
   ```bash
   mvn clean package
   ```

4. Run the application:
   ```bash
   java -jar target/waste-management-backend-1.0.0.jar
   ```

   Or using Maven:
   ```bash
   mvn exec:java -Dexec.mainClass="com.ecosmart.waste.WasteManagementApp"
   ```

### Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add the key to your `.env` file

## API Usage Examples

### Add Waste Item

```bash
curl -X POST http://localhost:8080/api/bins/1/items \
  -H "Content-Type: application/json" \
  -d '{
    "wasteType": "PET Bottle",
    "category": "Plastic",
    "imageUrl": "https://example.com/image.jpg"
  }'
```

### Get Bin Details

```bash
curl http://localhost:8080/api/bins/1
```

### Get Predictions

```bash
curl http://localhost:8080/api/bins/1/predictions
```

### Export CSV Data

```bash
curl "http://localhost:8080/api/export/1?startDate=2024-01-01T00:00:00&endDate=2024-12-31T23:59:59" \
  -o waste_data.csv
```

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:8080/ws/bins?schoolId=1');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Bin update:', data);
};

// Subscribe to specific school
ws.send(JSON.stringify({
  type: 'subscribe',
  schoolId: 1
}));
```

## Project Structure

```
backend/
├── src/main/java/com/ecosmart/waste/
│   ├── WasteManagementApp.java          # Main application class
│   ├── model/
│   │   ├── WasteItem.java               # Abstract base class
│   │   ├── Paper.java                   # Concrete subclass
│   │   ├── Plastic.java                 # Concrete subclass
│   │   ├── GeneralWaste.java            # Concrete subclass
│   │   ├── Bin.java                     # Bin aggregation class
│   │   └── School.java                  # School aggregation class
│   ├── database/
│   │   └── DatabaseManager.java         # Singleton database manager
│   ├── api/
│   │   └── RestApiController.java       # REST API endpoints
│   ├── websocket/
│   │   └── BinWebSocket.java            # WebSocket handler
│   └── service/
│       ├── PredictionService.java       # Predictive analytics
│       ├── DataExporter.java            # Export interface
│       └── CSVExporter.java             # CSV implementation
├── database/
│   └── schema.sql                       # Database schema
├── pom.xml                              # Maven configuration
├── .env.example                         # Environment template
└── README.md                            # This file
```

## Success Criteria Implementation

✅ **Real-time updates**: WebSocket broadcasting with <5s latency
✅ **Capacity tracking**: Item count calculations and percentage monitoring
✅ **Predictive analytics**: Statistical + AI hybrid prediction model
✅ **Waste composition**: Aggregation algorithms for type breakdown
✅ **Data export**: CSV generator with customizable date ranges
✅ **Scalability**: Stateless API design for concurrent requests
✅ **Thread safety**: Synchronized WebSocket sessions
✅ **Memory efficiency**: JVM garbage collection for long-running connections

## Performance Considerations

- **Thread Pool**: Configurable min/max threads for request handling
- **Connection Pooling**: Singleton database connection with validation
- **Stateless Design**: REST endpoints support horizontal scaling
- **Efficient Queries**: Indexed database queries for fast lookups
- **WebSocket Broadcasting**: Concurrent session management
- **Memory Management**: Defensive copying in aggregation classes

## Development

### Running Tests

```bash
mvn test
```

### Building for Production

```bash
mvn clean package
java -jar target/waste-management-backend-1.0.0.jar
```

### Environment Variables for Production

- Set all required environment variables
- Use strong database passwords
- Secure Gemini API key
- Configure appropriate CORS origins
- Adjust thread pool sizes based on load

## Troubleshooting

### Database Connection Issues

- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in `.env` file
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`
- Verify network connectivity to MySQL server

### WebSocket Connection Failed

- Check firewall settings
- Verify port is not in use: `lsof -i :8080`
- Ensure WebSocket URL uses `ws://` not `http://`

### Prediction Service Errors

- Verify Gemini API key is valid
- Check internet connectivity
- Review API quota limits
- Ensure sufficient historical data (30 days)

## License

This project is part of the CompSci IA - EcoSmart Website project.

## Contributors

- V-Vasilis - Initial development and architecture
