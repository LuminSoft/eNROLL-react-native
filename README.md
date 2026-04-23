# eNROLL React Native Plugin

Official React Native plugin for the **eNROLL SDK** — eKYC identity verification for Android and iOS.

> Supports both the **Old Architecture** (Bridge) and **New Architecture** (TurboModules).
>
> Full feature parity with the [Capacitor plugin](https://github.com/LuminSoft/enroll-capacitor).

## Features

- User onboarding with document scanning and face matching
- User authentication with configurable level of trust
- Profile update flow
- Contract signing flow
- Custom theme (colors + icons)
- Localization (English / Arabic with RTL support)
- Forced document type selection
- Exit step configuration
- Mid-flow request ID event

## Requirements

| Platform | Minimum Version |
|----------|----------------|
| React Native | >= 0.71.0 |
| Android | minSdkVersion 24, Kotlin 2.0+ |
| iOS | 15.1+ (uses `min_ios_version_supported`) |

## Installation

```bash
npm install enroll-react-native
# or
yarn add enroll-react-native
```

## Android Setup

### 1. Add Repositories

In your **project-level** `android/build.gradle` (or `settings.gradle` `dependencyResolutionManagement`):

```groovy
repositories {
    google()
    mavenCentral()
    maven { url = uri("https://jitpack.io") }
    maven { url = uri("https://maven.innovatrics.com/releases") }
}
```

### 2. Verify minSdkVersion & Kotlin Version

In `android/build.gradle`, ensure `minSdkVersion` is at least **24** and Kotlin is **2.0+**:

```groovy
ext {
    minSdkVersion = 24
    kotlinVersion = "2.0.21"
}
```

Also explicitly set the Kotlin Gradle plugin in the `dependencies` block:

```groovy
dependencies {
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
}
```

### 3. Add Innovatrics License File

Place your `iengine.lic` file in:

```
android/app/src/main/res/raw/iengine.lic
```

> The license is tied to your `applicationId`. Contact LuminSoft to obtain one.

### 4. ProGuard Rules

If you use R8/ProGuard, add to `android/app/proguard-rules.pro`:

```proguard
-keep class com.luminsoft.enroll_sdk.** { *; }
-keep class com.innovatrics.** { *; }
```

## iOS Setup

### 1. Add CocoaPods Sources

At the **top** of your `ios/Podfile`, add the required pod sources:

```ruby
source 'https://github.com/LuminSoft/eNROLL-iOS-specs.git'
source 'https://github.com/innovatrics/innovatrics-podspecs.git'
source 'https://cdn.cocoapods.org/'
```

### 2. Set Deployment Target

In your `ios/Podfile`:

```ruby
platform :ios, min_ios_version_supported
```

### 2b. Firebase Modular Headers

The eNROLL SDK depends on Firebase. Add modular headers for Firebase pods to avoid Swift/static library issues:

```ruby
pod 'FirebaseCore', :modular_headers => true
pod 'FirebaseCoreInternal', :modular_headers => true
pod 'FirebaseInstallations', :modular_headers => true
pod 'FirebaseABTesting', :modular_headers => true
pod 'FirebaseRemoteConfig', :modular_headers => true
pod 'FirebaseRemoteConfigInterop', :modular_headers => true
pod 'FirebaseSharedSwift', :modular_headers => true
pod 'GoogleUtilities', :modular_headers => true
pod 'PromisesObjC', :modular_headers => true
```

> **Do NOT use** global `use_modular_headers!` — it conflicts with React Native's header management.

### 3. Add Innovatrics License File

1. Place `iengine.lic` in your Xcode project (e.g. `ios/YourApp/iengine.lic`)
2. Add it to **Build Phases > Copy Bundle Resources**

### 4. Info.plist Permissions

Add required permissions to `ios/YourApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for identity verification</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location is required for identity verification</string>
<key>NFCReaderUsageDescription</key>
<string>NFC is used to read passport chips</string>
```

### 5. Install Pods

```bash
cd ios && pod install
```

## Usage

```typescript
import {
  startEnroll,
  addRequestIdListener,
  type StartEnrollOptions,
} from 'enroll-react-native';

// Listen for mid-flow request ID
const subscription = addRequestIdListener((event) => {
  console.log('Request ID:', event.requestId);
});

// Start enrollment
const options: StartEnrollOptions = {
  tenantId: 'YOUR_TENANT_ID',
  tenantSecret: 'YOUR_TENANT_SECRET',
  enrollMode: 'onboarding',
  enrollEnvironment: 'staging',
  localizationCode: 'en',
  skipTutorial: false,
};

try {
  const result = await startEnroll(options);
  console.log('Success:', result.applicantId);
} catch (error) {
  console.error('Failed:', error.message);
}

// Clean up
subscription.remove();
```

## API Reference

See [docs/api.md](docs/api.md) for the full API reference.

## Modes

| Mode | Description | Required Options |
|------|------------|-----------------|
| `'onboarding'` | Register a new user | `tenantId`, `tenantSecret` |
| `'auth'` | Authenticate existing user | + `applicationId`, `levelOfTrust` |
| `'update'` | Update user profile | `tenantId`, `tenantSecret` |
| `'signContract'` | Sign a contract | + `templateId` |

## Theming

```typescript
const options: StartEnrollOptions = {
  // ...required options
  enrollTheme: {
    colors: {
      primary: { r: 29, g: 86, b: 184, opacity: 1.0 },
      secondary: { r: 87, g: 145, b: 219 },
      textColor: { r: 0, g: 65, b: 148 },
    },
    icons: {
      // Android only
      logo: { mode: 'custom', assetName: 'my_logo' },
    },
  },
};
```

## Example App

See the [example-app](example-app/) directory for a complete working example with all configuration fields.

```bash
cd example-app
npm install

# Android
npx react-native run-android

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

## Platform-Specific Guides

- [Android Integration](docs/integration-android.md)
- [iOS Integration](docs/integration-ios.md)

## Publishing to npm

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step npm publishing instructions.

## License

MIT
