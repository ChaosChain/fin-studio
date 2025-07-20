#!/bin/bash

# Agent Relay Network Demo Setup Script
echo "🌐 Setting up Agent Relay Network Demo..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    print_error "Yarn is not installed. Please install yarn first."
    exit 1
fi

print_info "Installing dependencies..."
yarn install

# Check if nostr-tools is installed
if ! yarn list nostr-tools &> /dev/null; then
    print_info "Installing nostr-tools..."
    yarn add nostr-tools
fi

print_status "Dependencies installed"

# Build agents if needed
if [ ! -d "dist" ]; then
    print_info "Building agents..."
    yarn agents:build
    print_status "Agents built"
fi

# Create demo URLs file
cat > demo-urls.txt << EOF
🌐 Agent Relay Network Demo URLs

Main Demo Page:
http://localhost:3000/demo/agent-relay-network

Alternative Access:
- Payment Demo: http://localhost:3000/demo
- Dashboard: http://localhost:3000/dashboard
- Main App: http://localhost:3000

API Endpoints:
- Network Status: http://localhost:3000/api/agent-relay-network/status
- Comprehensive Analysis: http://localhost:3000/api/comprehensive-analysis

Demo Features:
1. 🔍 Agent Discovery - Discover available agents
2. 📤 Service Request - Route requests to best agents
3. 🎯 Task Coordination - Multi-agent collaboration
4. 🏥 Network Health - Monitor relay network
5. 🚀 Complete Workflow - Full system demo

Instructions:
1. Start the development server: yarn dev
2. Open the main demo page in your browser
3. Click on demo buttons to see features in action
4. Check the live network status dashboard
EOF

print_status "Demo URLs saved to demo-urls.txt"

# Function to start the demo
start_demo() {
    print_info "Starting Agent Relay Network Demo..."
    
    # Check if port 3000 is available
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port 3000 is already in use. Please stop the existing process or use a different port."
        print_info "To stop existing process: lsof -ti:3000 | xargs kill -9"
        exit 1
    fi
    
    print_info "Starting development server..."
    print_info "Demo will be available at: http://localhost:3000/demo/agent-relay-network"
    print_info "Press Ctrl+C to stop the server"
    
    # Start the development server
    yarn dev
}

# Function to show help
show_help() {
    echo "🌐 Agent Relay Network Demo Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start    - Start the development server and demo"
    echo "  build    - Build agents only"
    echo "  urls     - Show demo URLs"
    echo "  help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start     # Start the demo server"
    echo "  $0 build     # Build agents only"
    echo "  $0 urls      # Display demo URLs"
}

# Function to show URLs
show_urls() {
    if [ -f "demo-urls.txt" ]; then
        cat demo-urls.txt
    else
        print_error "demo-urls.txt not found. Run setup first."
    fi
}

# Function to build agents only
build_agents() {
    print_info "Building agents..."
    yarn agents:build
    print_status "Agents built successfully"
}

# Main script logic
case "${1:-start}" in
    "start")
        start_demo
        ;;
    "build")
        build_agents
        ;;
    "urls")
        show_urls
        ;;
    "help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 