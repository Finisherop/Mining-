#!/bin/bash

echo "🚀 Setting up Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up Firebase configuration..."
if [ ! -f "src/firebase/config.ts" ]; then
    echo "⚠️  Firebase config not found. Using default configuration."
fi

echo "🎯 Creating development shortcuts..."

# Create start script
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting development server..."
echo "📱 React App: http://localhost:5173"
echo "💎 Premium Dashboard: Open premium-dashboard.html directly"
echo "🧪 Panel Testing: Open test-panels.html"
echo ""
npm run dev
EOF

chmod +x start-dev.sh

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Run './start-dev.sh' to start development server"
echo "2. Open test-panels.html to test all panels"
echo "3. Use admin.html for quick admin access"
echo ""
echo "📱 Access URLs:"
echo "- React App: http://localhost:5173"
echo "- Admin Panel: http://localhost:5173?admin=true"
echo "- User Panel: http://localhost:5173?user_id=123&first_name=TestUser"
echo "- Premium Dashboard: ./premium-dashboard.html"
echo "- Panel Testing: ./test-panels.html"