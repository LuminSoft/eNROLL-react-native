# Android Integration Guide

## Prerequisites

- React Native >= 0.71.0
- Android Studio (latest stable)
- minSdkVersion 24 or higher
- Kotlin 2.0+ (the eNROLL SDK is compiled with Kotlin 2.1.0 metadata)
- An `iengine.lic` file from LuminSoft

## Step 1: Install the Plugin

```bash
npm install enroll-react-native
```

## Step 2: Add Maven Repositories

The eNROLL SDK and its Innovatrics biometric dependencies are hosted on JitPack and Innovatrics Maven. Add these repositories.

**Option A — `settings.gradle` (recommended for RN 0.76+):**

```groovy
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

**Option B — project-level `build.gradle`:**

```groovy
buildscript {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
        maven { url = uri("https://maven.innovatrics.com/releases") }
    }
}
```

## Step 3: Add Innovatrics License File

Place your `iengine.lic` file at:

```
android/app/src/main/res/raw/iengine.lic
```

> **Important:** The license is tied to your app's `applicationId` in `build.gradle`. Contact LuminSoft if you need a license for a different package name.

## Step 4: Verify minSdkVersion & Kotlin Version

In `android/build.gradle`:

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

> **Important:** The eNROLL SDK was compiled with Kotlin 2.1.0. You need at least Kotlin 2.0.21 to read its metadata. If you use an older Kotlin (e.g. 1.9.x), you will see `Unresolved reference` compilation errors.

## Step 5: ProGuard / R8 Rules (Release Builds)

If you enable minification, add to `android/app/proguard-rules.pro`:

```proguard
-keep class com.luminsoft.enroll_sdk.** { *; }
-keep class com.innovatrics.** { *; }
-dontwarn com.luminsoft.enroll_sdk.**
-dontwarn com.innovatrics.**
```

## Step 6: Build

```bash
cd android && ./gradlew :app:assembleDebug
```

## Troubleshooting

### Duplicate class org.bouncycastle...

The plugin already excludes `bcprov-jdk18on` and `bcutil-jdk18on` and replaces them with `jdk15to18` variants. If you still see conflicts, add to your app's `build.gradle`:

```groovy
configurations.all {
    exclude group: 'org.bouncycastle', module: 'bcprov-jdk18on'
    exclude group: 'org.bouncycastle', module: 'bcutil-jdk18on'
}
```

### "Different applicationId" error at runtime

Your `iengine.lic` is bound to a specific `applicationId`. Ensure your `android/app/build.gradle` uses the correct one:

```groovy
defaultConfig {
    applicationId "com.your.app.id"  // Must match the license
}
```
