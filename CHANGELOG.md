# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-05-19

### Added

- Full `enrollTheme` support on iOS — colors and icons now work on both platforms
- Logo customization with `LogoConfig` (mode, assetName, renderingMode, showSponsoredBy)

### Changed

- Updated iOS EnrollFramework pod dependency from ~> 3.0.7 to ~> 3.0.9
- Removed stale "Android only" documentation for theme features

### Fixed

- Remove hardcoded credentials from example app

## [1.0.4] - 2026-05-03

### Fixed

- Update Android native SDK to v1.5.24 — adds x86/x86_64 ABI support for Android emulators on Intel/AMD hosts

## [1.0.3] - 2026-04-30

### Fixed

- Fix swapped `isCxxModule`/`isTurboModule` arguments in `ReactModuleInfo` constructor (`EnrollPackage.kt`). React Native 0.81 removed the `hasConstants` parameter, shifting these args — the module silently failed to load on New Architecture.

## [1.0.2] - 2026-04-26

### Changed

- Updated README with comprehensive documentation (all modes, config table, ePassport optional)
- Simplified iOS setup: use `use_frameworks!` + `use_modular_headers!` instead of individual pod modular headers
- Added ePassport/NFC as a separate optional section

## [1.0.0] - 2026-04-22

### Added

- Initial release of eNROLL React Native plugin
- Full parity with the Capacitor plugin feature set
- `startEnroll()` — single-call API with Promise-based result
- `addRequestIdListener()` — mid-flow request ID events
- Support for all enrollment modes: onboarding, auth, update, signContract
- Custom theming (colors + icons on Android)
- Localization support (English / Arabic with RTL)
- Forced document type configuration
- Exit step configuration
- Contract signing with template ID and parameters
- Both Old Architecture (Bridge) and New Architecture (TurboModules) support
- Android native module (Kotlin)
- iOS native module (Swift)
- Example app with full demonstration
- Complete documentation (README, API reference, integration guides)
