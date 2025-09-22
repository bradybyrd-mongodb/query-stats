#!/usr/bin/env node

/**
 * Test script to verify MongoDB connection string environment variable substitution
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

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

console.log('🔧 MongoDB Connection Configuration Test');
console.log('========================================');
console.log();

console.log('📁 Settings from settings.json:');
console.log(`   URI Template: ${settings.mongodb.uri}`);
console.log(`   Database: ${settings.mongodb.database}`);
console.log();

console.log('🌍 Environment Variables:');
console.log(`   MONGODB_PWD: ${process.env.MONGODB_PWD ? '***' : 'NOT SET'}`);
console.log(`   MONGODB_DATABASE: ${process.env.MONGODB_DATABASE || 'NOT SET'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '***' : 'NOT SET'}`);
console.log();

const finalUri = buildMongoUri();
const finalDatabase = process.env.MONGODB_DATABASE || settings.mongodb.database;

console.log('🔗 Final Connection Configuration:');
console.log(`   URI (masked): ${finalUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
console.log(`   Database: ${finalDatabase}`);
console.log();

// Check if configuration looks valid
const hasPassword = !finalUri.includes('<secret>');
const hasValidFormat = finalUri.startsWith('mongodb://') || finalUri.startsWith('mongodb+srv://');

console.log('✅ Configuration Status:');
console.log(`   Password substituted: ${hasPassword ? '✓' : '✗'}`);
console.log(`   Valid URI format: ${hasValidFormat ? '✓' : '✗'}`);
console.log(`   Ready to connect: ${hasPassword && hasValidFormat ? '✓' : '✗'}`);

if (!hasPassword) {
    console.log();
    console.log('⚠️  Warning: Password not substituted. Make sure MONGODB_PWD is set in .env file');
}

if (!hasValidFormat) {
    console.log();
    console.log('⚠️  Warning: URI format appears invalid');
}

console.log();
console.log('💡 To fix issues:');
console.log('   1. Copy .env.example to .env');
console.log('   2. Set MONGODB_PWD=your-actual-password in .env');
console.log('   3. Ensure settings.json uses <secret> placeholder');
