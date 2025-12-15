# EcoSmartBins Dashboard

A comprehensive waste management system with React frontend and Java backend, featuring real-time monitoring, AI-powered predictions, and WebSocket updates.

## Project Structure

```
├── backend/              # Java Spring backend with REST API
│   ├── src/             # Java source files
│   ├── database/        # MySQL schema and setup
│   └── pom.xml          # Maven configuration
├── src/                 # React TypeScript frontend
│   ├── components/      # UI components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API and WebSocket services
│   ├── types/          # TypeScript type definitions
│   └── App.tsx         # Main application component
└── package.json        # Frontend dependencies
```

## Features

### Frontend
- Real-time dashboard with live bin monitoring
- WebSocket integration for instant updates
- Interactive charts and analytics
- Dark mode support
- Responsive design
- Export data functionality

### Backend
- REST API with Spark Framework
- Real-time WebSocket updates
- MySQL database with relational schema
- AI-powered predictive analytics (Google Gemini)
- CSV data export
- Three-tier architecture

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Java 11+
- Maven 3.6+
- MySQL 8.0+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Set up the database:
```bash
mysql -u root -p < database/schema.sql
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and Gemini API key
```

4. Build and run:
```bash
mvn clean package
java -jar target/waste-management-backend-1.0.0.jar
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env if your backend is not on localhost:8080
```

3. Start development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

### Default Configuration

- **Backend API**: `http://localhost:8080`
- **WebSocket**: `ws://localhost:8080`
- **Default School ID**: 1 (for testing)

## API Integration

The frontend connects to the backend through:

### REST API Endpoints
- `GET /api/schools/:schoolId/bins` - Get all bins
- `GET /api/bins/:binId` - Get bin details
- `POST /api/bins/:binId/items` - Add waste item
- `GET /api/bins/:binId/predictions` - Get predictions
- `GET /api/export/:schoolId` - Export CSV data

### WebSocket Connection
- Connects to `ws://localhost:8080/ws/bins?schoolId={id}`
- Receives real-time bin updates
- Auto-reconnection with exponential backoff
- Keep-alive ping/pong

## Development

### Running Frontend Dev Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Backend Development
See `backend/README.md` for detailed backend documentation.

## Environment Variables

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=ws://localhost:8080
VITE_DEFAULT_SCHOOL_ID=1
```

### Backend (backend/.env)
```bash
PORT=8080
DB_URL=jdbc:mysql://localhost:3306/ecosmart_waste
DB_USER=ecosmart_app
DB_PASSWORD=your_password
GEMINI_API_KEY=your_gemini_key
```

## Troubleshooting

### Frontend can't connect to backend
- Ensure backend is running on port 8080
- Check CORS is enabled in backend
- Verify .env file has correct API_BASE_URL

### WebSocket not connecting
- Check firewall settings
- Ensure WebSocket URL uses `ws://` not `http://`
- Verify backend WebSocket endpoint is accessible

### Database connection issues
- Verify MySQL is running
- Check credentials in backend/.env
- Ensure database schema is imported

## License

This project is part of the CompSci IA - EcoSmart Website project.
