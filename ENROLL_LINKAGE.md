# enroll-react-native — Linkage & Sync Guide

## What This Repo Is

**React Native plugin** for the **enroll** (production) product line. Wraps the native eNROLL Android SDK (with Innovatrics) for React Native apps.

## Product Line

**enroll** (production) — uses Innovatrics for OCR, face matching, and identity features.

## Native SDK Dependency

| Field | Value |
|---|---|
| Branch | `release/production` |
| Artifact | `com.github.LuminSoft:eNROLL-Android` |
| Current Version | `v1.5.24` |
| Declared in | `android/build.gradle` |
| iOS Distribution | CocoaPods (`EnrollFramework ~> 3.0.7`) |

## Sibling Projects (same product line)

| Plugin | Path | Type |
|---|---|---|
| enroll_flutter_plugin | `/Users/luminsoft/StudioProjects/enroll_flutter_plugin` | Flutter |
| enroll-capacitor | `/Users/luminsoft/StudioProjects/enroll-capacitor` | Capacitor |

## What This Plugin Exposes

- `startEnroll(options)` — launches the enrollment flow
- `addRequestIdListener(listener)` — mid-flow event
- Modes: onboarding, auth, update, signContract
- Theming: `EnrollTheme` (colors + icons)
- Localization: en, ar
- Options: forcedDocumentType, exitStep, skipTutorial, correlationId, googleApiKey, requestId, contractSigning

## How to Update When Native SDK Changes

1. Update `android/build.gradle` → change `eNROLL-Android:vX.Y.Z`
2. Update `package.json` → bump plugin version
3. Mirror new parameters/types to TypeScript API (`src/types.ts`)
4. Update `.enroll-linkage.json` with new version
5. Run sync check: `bash /Users/luminsoft/StudioProjects/ekyc-android/scripts/check-enroll-sync.sh`

## Where to Update Docs

- `README.md` — installation and usage
- `CHANGELOG.md` — version history
- `docs/api.md` — API reference
- `docs/integration-android.md` — Android setup
- `docs/integration-ios.md` — iOS setup
- `.enroll-linkage.json` — machine-readable metadata

## TODO — Pending Feature Gaps

- [ ] **forgetProfileData mode** — Native SDK supports `FORGET_PROFILE_DATA` but not exposed here (also missing from Flutter)
  - Implementation file: `src/types.ts` (add to `EnrollMode` union)
  - Android bridge: `android/src/main/kotlin/.../EnrollModule.kt`
  - iOS bridge: `ios/EnrollReactNativeModule.swift`
  - **Wait for Flutter implementation first** before implementing here
