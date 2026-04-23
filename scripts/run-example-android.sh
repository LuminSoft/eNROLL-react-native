#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Build and run the eNROLL React Native example app on Android
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
EXAMPLE_DIR="$ROOT_DIR/example-app"
APP_ID="com.luminsoft.EnrollTestingApp"
MAIN_ACTIVITY="com.enrollexample.MainActivity"

echo "==> Installing plugin dependencies..."
cd "$ROOT_DIR"
npm install

echo "==> Installing example app dependencies..."
cd "$EXAMPLE_DIR"
npm install

echo "==> Building & installing Android app..."
cd "$EXAMPLE_DIR/android"
./gradlew :app:installDebug

echo "==> Launching app..."
adb shell am start -n "$APP_ID/$MAIN_ACTIVITY"

echo "==> Starting Metro bundler..."
cd "$EXAMPLE_DIR"
# Kill any existing Metro process on port 8081
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
npx react-native start
