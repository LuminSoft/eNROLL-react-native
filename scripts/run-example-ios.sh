#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Build and run the eNROLL React Native example app on iOS
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
EXAMPLE_DIR="$ROOT_DIR/example-app"
IOS_DIR="$EXAMPLE_DIR/ios"
SCHEME="EnrollExample"
BUNDLE_ID="com.luminsoft.EnrollTestingApp"
METRO_PORT="${METRO_PORT:-8081}"
METRO_LOG_FILE="${TMPDIR:-/tmp}/enroll-example-metro.log"
SIMULATOR_DERIVED_DATA_PATH="$IOS_DIR/build-simulator"
DEVICE_DERIVED_DATA_PATH="$IOS_DIR/build-device"
DEVICE_BUILD_LOG_FILE="${TMPDIR:-/tmp}/enroll-example-ios-device-build.log"

wait_for_metro() {
  local attempts=30
  local delay=1

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "http://127.0.0.1:${METRO_PORT}/status" 2>/dev/null | grep -q "packager-status:running"; then
      return 0
    fi
    sleep "$delay"
  done

  return 1
}

start_metro() {
  lsof -ti:"$METRO_PORT" | xargs kill -9 2>/dev/null || true
  rm -f "$METRO_LOG_FILE"

  echo "==> Starting Metro bundler in background..."
  (
    cd "$EXAMPLE_DIR"
    nohup npx react-native start --port "$METRO_PORT" --no-interactive --reset-cache \
      >"$METRO_LOG_FILE" 2>&1 &
  )

  echo "==> Waiting for Metro to be ready..."
  if ! wait_for_metro; then
    echo "Metro did not become ready on port $METRO_PORT."
    echo "Check logs at $METRO_LOG_FILE"
    exit 1
  fi
}

find_physical_device_udid() {
  xcrun xctrace list devices 2>/dev/null \
    | awk '
        /^== Devices ==$/ { in_devices = 1; next }
        /^== / { in_devices = 0 }
        in_devices && /iPhone/ { print; exit }
      ' \
    | sed -nE 's/^.*\(([0-9A-F-]+)\)$/\1/p'
}

find_booted_or_available_simulator_udid() {
  local booted_udid
  local available_udid

  booted_udid="$(
    xcrun simctl list devices available \
      | awk '/Booted/ && /iPhone/ { print; exit }' \
      | sed -nE 's/^.*\(([0-9A-F-]+)\).*/\1/p'
  )"

  if [ -n "$booted_udid" ]; then
    printf '%s\n' "$booted_udid"
    return 0
  fi

  available_udid="$(
    xcrun simctl list devices available \
      | awk '/Shutdown/ && /iPhone/ { print; exit }' \
      | sed -nE 's/^.*\(([0-9A-F-]+)\).*/\1/p'
  )"

  printf '%s\n' "$available_udid"
}

start_simulator_if_needed() {
  local simulator_udid="$1"

  if ! xcrun simctl list devices | grep -q "$simulator_udid .*Booted"; then
    echo "==> Booting simulator: $simulator_udid"
    open -a Simulator --args -CurrentDeviceUDID "$simulator_udid"
    xcrun simctl boot "$simulator_udid" 2>/dev/null || true
    xcrun simctl bootstatus "$simulator_udid" -b
  fi
}

echo "==> Installing plugin dependencies..."
cd "$ROOT_DIR"
npm install

echo "==> Installing example app dependencies..."
cd "$EXAMPLE_DIR"
npm install

echo "==> Installing CocoaPods..."
cd "$IOS_DIR"
pod install --repo-update

echo "==> Building & launching iOS app..."
start_metro

DEVICE_UDID="$(find_physical_device_udid || true)"

if [ -n "$DEVICE_UDID" ]; then
  echo "==> Physical iPhone detected: $DEVICE_UDID"
  echo "==> Attempting physical device build..."

  device_xcodebuild_cmd=(
    xcodebuild
    -workspace "$IOS_DIR/$SCHEME.xcworkspace"
    -scheme "$SCHEME"
    -configuration Debug
    -destination "id=$DEVICE_UDID"
    -derivedDataPath "$DEVICE_DERIVED_DATA_PATH"
    -allowProvisioningUpdates
    -allowProvisioningDeviceRegistration
    CODE_SIGN_STYLE=Automatic
  )

  if [ -n "${IOS_DEVELOPMENT_TEAM:-}" ]; then
    echo "==> Using explicit iOS development team: $IOS_DEVELOPMENT_TEAM"
    device_xcodebuild_cmd+=(DEVELOPMENT_TEAM="$IOS_DEVELOPMENT_TEAM")
  fi

  device_xcodebuild_cmd+=(build)

  set +e
  "${device_xcodebuild_cmd[@]}" >"$DEVICE_BUILD_LOG_FILE" 2>&1
  device_build_status=$?
  set -e

  if [ "$device_build_status" -eq 0 ]; then
    DEVICE_APP_PATH="$DEVICE_DERIVED_DATA_PATH/Build/Products/Debug-iphoneos/$SCHEME.app"

    if [ ! -d "$DEVICE_APP_PATH" ]; then
      echo "Built device app not found at $DEVICE_APP_PATH"
      exit 1
    fi

    echo "==> Installing app on physical device..."
    xcrun devicectl device uninstall app --device "$DEVICE_UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
    xcrun devicectl device install app --device "$DEVICE_UDID" "$DEVICE_APP_PATH"

    echo "==> Launching app on physical device..."
    xcrun devicectl device process launch --device "$DEVICE_UDID" --terminate-existing "$BUNDLE_ID"

    echo "==> Metro is running in background. Logs: $METRO_LOG_FILE"
    exit 0
  fi

  echo "==> Physical device build failed. Falling back to simulator."
  if grep -Eq 'No Account for Team|No profiles for|requires a development team' "$DEVICE_BUILD_LOG_FILE"; then
    echo "==> Xcode signing is not configured for this app on the connected iPhone."
    echo "==> Open Xcode, sign in under Settings > Accounts, or rerun with IOS_DEVELOPMENT_TEAM=<your_team_id>."
  fi
  echo "==> Device build log: $DEVICE_BUILD_LOG_FILE"
fi

SIMULATOR_UDID="$(find_booted_or_available_simulator_udid)"
if [ -z "$SIMULATOR_UDID" ]; then
  echo "Could not find an available iPhone simulator."
  exit 1
fi

start_simulator_if_needed "$SIMULATOR_UDID"

echo "==> Building app for simulator: $SIMULATOR_UDID"
xcodebuild \
  -workspace "$IOS_DIR/$SCHEME.xcworkspace" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "id=$SIMULATOR_UDID" \
  -derivedDataPath "$SIMULATOR_DERIVED_DATA_PATH" \
  build

SIMULATOR_APP_PATH="$SIMULATOR_DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator/$SCHEME.app"
if [ ! -d "$SIMULATOR_APP_PATH" ]; then
  echo "Built simulator app not found at $SIMULATOR_APP_PATH"
  exit 1
fi

echo "==> Installing app on simulator..."
xcrun simctl install "$SIMULATOR_UDID" "$SIMULATOR_APP_PATH"

echo "==> Launching app on simulator..."
xcrun simctl launch "$SIMULATOR_UDID" "$BUNDLE_ID"

echo "==> Metro is running in background. Logs: $METRO_LOG_FILE"
