// ---------------------------------------------------------------------------
// Enums (string literal unions — idiomatic TypeScript, no runtime overhead)
// ---------------------------------------------------------------------------

/**
 * The environment in which the eNROLL SDK operates.
 * - `'staging'`    — test / QA environment
 * - `'production'` — live environment
 */
export type EnrollEnvironment = 'staging' | 'production';

/**
 * The mode of the enrollment flow.
 * - `'onboarding'`   — register a new user
 * - `'auth'`         — authenticate an existing user (requires `applicationId` + `levelOfTrust`)
 * - `'update'`       — re-verify / update an existing user
 * - `'signContract'` — sign a contract template (requires `templateId`)
 */
export type EnrollMode =
  | 'onboarding'
  | 'auth'
  | 'update'
  | 'signContract';

/**
 * UI language for the enrollment flow.
 * - `'en'` — English (default)
 * - `'ar'` — Arabic (enables RTL layout)
 */
export type EnrollLocalization = 'en' | 'ar';

/**
 * Forces the document scanning step to accept only a specific document type.
 * - `'nationalIdOnly'`        — only national ID
 * - `'passportOnly'`          — only passport
 * - `'nationalIdOrPassport'`  — user chooses (default)
 */
export type EnrollForcedDocumentType =
  | 'nationalIdOnly'
  | 'passportOnly'
  | 'nationalIdOrPassport';

/**
 * Individual enrollment step identifiers.
 * Used with `enrollExitStep` to terminate the flow after a specific step.
 */
export type EnrollStepType =
  | 'phoneOtp'
  | 'personalConfirmation'
  | 'smileLiveness'
  | 'emailOtp'
  | 'saveMobileDevice'
  | 'deviceLocation'
  | 'password'
  | 'securityQuestions'
  | 'amlCheck'
  | 'termsAndConditions'
  | 'electronicSignature'
  | 'ntraCheck'
  | 'csoCheck';

// ---------------------------------------------------------------------------
// Color types
// ---------------------------------------------------------------------------

/**
 * An RGBA color value.
 * `r`, `g`, `b` are integers 0–255. `opacity` is a float 0.0–1.0 (defaults to 1.0).
 */
export interface EnrollColor {
  r: number;
  g: number;
  b: number;
  opacity?: number;
}

/**
 * Custom color overrides for the enrollment UI.
 * Every property is optional — omitted colors fall back to the SDK defaults.
 */
export interface EnrollColors {
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

// ---------------------------------------------------------------------------
// Icon types (Android only — icons are not yet supported on iOS)
// ---------------------------------------------------------------------------

/**
 * Controls how a custom icon asset is colorized when displayed.
 * - `'original'` — renders the asset exactly as designed (default)
 * - `'template'` — replaces all colors with the SDK theme color
 */
export type EnrollIconRenderingMode = 'original' | 'template';

/**
 * Configuration for a single custom icon.
 * `assetName` is the Android drawable resource name (without `R.drawable.` prefix).
 */
export interface EnrollStepIcon {
  /** Android drawable resource name, e.g. `'my_location_icon'`. */
  assetName: string;
  /** How the icon should be rendered. Defaults to `'original'`. */
  renderingMode?: EnrollIconRenderingMode;
}

/**
 * Controls how the SDK logo is displayed.
 * - `'defaultLogo'` — show the built-in eNROLL logo
 * - `'hidden'`      — hide the logo entirely
 * - `'custom'`      — show a custom logo asset
 */
export type EnrollLogoMode = 'defaultLogo' | 'hidden' | 'custom';

/**
 * Configuration for the SDK logo on splash screens and the app bar.
 */
export interface EnrollLogoConfig {
  mode?: EnrollLogoMode;
  assetName?: string;
  renderingMode?: EnrollIconRenderingMode;
}

// -- Business-flow icon groups --

export interface EnrollLocationIcons {
  tutorial?: EnrollStepIcon;
  requestAccess?: EnrollStepIcon;
  accessError?: EnrollStepIcon;
  grab?: EnrollStepIcon;
}

export interface EnrollNationalIdIcons {
  tutorial?: EnrollStepIcon;
  tutorialIdOrPassport?: EnrollStepIcon;
  preScan?: EnrollStepIcon;
  scanError?: EnrollStepIcon;
  choose?: EnrollStepIcon;
}

export interface EnrollPassportIcons {
  tutorial?: EnrollStepIcon;
  preScan?: EnrollStepIcon;
  ePassportPreScan?: EnrollStepIcon;
  choose?: EnrollStepIcon;
}

export interface EnrollPhoneIcons {
  tutorial?: EnrollStepIcon;
  select?: EnrollStepIcon;
  validateOtp?: EnrollStepIcon;
}

export interface EnrollEmailIcons {
  tutorial?: EnrollStepIcon;
  select?: EnrollStepIcon;
  validateOtp?: EnrollStepIcon;
}

export interface EnrollFaceMatchingIcons {
  tutorial?: EnrollStepIcon;
  preScan?: EnrollStepIcon;
  error?: EnrollStepIcon;
}

export interface EnrollSecurityQuestionsIcons {
  tutorial?: EnrollStepIcon;
  authScreen?: EnrollStepIcon;
}

export interface EnrollPasswordIcons {
  tutorial?: EnrollStepIcon;
  authScreen?: EnrollStepIcon;
}

export interface EnrollSignatureIcons {
  tutorial?: EnrollStepIcon;
}

// -- Shared / cross-cutting icon groups --

export interface EnrollBackgroundIcons {
  main?: EnrollStepIcon;
  layer1?: EnrollStepIcon;
  layer2?: EnrollStepIcon;
  layer3?: EnrollStepIcon;
  blur?: EnrollStepIcon;
  header?: EnrollStepIcon;
  footer?: EnrollStepIcon;
}

export interface EnrollPopupIcons {
  background?: EnrollStepIcon;
  warningIcon?: EnrollStepIcon;
  errorIcon?: EnrollStepIcon;
  successIcon?: EnrollStepIcon;
}

export interface EnrollFieldIcons {
  user?: EnrollStepIcon;
  calendar?: EnrollStepIcon;
  gender?: EnrollStepIcon;
  issuingAuthority?: EnrollStepIcon;
  nationality?: EnrollStepIcon;
  num?: EnrollStepIcon;
  passport?: EnrollStepIcon;
  address?: EnrollStepIcon;
  idCard?: EnrollStepIcon;
  profession?: EnrollStepIcon;
  religion?: EnrollStepIcon;
  maritalStatus?: EnrollStepIcon;
}

export interface EnrollUiIcons {
  visibility?: EnrollStepIcon;
  visibilityOff?: EnrollStepIcon;
  mobile?: EnrollStepIcon;
  mail?: EnrollStepIcon;
  answer?: EnrollStepIcon;
  error?: EnrollStepIcon;
  info?: EnrollStepIcon;
  edit?: EnrollStepIcon;
  activePhone?: EnrollStepIcon;
}

export interface EnrollCommonIcons {
  backgrounds?: EnrollBackgroundIcons;
  popups?: EnrollPopupIcons;
  fieldIcons?: EnrollFieldIcons;
  ui?: EnrollUiIcons;
  termsAndConditions?: EnrollStepIcon;
}

export interface EnrollUpdateIcons {
  modeIcon?: EnrollStepIcon;
  idCard?: EnrollStepIcon;
  passport?: EnrollStepIcon;
  mobile?: EnrollStepIcon;
  email?: EnrollStepIcon;
  device?: EnrollStepIcon;
  address?: EnrollStepIcon;
  securityQuestions?: EnrollStepIcon;
  password?: EnrollStepIcon;
}

export interface EnrollForgetIcons {
  modeIcon?: EnrollStepIcon;
  nationalId?: EnrollStepIcon;
  passport?: EnrollStepIcon;
  phone?: EnrollStepIcon;
  email?: EnrollStepIcon;
  device?: EnrollStepIcon;
  location?: EnrollStepIcon;
  securityQuestions?: EnrollStepIcon;
  password?: EnrollStepIcon;
}

/**
 * Top-level icon configuration for the eNROLL SDK.
 * **Android only.** Icons are not yet supported on iOS.
 */
export interface EnrollIcons {
  logo?: EnrollLogoConfig;
  location?: EnrollLocationIcons;
  nationalId?: EnrollNationalIdIcons;
  passport?: EnrollPassportIcons;
  phone?: EnrollPhoneIcons;
  email?: EnrollEmailIcons;
  faceMatching?: EnrollFaceMatchingIcons;
  securityQuestions?: EnrollSecurityQuestionsIcons;
  password?: EnrollPasswordIcons;
  signature?: EnrollSignatureIcons;
  common?: EnrollCommonIcons;
  update?: EnrollUpdateIcons;
  forget?: EnrollForgetIcons;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/**
 * Unified theme configuration for the eNROLL SDK.
 * If both `enrollTheme` and `appColors` are provided on {@link StartEnrollOptions},
 * `enrollTheme` takes priority and `appColors` is ignored.
 */
export interface EnrollTheme {
  colors?: EnrollColors;
  icons?: EnrollIcons;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * Configuration object passed to `startEnroll()`.
 */
export interface StartEnrollOptions {
  // ---- Required ----
  tenantId: string;
  tenantSecret: string;
  enrollMode: EnrollMode;

  // ---- Conditionally required ----
  applicationId?: string;
  levelOfTrust?: string;
  templateId?: string;

  // ---- Optional ----
  enrollEnvironment?: EnrollEnvironment;
  localizationCode?: EnrollLocalization;
  googleApiKey?: string;
  skipTutorial?: boolean;
  correlationId?: string;
  requestId?: string;
  contractParameters?: string;
  enrollTheme?: EnrollTheme;
  /** @deprecated Use `enrollTheme.colors` instead. Ignored when `enrollTheme` is provided. */
  appColors?: EnrollColors;
  enrollForcedDocumentType?: EnrollForcedDocumentType;
  enrollExitStep?: EnrollStepType;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/**
 * Returned when the enrollment flow completes successfully.
 */
export interface EnrollSuccessResult {
  applicantId: string;
  enrollMessage?: string;
  documentId?: string;
  requestId?: string;
  exitStepCompleted: boolean;
  completedStepName?: string;
}

/**
 * Shape of the error returned when the enrollment flow fails.
 */
export interface EnrollErrorResult {
  message: string;
  code?: string;
  applicantId?: string;
}

/**
 * Payload delivered by the `'onRequestId'` event listener.
 */
export interface EnrollRequestIdResult {
  requestId: string;
}
