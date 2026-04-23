#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Build and run the eNROLL React Native example app on iOS
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
EXAMPLE_DIR="$ROOT_DIR/example-app"

echo "==> Installing plugin dependencies..."
cd "$ROOT_DIR"
npm install

echo "==> Installing example app dependencies..."
cd "$EXAMPLE_DIR"
npm install

echo "==> Installing CocoaPods..."
cd "$EXAMPLE_DIR/ios"
pod install

echo "==> Building & launching iOS app..."
cd "$EXAMPLE_DIR"
# Kill any existing Metro process on port 8081
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
npx react-native run-ios
