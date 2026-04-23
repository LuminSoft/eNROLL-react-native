# Deployment Guide

Step-by-step instructions for publishing `enroll-react-native` to npm and making it available to clients.

## Prerequisites

- **npm account** with publish access to the `enroll-react-native` package
- **Node.js** 18+ and npm 9+
- All changes committed and pushed to the GitHub repo

## Pre-Publish Checklist

- [ ] Version bumped in **all** locations (see below)
- [ ] `CHANGELOG.md` updated with new version entry
- [ ] TypeScript compiles clean: `npm run typescript`
- [ ] Build output is fresh: `npm run prepare`
- [ ] Example app builds on Android and iOS
- [ ] All changes committed and pushed

## Version Locations

You must update the version in **all** of these places:

| File | Field |
|------|-------|
| `package.json` | `"version"` |
| `android/build.gradle` | `version` property |
| `enroll-react-native.podspec` | `s.version` |

## Publishing Steps

### 1. Bump Version

```bash
# Choose one:
npm version patch   # 1.0.0 → 1.0.1 (bug fix)
npm version minor   # 1.0.0 → 1.1.0 (new feature)
npm version major   # 1.0.0 → 2.0.0 (breaking change)
```

This automatically updates `package.json` and creates a git tag.

### 2. Build the Package

```bash
npm run prepare
```

This runs `react-native-builder-bob` to produce:
- `lib/commonjs/` — CommonJS modules
- `lib/module/` — ES modules
- `lib/typescript/` — Type definitions

### 3. Verify the Package Contents

```bash
npm pack --dry-run
```

Check that only the intended files are included:
- `src/` — TypeScript source
- `lib/` — Built output
- `android/` — Android native code
- `ios/` — iOS native code
- `enroll-react-native.podspec`
- `README.md`

### 4. Publish to npm

```bash
npm login           # if not already logged in
npm publish
```

### 5. Create GitHub Release

```bash
git push origin main --tags
```

Then create a release on GitHub matching the tag with the changelog entry.

## How Clients Install

Once published, clients install with:

```bash
npm install enroll-react-native
# or
yarn add enroll-react-native
```

Then follow the setup steps in `README.md` for Android and iOS.

## React Native vs Flutter vs Capacitor

| Concept | Flutter | React Native | Capacitor |
|---------|---------|-------------|-----------|
| **Language** | Dart | TypeScript/JavaScript | TypeScript/JavaScript |
| **Native bridge** | Platform channels | Native Modules (Bridge) or TurboModules | Capacitor Plugin API |
| **Package manager** | pub.dev | npm | npm |
| **iOS deps** | CocoaPods / SPM | CocoaPods | CocoaPods |
| **Android deps** | Gradle | Gradle | Gradle |
| **Dev server** | `flutter run` | **Metro** bundler | Vite / live-reload |
| **Hot reload** | Yes | Yes (Fast Refresh) | Yes (live-reload) |
| **UI framework** | Flutter widgets | React components | Web (HTML/CSS/JS) |

### What is Metro?

**Metro** is React Native's JavaScript bundler (like `dart compile` or Vite for web). It:
- Watches your JS/TS files for changes
- Bundles them into a single JS bundle
- Serves the bundle to the app over HTTP (port 8081)
- Enables **Fast Refresh** (hot reload)

You start it with `npx react-native start`. The native app fetches the JS bundle from Metro at `http://localhost:8081`.

### Key Tools Used in This Project

| Tool | Purpose | Flutter Equivalent |
|------|---------|-------------------|
| **Metro** | JS bundler & dev server | `flutter run` |
| **react-native-builder-bob** | Builds the plugin (CommonJS + ESM + types) | `flutter pub publish` build step |
| **CocoaPods** | iOS dependency manager | Same |
| **Gradle** | Android build system | Same |
| **TypeScript** | Type-safe JS | Dart's type system |
| **npm** | Package registry | pub.dev |
| **Codegen** | Generates native specs from TS (TurboModules) | `pigeon` / platform channels |

## Troubleshooting Deployment

### npm publish fails with 403

You need publish access to the package. Ask the org owner to grant it, or use `--access public` for the first publish of a scoped package.

### Clients get old version after publish

npm caches aggressively. Clients should:
```bash
npm cache clean --force
npm install enroll-react-native@latest
```

### Pod install fails for clients

Ensure the `enroll-react-native.podspec` version matches `package.json`. Clients may need to:
```bash
cd ios && pod repo update && pod install
```
