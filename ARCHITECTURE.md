# Architecture

This document describes the internal architecture of the eNROLL React Native Plugin.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                  React Native App                        │
│                                                         │
│   import { startEnroll } from 'enroll-react-native';    │
│   const result = await startEnroll({ ... });            │
└──────────────────────┬──────────────────────────────────┘
                       │  TypeScript → RN Bridge / TurboModule
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Plugin JavaScript Layer                     │
│                                                         │
│  src/types.ts         — TypeScript types & enums         │
│  src/NativeEnroll.ts  — TurboModule spec (codegen)       │
│  src/index.ts         — Public API + event emitter       │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
     Android Native                 iOS Native
           │                              │
           ▼                              ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│  EnrollModule.kt    │   │  EnrollModule.swift           │
│                     │   │                              │
│  @ReactMethod       │   │  @objc func startEnroll()    │
│  fun startEnroll()  │   │                              │
│                     │   │  Conforms to:                │
│  Implements:        │   │  - RCTEventEmitter           │
│  - EnrollSpec       │   │  - EnrollCallBack            │
│  - EnrollCallback   │   │                              │
└────────┬────────────┘   └──────────┬───────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│  eNROLL Android SDK │   │  EnrollFramework (iOS)       │
│  (AAR via JitPack)  │   │  (xcframework + CocoaPods)   │
│                     │   │                              │
│  eNROLL.init(...)   │   │  Enroll.initViewController() │
│  eNROLL.launch()    │   │  present(vc, animated:)      │
└─────────────────────┘   └──────────────────────────────┘
```

## Data Flow

### 1. Configuration (TypeScript → Native)

```
StartEnrollOptions (TS object)
  → RN Bridge serializes to ReadableMap (Android) / NSDictionary (iOS)
  → Native module receives and parses individual fields
  → Maps string values to native SDK enums
  → Maps color objects to native Color/UIColor
  → Calls native SDK init + launch
```

### 2. Results (Native → TypeScript)

**Success path:**
```
Native SDK callback (success)
  → Module builds WritableMap (Android) / Dictionary (iOS)
  → Promise resolves with EnrollSuccessResult
```

**Error path:**
```
Native SDK callback (error)
  → Module calls promise.reject (Android) / reject (iOS)
  → TypeScript Promise rejects with error
```

**Mid-flow events (requestId):**
```
Native SDK callback (getRequestId)
  → Module emits 'onRequestId' via DeviceEventEmitter / RCTEventEmitter
  → TypeScript event listener fires with EnrollRequestIdResult
```

## Architecture Support

The plugin supports both React Native architectures:

| Architecture | Android | iOS |
|-------------|---------|-----|
| **Old (Bridge)** | `oldarch/EnrollSpec.kt` → `ReactContextBaseJavaModule` | `EnrollModule.mm` bridge |
| **New (TurboModules)** | `newarch/EnrollSpec.kt` → codegen `NativeEnrollSpec` | `install_modules_dependencies` |

Selection is automatic based on the host app's `newArchEnabled` setting.

## Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| **TypeScript (src/)** | Type definitions, TurboModule spec, public API, event emitter |
| **Android (android/)** | Kotlin bridge: parse ReadableMap → call eNROLL SDK → forward callbacks |
| **iOS (ios/)** | Swift bridge: parse NSDictionary → call EnrollFramework → forward callbacks |

## Threading Model

- **Android:** `eNROLL.launch()` starts a new Activity on the main thread. Callbacks may arrive on background threads — the module uses RN's thread-safe `promise.resolve()` and event emitter.
- **iOS:** SDK ViewController is presented on the main thread via `DispatchQueue.main.async`. Callbacks are forwarded using the same mechanism.

## Guard Logic

Both platforms include:
- **Double-launch prevention:** An `isFlowInProgress` flag prevents calling `startEnroll` while a flow is active.
- **Input validation:** Required fields are validated before calling the native SDK, with clear error codes.

## Dependencies

### Android
- `com.github.LuminSoft:eNROLL-Android:v1.5.22` (JitPack)
- `org.bouncycastle:bcprov-jdk15to18:1.81` + `bcutil-jdk15to18:1.81`
- `com.google.code.gson:gson:2.8.8`
- `androidx.compose.ui:ui-graphics`
- `com.facebook.react:react-android` (peer)

### iOS
- `EnrollFramework` ~> 3.0.7 (CocoaPods)
- React Native (peer, via `install_modules_dependencies`)

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Promise for success/error, event emitter for requestId | requestId fires mid-flow (not terminal); Promise is idiomatic for one-shot results |
| String literal unions instead of TS enums | No runtime overhead, better tree-shaking, idiomatic TypeScript |
| Full native success model exposed | Richer result type; enables exit-step workflows |
| Both old+new arch support | Maximum compatibility across RN versions |
| Kotlin for Android, Swift for iOS | Matches the native SDK languages |
| `TurboReactPackage` for registration | Works with both architectures seamlessly |
