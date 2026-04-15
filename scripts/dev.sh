#!/bin/bash
# Development startup script
# Starts Firebase emulators, seeds data, then launches Vite

echo ""
echo "  ===================="
echo "   בית — Dev Server"
echo "  ===================="
echo ""

# Check if Java is available (required for Firebase emulators)
if ! command -v java &> /dev/null; then
  echo "  [!] Java is required for Firebase emulators."
  echo "      Install: sudo apt install default-jre"
  echo ""
  echo "  Starting Vite only (no emulators)..."
  npx vite
  exit 0
fi

echo "  Starting Firebase emulators..."
npx firebase emulators:start --only auth,firestore &
EMULATOR_PID=$!

# Wait for emulators to be ready
echo "  Waiting for emulators..."
sleep 5

echo "  Seeding test data..."
node scripts/seed-emulator.mjs

echo ""
echo "  Starting Vite dev server..."
npx vite &
VITE_PID=$!

echo ""
echo "  ==============================="
echo "   App:          http://localhost:5173"
echo "   Emulator UI:  http://localhost:4000"
echo ""
echo "   Admin login:  admin@bayit.dev / admin123"
echo "   User login:   dana@bayit.dev / test1234"
echo "  ==============================="
echo ""

# Cleanup on exit
trap "kill $EMULATOR_PID $VITE_PID 2>/dev/null" EXIT
wait
