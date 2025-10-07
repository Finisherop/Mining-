#!/bin/bash

# Mining Tech Bot - Multi-Device Development Setup
echo "🚀 Mining Tech Bot - Multi-Device Setup"
echo "======================================="

# Get local IP address
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    LOCAL_IP=$(ipconfig | grep "IPv4" | tail -1 | awk -F: '{print $2}' | tr -d ' ')
else
    LOCAL_IP="localhost"
fi

PORT=3000

echo ""
echo "📱 Access URLs:"
echo "---------------"
echo "🏠 Local:        http://localhost:$PORT"
echo "🌐 Network:      http://$LOCAL_IP:$PORT"
echo ""

echo "🎯 URL Parameters for Testing:"
echo "------------------------------"
echo "👤 User Panel:   http://$LOCAL_IP:$PORT?user=true"
echo "🔧 Admin Panel:  http://$LOCAL_IP:$PORT?admin=true"
echo "🧪 Demo User:    http://$LOCAL_IP:$PORT?demo=test123"
echo ""

echo "📱 Mobile/Tablet Access:"
echo "------------------------"
echo "Connect your mobile device to the same WiFi network"
echo "Then visit: http://$LOCAL_IP:$PORT"
echo ""

echo "🛜 Network Requirements:"
echo "-----------------------"
echo "✅ Same WiFi network for all devices"
echo "✅ Firewall allows port $PORT"
echo "✅ Network sharing enabled"
echo ""

echo "🔧 Troubleshooting:"
echo "-------------------"
echo "If devices can't connect:"
echo "1. Check firewall settings"
echo "2. Verify WiFi network is the same"
echo "3. Try: sudo ufw allow $PORT (Linux)"
echo "4. Try: netsh advfirewall firewall add rule name=\"Vite\" dir=in action=allow protocol=TCP localport=$PORT (Windows)"
echo ""

echo "Starting development server..."
echo "Press Ctrl+C to stop"
echo ""

# Start the development server
npm run dev