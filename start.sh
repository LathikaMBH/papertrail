#!/bin/bash
# PaperTrail — start both backend and frontend

echo "🚀 Starting PaperTrail..."

# Install backend deps if needed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Install frontend deps if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Start backend in background
echo "🔧 Starting backend on port 4000..."
cd backend && npm start &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "🌐 Starting frontend on port 3000..."
cd ../frontend && npm run dev

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
