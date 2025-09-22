#!/bin/bash

# MongoDB QueryStats Web App Setup Script

set -e

echo "🚀 Setting up MongoDB QueryStats Web Application"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.x or later."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or later is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install server dependencies
echo ""
echo "📦 Installing server dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi

echo "✅ Server dependencies installed"

# Install client dependencies
echo ""
echo "📦 Installing client dependencies..."
cd client
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi

cd ..
echo "✅ Client dependencies installed"

# Check if settings.json exists
if [ ! -f "settings.json" ]; then
    echo ""
    echo "⚠️  settings.json not found. Please configure your MongoDB connection."
    echo "   Example settings.json:"
    echo '   {'
    echo '     "mongodb": {'
    echo '       "uri": "mongodb://localhost:27017",'
    echo '       "database": "admin"'
    echo '     }'
    echo '   }'
else
    echo "✅ settings.json found"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. You can customize it if needed."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your MongoDB connection in settings.json"
echo "2. Start the development servers:"
echo "   npm run dev:all"
echo ""
echo "3. Open your browser to:"
echo "   http://localhost:3000 (React app)"
echo "   http://localhost:3001/api/health (API health check)"
echo ""
echo "📚 For more information, see README.md"
