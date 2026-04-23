import {
  NativeModules,
  NativeEventEmitter,
  Platform,
} from 'react-native';

import type {
  StartEnrollOptions,
  EnrollSuccessResult,
  EnrollRequestIdResult,
} from './types';

const LINKING_ERROR =
  `The package 'enroll-react-native' doesn't seem to be linked. Make sure:\n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error — global.__turboModuleProxy is set by React Native when Turbo Modules are enabled
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const EnrollModule = isTurboModuleEnabled
  ? require('./NativeEnroll').default
  : NativeModules.EnrollReactNative;

const Enroll = EnrollModule
  ? EnrollModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * Event emitter for enrollment mid-flow events.
 * Emits `'onRequestId'` when the SDK generates a request ID during the flow.
 */
export const enrollEmitter = new NativeEventEmitter(Enroll);

/**
 * Launch the eNROLL enrollment flow.
 *
 * Resolves with `EnrollSuccessResult` on success.
 * Rejects with an error on failure.
 */
export function startEnroll(
  options: StartEnrollOptions
): Promise<EnrollSuccessResult> {
  return Enroll.startEnroll(options);
}

/**
 * Register a listener for the `'onRequestId'` event.
 * Fires when the SDK generates a request ID during the flow (before completion).
 *
 * @returns A subscription object. Call `.remove()` to unsubscribe.
 */
export function addRequestIdListener(
  listener: (result: EnrollRequestIdResult) => void
) {
  return enrollEmitter.addListener('onRequestId', listener);
}

// Re-export all types
export type {
  EnrollEnvironment,
  EnrollMode,
  EnrollLocalization,
  EnrollForcedDocumentType,
  EnrollStepType,
  EnrollColor,
  EnrollColors,
  EnrollIconRenderingMode,
  EnrollStepIcon,
  EnrollLogoMode,
  EnrollLogoConfig,
  EnrollLocationIcons,
  EnrollNationalIdIcons,
  EnrollPassportIcons,
  EnrollPhoneIcons,
  EnrollEmailIcons,
  EnrollFaceMatchingIcons,
  EnrollSecurityQuestionsIcons,
  EnrollPasswordIcons,
  EnrollSignatureIcons,
  EnrollBackgroundIcons,
  EnrollPopupIcons,
  EnrollFieldIcons,
  EnrollUiIcons,
  EnrollCommonIcons,
  EnrollUpdateIcons,
  EnrollForgetIcons,
  EnrollIcons,
  EnrollTheme,
  StartEnrollOptions,
  EnrollSuccessResult,
  EnrollErrorResult,
  EnrollRequestIdResult,
} from './types';
