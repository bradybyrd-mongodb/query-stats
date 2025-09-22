const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Load settings
const settingsPath = path.join(__dirname, 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

// Build MongoDB URI with environment variable substitution
function buildMongoUri() {
    let uri = settings.mongodb.uri;

    // Replace <secret> placeholder with environment variable
    if (uri.includes('<secret>') && process.env.MONGODB_PWD) {
        uri = uri.replace('<secret>', process.env.MONGODB_PWD);
    }

    // Also support direct environment variable override
    if (process.env.MONGODB_URI) {
        uri = process.env.MONGODB_URI;
    }

    return uri;
}

const app = express();
const PORT = process.env.PORT || settings.server.port || 3001;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors(settings.server.cors));
app.use(express.json());

// MongoDB connection
let db;
let client;

async function connectToMongoDB() {
    try {
        const mongoUri = buildMongoUri();
        console.log('Connecting to MongoDB...');
        console.log('URI (masked):', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

        client = new MongoClient(mongoUri, settings.mongodb.options);
        await client.connect();

        // Always use database from settings.json
        const databaseName = settings.mongodb.database;
        db = client.db(databaseName);
        console.log(`Connected to MongoDB database: ${databaseName}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: settings.mongodb.database,
        connected: !!db
    });
});

// Get database collections
app.get('/api/collections', async (req, res) => {
    try {
        const collections = await db.listCollections().toArray();
        res.json({
            success: true,
            collections: collections.map(col => col.name)
        });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get distinct run_id values from stats_output collection
app.get('/api/run-ids', async (req, res) => {
    try {
        const collection = db.collection("run_ids");

        console.log('Fetching run IDs from collection: run_ids');

        // First, let's try a simple distinct query to see what we get
        const distinctRunIds = await collection.distinct('run_id');
        console.log('Distinct run_ids found:', distinctRunIds.length);
        console.log('Sample distinct run_ids:', distinctRunIds.slice(0, 5));

        // If we have run_ids, try the aggregation
        if (distinctRunIds.length > 0) {
            // Use aggregation pipeline to get run_id with timestamp formatting
            const pipeline = [
                {
                    $group: {
                        _id: "$run_id",
                        latest_timestamp: { $max: "$timestamp" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        run_id: {
                            $cond: {
                                if: { $ne: ["$latest_timestamp", null] },
                                then: {
                                    $concat: [
                                        { $toString: "$_id" },
                                        " | ",
                                        {
                                            $dateToString: {
                                                format: "%Y-%m-%d %H:%M:%S",
                                                date: "$latest_timestamp"
                                            }
                                        }
                                    ]
                                },
                                else: { $toString: "$_id" }
                            }
                        },
                        original_run_id: "$_id",
                        timestamp: "$latest_timestamp"
                    }
                },
                {
                    $sort: { timestamp: -1 }
                },
                {
                    $limit: 100
                }
            ];

            const result = await collection.aggregate(pipeline).toArray();
            console.log('Aggregation result count:', result.length);
            console.log('Sample aggregation results:', result.slice(0, 3));

            const runIds = result.map(r => r.run_id).filter(id => id && id.trim() !== '');

            res.json({
                success: true,
                runIds: runIds,
                count: runIds.length
            });
        } else {
            // Fallback: just return distinct run_ids without timestamp formatting
            console.log('No run_ids found, returning empty array');
            res.json({
                success: true,
                runIds: [],
                count: 0
            });
        }
    } catch (error) {
        console.error('Error fetching run IDs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Simple run-ids endpoint for debugging
app.get('/api/run-ids-simple', async (req, res) => {
    try {
        const collection = db.collection("run_ids");

        // Get a sample document to see the structure
        const sampleDoc = await collection.findOne({});
        console.log('Sample document from run_ids collection:', sampleDoc);

        // Get distinct run_ids
        const runIds = await collection.distinct('run_id');
        console.log('Distinct run_ids:', runIds);

        res.json({
            success: true,
            runIds: runIds.slice(0, 20), // Limit to first 20 for testing
            count: runIds.length,
            sampleDoc: sampleDoc
        });
    } catch (error) {
        console.error('Error fetching simple run IDs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get data from a collection
app.get('/api/data/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const { limit = 10, skip = 0, sort = '_id', order = 'desc' } = req.query;
        const { run_id } = req.query;
        const coll = db.collection(collection);
        
        // Get total count
        const totalCount = await coll.countDocuments();
        const matchStage = {$match: {doc_type: 'result', run_id: run_id}};
        const projectStage = {$project: {
            exec_time: {$multiply: ['$metrics.totalExecMicros.sum', 0.001]},
            num: '$metrics.execCount',
            namespace: 1,
            client: 1,
            query: 1
        }};
        const sortStage = {$sort: {exec_time: -1}};
        const limitStage = {$limit: parseInt(limit)};
        const pipe = [
            matchStage,
            projectStage,
            sortStage,
            limitStage
        ]
        // Get data with pagination
        const data = await coll.aggregate(pipe).toArray();
        
        // Get sample document structure for table headers
        const sampleDoc = data.length > 0 ? data[0] : {};
        const headers = Object.keys(sampleDoc);
        
        res.json({
            success: true,
            collection: collection,
            totalCount,
            currentPage: 1,
            totalPages: 1,
            limit: parseInt(limit),
            headers,
            data
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Execute queryStats command
app.post('/api/querystats', async (req, res) => {
    try {
        const { transformIdentifiers = {} } = req.body;
        
        const queryStatsCommand = {
            queryStats: {}
        };
        
        if (Object.keys(transformIdentifiers).length > 0) {
            queryStatsCommand.queryStats.transformIdentifiers = transformIdentifiers;
        }
        
        console.log('Executing queryStats command:', JSON.stringify(queryStatsCommand, null, 2));
        
        const startTime = Date.now();
        const result = await db.command(queryStatsCommand);
        const executionTime = Date.now() - startTime;
        
        res.json({
            success: true,
            executionTimeMs: executionTime,
            timestamp: new Date().toISOString(),
            totalQueries: result.queryStats ? result.queryStats.length : 0,
            queryStats: result.queryStats || []
        });
    } catch (error) {
        console.error('Error executing queryStats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Search/filter data
app.post('/api/search/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const { query = {}, limit = 50, skip = 0, sort = '_id', order = 'desc' } = req.body;
        
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = { [sort]: sortOrder };
        
        const coll = db.collection(collection);
        
        // Get total count with filter
        const totalCount = await coll.countDocuments(query);
        
        // Get filtered data
        const matchStage = {$match: {doc_type: 'result', run_id: query.run_id}};
        const projectStage = {$project: {
            exec_time: {$multiply: ['$metrics.totalExecMicros.sum', 0.001]},
            num: '$metrics.execCount',
            namespace: 1,
            client: 1,
            query: 1
        }};
        const sortStage = {$sort: {exec_time: -1}};
        const limitStage = {$limit: parseInt(limit)};
        const pipe = [
            matchStage,
            projectStage,
            sortStage,
            limitStage
        ];
        // Get data with pagination
        const data = await coll.aggregate(pipe).toArray();
        /*
        const data = await coll
            .find(query)
            .sort(sortObj)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .toArray();
        */
        res.json({
            success: true,
            collection: collection,
            query,
            totalCount,
            currentPage: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            limit: parseInt(limit),
            data
        });
    } catch (error) {
        console.error('Error searching data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve static files from React build (in production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
    process.exit(0);
});

// Start server
async function startServer() {
    await connectToMongoDB();
    
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API endpoints available at http://localhost:${PORT}/api`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`React app should be running on http://localhost:3000`);
        }
    });
}

startServer().catch(console.error);
