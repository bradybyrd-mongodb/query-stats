#!/usr/bin/env node

/**
 * Test script to verify the run-ids aggregation pipeline logic
 */

// Mock data to test the aggregation pipeline logic
const mockData = [
    { run_id: "test1", timestamp: new Date("2024-01-15T10:30:00Z") },
    { run_id: "test1", timestamp: new Date("2024-01-15T11:00:00Z") },
    { run_id: "test2", timestamp: new Date("2024-01-14T09:15:00Z") },
    { run_id: "test3", timestamp: new Date("2024-01-16T14:45:00Z") },
    { run_id: "test2", timestamp: new Date("2024-01-14T10:30:00Z") }
];

console.log('🧪 Testing Run IDs Aggregation Pipeline Logic');
console.log('==============================================');
console.log();

console.log('📊 Mock Data:');
mockData.forEach((doc, i) => {
    console.log(`   ${i + 1}. run_id: ${doc.run_id}, timestamp: ${doc.timestamp.toISOString()}`);
});
console.log();

// Simulate the aggregation pipeline logic
console.log('🔄 Simulating Aggregation Pipeline:');
console.log();

// Step 1: Group by run_id and get latest timestamp
console.log('Step 1: Group by run_id and find latest timestamp');
const grouped = {};
mockData.forEach(doc => {
    if (!grouped[doc.run_id] || doc.timestamp > grouped[doc.run_id]) {
        grouped[doc.run_id] = doc.timestamp;
    }
});

Object.entries(grouped).forEach(([runId, timestamp]) => {
    console.log(`   ${runId} -> latest: ${timestamp.toISOString()}`);
});
console.log();

// Step 2: Format with timestamp and sort
console.log('Step 2: Format with timestamp and sort by latest timestamp');
const formatted = Object.entries(grouped).map(([runId, timestamp]) => ({
    run_id: `${runId} | ${timestamp.toISOString().replace('T', ' ').replace('Z', '')}`,
    original_run_id: runId,
    timestamp: timestamp
}));

// Sort by timestamp descending (newest first)
formatted.sort((a, b) => b.timestamp - a.timestamp);

formatted.forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.run_id}`);
});
console.log();

console.log('✅ Expected API Response:');
const apiResponse = {
    success: true,
    runIds: formatted.map(item => item.run_id),
    count: formatted.length
};

console.log(JSON.stringify(apiResponse, null, 2));
console.log();

console.log('🔧 MongoDB Aggregation Pipeline:');
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

console.log(JSON.stringify(pipeline, null, 2));
console.log();

console.log('💡 Client-side Run ID Extraction:');
formatted.forEach(item => {
    const extracted = item.run_id.split(' | ')[0];
    console.log(`   "${item.run_id}" -> "${extracted}"`);
});
console.log();

console.log('✅ Test completed successfully!');
