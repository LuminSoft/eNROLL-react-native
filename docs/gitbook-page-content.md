# eNROLL React Native Plugin

The eNROLL React Native plugin provides a seamless bridge between React Native applications and the eNROLL SDK for eKYC identity verification on both Android and iOS platforms.

## Installation

```bash
npm install enroll-react-native
```

## Android Configuration

### 1. Add Repositories

In your project-level `android/settings.gradle` or `android/build.gradle`:

```groovy
// settings.gradle (recommended)
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
        maven { url = uri("https://maven.innovatrics.com/releases") }
    }
}
```

### 2. Add Innovatrics License File

Place the `iengine.lic` file at:
```
android/app/src/main/res/raw/iengine.lic
```

The license file is tied to your app's `applicationId`. Contact LuminSoft to obtain one for your application.

### 3. Set minSdkVersion & Kotlin Version

Ensure your `minSdkVersion` is at least **24** and Kotlin is **2.0+**:

```groovy
buildscript {
    ext {
        minSdkVersion = 24
        kotlinVersion = "2.0.21"
    }
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}
```

> The eNROLL SDK is compiled with Kotlin 2.1.0 metadata. Kotlin 2.0.21+ is required.

### 4. ProGuard Rules (for release builds)

Add to `android/app/proguard-rules.pro`:

```proguard
-keep class com.luminsoft.enroll_sdk.** { *; }
-keep class com.innovatrics.** { *; }
```

## iOS Configuration

### 1. Add CocoaPods Sources

At the **top** of your `ios/Podfile`:

```ruby
source 'https://github.com/LuminSoft/eNROLL-iOS-specs.git'
source 'https://github.com/innovatrics/innovatrics-podspecs.git'
source 'https://cdn.cocoapods.org/'
```

### 2. Add Innovatrics License File

1. Copy `iengine.lic` into your Xcode project
2. Add it to **Build Phases > Copy Bundle Resources**

The license file is tied to your bundle identifier.

### 3. Set Deployment Target

```ruby
platform :ios, min_ios_version_supported
```

### 3b. Firebase Modular Headers

Add selective modular headers for Firebase inside your target block:

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

> **Do NOT** use global `use_modular_headers!` — it breaks React Native builds.

### 4. Required Permissions

Add to `Info.plist`:

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
} from 'enroll-react-native';

// Listen for mid-flow request ID
const subscription = addRequestIdListener((event) => {
  console.log('Request ID:', event.requestId);
});

// Start enrollment
try {
  const result = await startEnroll({
    tenantId: 'YOUR_TENANT_ID',
    tenantSecret: 'YOUR_TENANT_SECRET',
    enrollMode: 'onboarding',
    enrollEnvironment: 'staging',
    localizationCode: 'en',
  });
  console.log('Applicant ID:', result.applicantId);
} catch (error) {
  console.error('Error:', error.message);
}

// Clean up
subscription.remove();
```

## Enrollment Modes

| Mode | Description | Required |
|------|------------|----------|
| `onboarding` | New user registration | `tenantId`, `tenantSecret` |
| `auth` | User authentication | + `applicationId`, `levelOfTrust` |
| `update` | Profile update | `tenantId`, `tenantSecret` |
| `signContract` | Contract signing | + `templateId` |

## Theming

```typescript
await startEnroll({
  // ...required options
  enrollTheme: {
    colors: {
      primary: { r: 29, g: 86, b: 184 },
      secondary: { r: 87, g: 145, b: 219 },
    },
  },
});
```

## API Reference

See the [full API documentation](docs/api.md) for all types, options, and configuration details.
