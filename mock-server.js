/**
 * EcoSmart Mock Backend Server
 * A simple Node.js server that provides mock API endpoints for development
 * when the Java backend is unavailable.
 */

const http = require('http');
const url = require('url');

const PORT = 8080;

// Mock Data
const mockSchool = {
  id: 1,
  name: "Demo High School",
  address: "123 Education Lane",
  contactEmail: "admin@demohigh.edu"
};

const mockBins = [
  { id: 1, schoolId: 1, location: "Main Entrance", maxCapacity: 50 },
  { id: 2, schoolId: 1, location: "Cafeteria - North", maxCapacity: 100 },
  { id: 3, schoolId: 1, location: "Cafeteria - South", maxCapacity: 100 },
  { id: 4, schoolId: 1, location: "Library", maxCapacity: 40 },
  { id: 5, schoolId: 1, location: "Science Building", maxCapacity: 60 },
  { id: 6, schoolId: 1, location: "Gymnasium", maxCapacity: 80 },
  { id: 7, schoolId: 1, location: "Art Room", maxCapacity: 45 },
  { id: 8, schoolId: 1, location: "Computer Lab", maxCapacity: 35 }
];

// Generate mock waste items
function generateMockItems(binId, count) {
  const categories = ['Paper', 'Plastic', 'General'];
  const paperTypes = ['Notebook paper', 'Cardboard box', 'Newspaper', 'Magazine'];
  const plasticTypes = ['PET bottle', 'HDPE container', 'Plastic bag', 'Food wrapper'];
  const generalTypes = ['Food waste', 'Styrofoam', 'Mixed materials', 'Tissue'];

  const items = [];
  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    let wasteType;
    switch (category) {
      case 'Paper':
        wasteType = paperTypes[Math.floor(Math.random() * paperTypes.length)];
        break;
      case 'Plastic':
        wasteType = plasticTypes[Math.floor(Math.random() * plasticTypes.length)];
        break;
      default:
        wasteType = generalTypes[Math.floor(Math.random() * generalTypes.length)];
    }

    items.push({
      id: binId * 100 + i,
      binId: binId,
      category: category,
      wasteType: wasteType,
      imageUrl: `/images/${category.toLowerCase()}.jpg`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      recyclable: category !== 'General'
    });
  }
  return items;
}

// Generate items for each bin
const binItems = {};
mockBins.forEach(bin => {
  const itemCount = Math.floor(Math.random() * 20) + 5;
  binItems[bin.id] = generateMockItems(bin.id, itemCount);
});

// Helper function to get bin with computed properties
function getBinWithDetails(bin) {
  const items = binItems[bin.id] || [];
  const currentItemCount = items.length;
  const capacityPercentage = (currentItemCount / bin.maxCapacity) * 100;

  const composition = {};
  items.forEach(item => {
    composition[item.category] = (composition[item.category] || 0) + 1;
  });

  const recyclableCount = items.filter(i => i.recyclable).length;
  const recyclablePercentage = items.length > 0 ? (recyclableCount / items.length) * 100 : 0;

  return {
    ...bin,
    items: items,
    currentItemCount: currentItemCount,
    capacityPercentage: capacityPercentage,
    isNearingCapacity: capacityPercentage >= 80,
    itemsUntilThreshold: Math.max(0, Math.ceil(bin.maxCapacity * 0.8) - currentItemCount),
    wasteComposition: composition,
    recyclablePercentage: recyclablePercentage
  };
}

// CORS headers
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Request handler
function handleRequest(req, res) {
  setCORSHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json');

  // Routes
  if (pathname === '/' || pathname === '') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: "EcoSmart Waste Management Backend (Mock)",
      status: "running",
      version: "1.0.0-mock",
      mockMode: true
    }));
    return;
  }

  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "healthy", database: "mock" }));
    return;
  }

  // GET /api/schools/:schoolId/bins
  const schoolBinsMatch = pathname.match(/^\/api\/schools\/(\d+)\/bins$/);
  if (schoolBinsMatch && req.method === 'GET') {
    const schoolId = parseInt(schoolBinsMatch[1]);
    const bins = mockBins
      .filter(b => b.schoolId === schoolId)
      .map(getBinWithDetails);
    res.writeHead(200);
    res.end(JSON.stringify(bins));
    return;
  }

  // GET /api/bins/:binId
  const binDetailsMatch = pathname.match(/^\/api\/bins\/(\d+)$/);
  if (binDetailsMatch && req.method === 'GET') {
    const binId = parseInt(binDetailsMatch[1]);
    const bin = mockBins.find(b => b.id === binId);
    if (bin) {
      res.writeHead(200);
      res.end(JSON.stringify(getBinWithDetails(bin)));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Bin not found" }));
    }
    return;
  }

  // POST /api/bins/:binId/items
  const addItemMatch = pathname.match(/^\/api\/bins\/(\d+)\/items$/);
  if (addItemMatch && req.method === 'POST') {
    const binId = parseInt(addItemMatch[1]);
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newItem = {
          id: Date.now(),
          binId: binId,
          category: data.category || 'General',
          wasteType: data.wasteType || 'Unknown',
          imageUrl: data.imageUrl || '/images/general.jpg',
          timestamp: new Date().toISOString(),
          recyclable: data.category !== 'General'
        };

        if (!binItems[binId]) binItems[binId] = [];
        binItems[binId].push(newItem);

        const bin = mockBins.find(b => b.id === binId);
        const updatedBin = getBinWithDetails(bin);

        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          itemId: newItem.id,
          message: "Waste item added successfully",
          binStatus: {
            currentItemCount: updatedBin.currentItemCount,
            capacityPercentage: updatedBin.capacityPercentage,
            isNearingCapacity: updatedBin.isNearingCapacity
          }
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid request body" }));
      }
    });
    return;
  }

  // GET /api/bins/:binId/predictions
  const predictionsMatch = pathname.match(/^\/api\/bins\/(\d+)\/predictions$/);
  if (predictionsMatch && req.method === 'GET') {
    const binId = parseInt(predictionsMatch[1]);
    const bin = mockBins.find(b => b.id === binId);
    if (bin) {
      const details = getBinWithDetails(bin);
      const hoursUntilFull = Math.max(1, Math.floor((100 - details.capacityPercentage) / 2));
      res.writeHead(200);
      res.end(JSON.stringify({
        binId: binId,
        currentCapacity: details.capacityPercentage,
        predictedTimeToThreshold: `${hoursUntilFull} hours`,
        confidence: 0.85,
        recommendation: details.isNearingCapacity ? "Schedule pickup soon" : "No immediate action needed"
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Bin not found" }));
    }
    return;
  }

  // GET /api/schools/:schoolId/statistics
  const statsMatch = pathname.match(/^\/api\/schools\/(\d+)\/statistics$/);
  if (statsMatch && req.method === 'GET') {
    const schoolId = parseInt(statsMatch[1]);
    const schoolBins = mockBins.filter(b => b.schoolId === schoolId).map(getBinWithDetails);

    const totalItems = schoolBins.reduce((sum, b) => sum + b.currentItemCount, 0);
    const totalCapacity = schoolBins.reduce((sum, b) => sum + b.maxCapacity, 0);
    const avgCapacity = schoolBins.length > 0
      ? schoolBins.reduce((sum, b) => sum + b.capacityPercentage, 0) / schoolBins.length
      : 0;

    const composition = {};
    schoolBins.forEach(bin => {
      Object.entries(bin.wasteComposition).forEach(([cat, count]) => {
        composition[cat] = (composition[cat] || 0) + count;
      });
    });

    res.writeHead(200);
    res.end(JSON.stringify({
      schoolId: schoolId,
      schoolName: mockSchool.name,
      totalBins: schoolBins.length,
      totalItems: totalItems,
      totalCapacity: totalCapacity,
      averageCapacity: avgCapacity,
      binsNearingCapacity: schoolBins.filter(b => b.isNearingCapacity).length,
      wasteComposition: composition,
      recyclablePercentage: totalItems > 0
        ? (Object.entries(composition).filter(([cat]) => cat !== 'General').reduce((sum, [, c]) => sum + c, 0) / totalItems) * 100
        : 0
    }));
    return;
  }

  // GET /api/export/:schoolId
  const exportMatch = pathname.match(/^\/api\/export\/(\d+)$/);
  if (exportMatch && req.method === 'GET') {
    const schoolId = parseInt(exportMatch[1]);
    const schoolBins = mockBins.filter(b => b.schoolId === schoolId);

    let csv = 'Bin ID,Location,Category,Waste Type,Timestamp,Recyclable\n';
    schoolBins.forEach(bin => {
      const items = binItems[bin.id] || [];
      items.forEach(item => {
        csv += `${bin.id},"${bin.location}",${item.category},"${item.wasteType}",${item.timestamp},${item.recyclable}\n`;
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=waste_data_school_${schoolId}.csv`);
    res.writeHead(200);
    res.end(csv);
    return;
  }

  // 404 for unmatched routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Route not found" }));
}

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n');
  console.log('  ███████╗ ██████╗ ██████╗ ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗');
  console.log('  ██╔════╝██╔════╝██╔═══██╗██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝');
  console.log('  █████╗  ██║     ██║   ██║███████╗██╔████╔██║███████║██████╔╝   ██║   ');
  console.log('  ██╔══╝  ██║     ██║   ██║╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ');
  console.log('  ███████╗╚██████╗╚██████╔╝███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ');
  console.log('  ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ');
  console.log('\n  Mock Backend Server - Version 1.0.0');
  console.log('  Development Mode with In-Memory Data\n');
  console.log('=================================================');
  console.log('  EcoSmart Mock Backend Started!');
  console.log('=================================================');
  console.log(`  Server running on port: ${PORT}`);
  console.log(`  REST API: http://localhost:${PORT}/api`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log('=================================================');
  console.log('\n[✓] Mock Database: OK (Development Mode)');
  console.log(`[✓] Mock data loaded: 1 school, ${mockBins.length} bins`);
  console.log('\n    NOTE: Running with in-memory mock data.');
  console.log('    Data will reset when server restarts.\n');
});
