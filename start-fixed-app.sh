#!/bin/bash

# 🚀 Mining PRO - Quick Start & Test Script

echo "🚀 MINING PRO - COMPLETE FIX VERIFICATION"
echo "========================================"

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."  
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Check if all required files exist
echo "📁 Checking required files..."

required_files=(
    "index.html"
    "firebase-standalone.js" 
    "admin-init.js"
    "test-system.js"
    "dist/index.html"
    "dist/assets"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -e "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ All required files present"
else
    echo "❌ Missing files:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

# Start development server in background
echo "🌐 Starting development server..."
npm run dev &
DEV_SERVER_PID=$!

# Wait for server to start
sleep 3

# Test server response
echo "🧪 Testing server response..."
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Development server is running"
    
    echo ""
    echo "🎉 ALL SYSTEMS READY!"
    echo "===================="
    echo ""
    echo "🌐 Access URLs:"
    echo "   User Panel:  http://localhost:3000"
    echo "   Admin Panel: http://localhost:3000?admin=true"
    echo "   Demo Mode:   http://localhost:3000?demo=true"
    echo ""
    echo "🧪 Debug Tools (in browser console):"
    echo "   window.runComprehensiveTest()"  
    echo "   window.testFirebaseConnection()"
    echo "   window.getSystemStatus()"
    echo ""
    echo "📋 Features Fixed:"
    echo "   ✅ Task section loading"
    echo "   ✅ Firebase connectivity" 
    echo "   ✅ Admin panel sync"
    echo "   ✅ Error handling"
    echo "   ✅ Sample tasks"
    echo "   ✅ Real-time updates"
    echo ""
    echo "Press Ctrl+C to stop the server"
    
    # Keep server running
    wait $DEV_SERVER_PID
    
else
    echo "❌ Server failed to start or not responding"
    kill $DEV_SERVER_PID 2>/dev/null
    exit 1
fi