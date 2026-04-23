# API Reference

## Functions

### `startEnroll(options: StartEnrollOptions): Promise<EnrollSuccessResult>`

Launch the eNROLL enrollment flow. Returns a Promise that resolves on success or rejects on failure.

### `addRequestIdListener(listener): EmitterSubscription`

Register a listener for the `'onRequestId'` event. Fires mid-flow when the SDK generates a request ID.

Returns a subscription object — call `.remove()` to unsubscribe.

### `enrollEmitter: NativeEventEmitter`

The underlying event emitter instance. Use `addRequestIdListener()` for convenience, or use this directly for advanced use cases.

---

## Types

### `StartEnrollOptions`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `tenantId` | `string` | **Yes** | Your tenant ID |
| `tenantSecret` | `string` | **Yes** | Your tenant secret |
| `enrollMode` | `EnrollMode` | **Yes** | The enrollment mode |
| `applicationId` | `string` | Auth mode | Applicant's application ID |
| `levelOfTrust` | `string` | Auth mode | Level of trust for authentication |
| `templateId` | `string` | SignContract mode | Contract template ID |
| `enrollEnvironment` | `EnrollEnvironment` | No | `'staging'` (default) or `'production'` |
| `localizationCode` | `EnrollLocalization` | No | `'en'` (default) or `'ar'` |
| `googleApiKey` | `string` | No | Google API key for location services |
| `skipTutorial` | `boolean` | No | Skip tutorial screens (default `false`) |
| `correlationId` | `string` | No | Custom correlation ID |
| `requestId` | `string` | No | Resume a previous request |
| `contractParameters` | `string` | No | JSON string of contract parameters |
| `enrollTheme` | `EnrollTheme` | No | Custom theme (colors + icons) |
| `appColors` | `EnrollColors` | No | **Deprecated.** Use `enrollTheme.colors` |
| `enrollForcedDocumentType` | `EnrollForcedDocumentType` | No | Force specific document type |
| `enrollExitStep` | `EnrollStepType` | No | Exit after specific step |

### `EnrollSuccessResult`

| Property | Type | Description |
|----------|------|-------------|
| `applicantId` | `string` | The applicant's unique ID |
| `enrollMessage` | `string?` | Optional success message |
| `documentId` | `string?` | Document ID if applicable |
| `requestId` | `string?` | The request ID |
| `exitStepCompleted` | `boolean` | Whether an exit step was completed |
| `completedStepName` | `string?` | Name of the completed step |

### `EnrollErrorResult`

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Error message |
| `code` | `string?` | Error code |
| `applicantId` | `string?` | Applicant ID if available |

### `EnrollRequestIdResult`

| Property | Type | Description |
|----------|------|-------------|
| `requestId` | `string` | The generated request ID |

---

## Enums

### `EnrollMode`

| Value | Description |
|-------|-------------|
| `'onboarding'` | Register a new user |
| `'auth'` | Authenticate an existing user |
| `'update'` | Update user profile |
| `'signContract'` | Sign a contract |

### `EnrollEnvironment`

| Value | Description |
|-------|-------------|
| `'staging'` | Test/QA environment |
| `'production'` | Live environment |

### `EnrollLocalization`

| Value | Description |
|-------|-------------|
| `'en'` | English (LTR) |
| `'ar'` | Arabic (RTL) |

### `EnrollForcedDocumentType`

| Value | Description |
|-------|-------------|
| `'nationalIdOnly'` | Accept only national ID |
| `'passportOnly'` | Accept only passport |
| `'nationalIdOrPassport'` | User chooses (default) |

### `EnrollStepType`

| Value | Description |
|-------|-------------|
| `'phoneOtp'` | Phone OTP verification |
| `'personalConfirmation'` | Personal data confirmation |
| `'smileLiveness'` | Smile liveness check |
| `'emailOtp'` | Email OTP verification |
| `'saveMobileDevice'` | Save mobile device |
| `'deviceLocation'` | Device location check |
| `'password'` | Password setup |
| `'securityQuestions'` | Security questions |
| `'amlCheck'` | AML check |
| `'termsAndConditions'` | Terms & conditions |
| `'electronicSignature'` | Electronic signature |
| `'ntraCheck'` | NTRA check |
| `'csoCheck'` | CSO check |

---

## Theme Types

### `EnrollTheme`

```typescript
interface EnrollTheme {
  colors?: EnrollColors;
  icons?: EnrollIcons;  // Android only
}
```

### `EnrollColors`

```typescript
interface EnrollColors {
  primary?: EnrollColor;
  secondary?: EnrollColor;
  appBackgroundColor?: EnrollColor;
  textColor?: EnrollColor;
  errorColor?: EnrollColor;
  successColor?: EnrollColor;
  warningColor?: EnrollColor;
  appWhite?: EnrollColor;
  appBlack?: EnrollColor;
}
```

### `EnrollColor`

```typescript
interface EnrollColor {
  r: number;       // 0–255
  g: number;       // 0–255
  b: number;       // 0–255
  opacity?: number; // 0.0–1.0 (default 1.0)
}
```

### `EnrollIcons` (Android Only)

See `src/types.ts` for the full icon configuration interface, including:
- `logo` — Logo configuration
- `location`, `nationalId`, `passport` — Step-specific icons
- `phone`, `email`, `faceMatching` — Verification step icons
- `securityQuestions`, `password`, `signature` — Auth step icons
- `common` — Shared UI icons (backgrounds, popups, fields, etc.)
- `update`, `forget` — Mode-specific icons
