# iOS Integration Guide

## Prerequisites

- React Native >= 0.71.0
- Xcode 15+ (latest stable recommended)
- iOS deployment target 15.1+ (uses React Native's `min_ios_version_supported`)
- CocoaPods installed
- An `iengine.lic` file from LuminSoft

## Step 1: Install the Plugin

```bash
npm install enroll-react-native
```

## Step 2: Configure CocoaPods Sources

At the **top** of your `ios/Podfile` (before any other lines), add the required pod sources:

```ruby
source 'https://github.com/LuminSoft/eNROLL-iOS-specs.git'
source 'https://github.com/innovatrics/innovatrics-podspecs.git'
source 'https://cdn.cocoapods.org/'
```

## Step 3: Set Deployment Target

In your `ios/Podfile`:

```ruby
platform :ios, min_ios_version_supported
```

## Step 3b: Firebase Modular Headers

The eNROLL SDK depends on Firebase. You must add selective modular headers for Firebase pods inside your target block. **Do NOT use global `use_modular_headers!`** — it conflicts with React Native.

```ruby
target 'YourApp' do
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'FirebaseInstallations', :modular_headers => true
  pod 'FirebaseABTesting', :modular_headers => true
  pod 'FirebaseRemoteConfig', :modular_headers => true
  pod 'FirebaseRemoteConfigInterop', :modular_headers => true
  pod 'FirebaseSharedSwift', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true
  pod 'PromisesObjC', :modular_headers => true

  # ... use_react_native! etc.
end
```

## Step 4: Add Innovatrics License File

1. Copy `iengine.lic` into your Xcode project directory (e.g. `ios/YourApp/iengine.lic`)
2. In Xcode, drag it into your project navigator under the app target
3. Ensure it appears in **Build Phases > Copy Bundle Resources**

> **Important:** The license is tied to your bundle identifier. Contact LuminSoft if you need a license for a different bundle ID.

## Step 5: Info.plist Permissions

Add the following keys to `ios/YourApp/Info.plist`:

```xml
<!-- Camera for document scanning and face matching -->
<key>NSCameraUsageDescription</key>
<string>Camera access is required for identity verification</string>

<!-- Location for device location step -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location is required for identity verification</string>

<!-- NFC for e-passport reading (optional) -->
<key>NFCReaderUsageDescription</key>
<string>NFC is used to read passport chips</string>
```

### NFC Entitlement (if using e-passport)

1. In Xcode, go to **Signing & Capabilities**
2. Click **+ Capability** and add **Near Field Communication Tag Reading**
3. In your `Info.plist`, add:

```xml
<key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
<array>
    <string>A0000002471001</string>
    <string>A0000002472001</string>
</array>
```

## Step 6: Install Pods

```bash
cd ios && pod install
```

## Step 7: Build

```bash
npx react-native run-ios
```

Or open `ios/YourApp.xcworkspace` in Xcode and build from there.

## Troubleshooting

### Pod install fails with "Unable to find a specification for EnrollFramework"

Ensure the LuminSoft specs source is at the **top** of your Podfile:

```ruby
source 'https://github.com/LuminSoft/eNROLL-iOS-specs.git'
```

### "Different bundleId" error at runtime

Your `iengine.lic` is bound to a specific bundle identifier. Verify in Xcode:
**General > Identity > Bundle Identifier** matches the license.

### Simulator build fails (arm64 / i386)

The SDK uses an XCFramework that supports real devices. Building for simulators may require:

```ruby
# In Podfile, post_install:
installer.pods_project.targets.each do |target|
  target.build_configurations.each do |config|
    config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'i386'
  end
end
```
