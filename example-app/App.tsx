/**
 * eNROLL React Native Example App
 * Full-featured demo matching the Capacitor plugin example.
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import {
  startEnroll,
  addRequestIdListener,
  type StartEnrollOptions,
} from 'enroll-react-native';

// ─── Default values (same as Capacitor example) ─────────
const DEFAULTS = {
  tenantId: '9235e61e-3322-4940-a78e-4c182cf7ef63',
  tenantSecret: '736db9db-680a-4608-b545-1c7d636c7487',
  enrollMode: 'onboarding' as const,
  enrollEnvironment: 'staging' as const,
  localizationCode: 'en' as const,
  applicationId: 'APPLICATION_ID',
  levelOfTrust: 'LEVEL_OF_TRUST_TOKEN',
  requestId: '',
  googleApiKey: 'GOOGLE_API_KEY',
  correlationId: 'correlationIdTest',
  templateId: 'templateId',
  contractParameters: 'contractParameters',
  enrollExitStep: 'personalConfirmation',
  enrollForcedDocumentType: 'nationalIdOrPassport' as const,
  skipTutorial: false,
  useEnrollTheme: true,
  useLegacyAppColors: false,
  themeJson: JSON.stringify(
    {
      colors: {
        primary: {r: 29, g: 86, b: 184},
        secondary: {r: 87, g: 145, b: 219},
        appBackgroundColor: {r: 255, g: 255, b: 255},
        textColor: {r: 0, g: 65, b: 148},
        errorColor: {r: 219, g: 48, b: 91},
        successColor: {r: 97, g: 204, b: 61},
        warningColor: {r: 249, g: 213, b: 72},
        appWhite: {r: 255, g: 255, b: 255},
        appBlack: {r: 51, g: 51, b: 51},
      },
      icons: {
        logo: {
          mode: 'hidden',

        },
        location: {
          tutorial: {
            assetName: 'enroll_example_location',
            renderingMode: 'template',
          },
          requestAccess: {
            assetName: 'enroll_example_location',
            renderingMode: 'template',
          },
        },
        nationalId: {
          tutorial: {
            assetName: 'enroll_example_id_card',
            renderingMode: 'original',
          },
          preScan: {
            assetName: 'enroll_example_id_card',
            renderingMode: 'template',
          },
        },
        common: {
          popups: {
            successIcon: {
              assetName: 'enroll_example_success',
              renderingMode: 'template',
            },
          },
        },
      },
    },
    null,
    2,
  ),
};

type PickerOption = {label: string; value: string};

const MODE_OPTIONS: PickerOption[] = [
  {label: 'onboarding', value: 'onboarding'},
  {label: 'auth', value: 'auth'},
  {label: 'update', value: 'update'},
  {label: 'signContract', value: 'signContract'},
];

const ENV_OPTIONS: PickerOption[] = [
  {label: 'staging', value: 'staging'},
  {label: 'production', value: 'production'},
];

const LANG_OPTIONS: PickerOption[] = [
  {label: 'en', value: 'en'},
  {label: 'ar', value: 'ar'},
];

const EXIT_STEP_OPTIONS: PickerOption[] = [
  {label: 'none', value: ''},
  {label: 'phoneOtp', value: 'phoneOtp'},
  {label: 'personalConfirmation', value: 'personalConfirmation'},
  {label: 'smileLiveness', value: 'smileLiveness'},
  {label: 'emailOtp', value: 'emailOtp'},
  {label: 'saveMobileDevice', value: 'saveMobileDevice'},
  {label: 'deviceLocation', value: 'deviceLocation'},
  {label: 'password', value: 'password'},
  {label: 'securityQuestions', value: 'securityQuestions'},
  {label: 'amlCheck', value: 'amlCheck'},
  {label: 'termsAndConditions', value: 'termsAndConditions'},
  {label: 'electronicSignature', value: 'electronicSignature'},
  {label: 'ntraCheck', value: 'ntraCheck'},
  {label: 'csoCheck', value: 'csoCheck'},
];

const FORCED_DOCUMENT_OPTIONS: PickerOption[] = [
  {label: 'ID or Passport', value: 'nationalIdOrPassport'},
  {label: 'National ID only', value: 'nationalIdOnly'},
  {label: 'Passport only', value: 'passportOnly'},
];

// ─── Simple inline picker (no 3rd-party deps) ───────────
function InlinePicker({
  options,
  selected,
  onSelect,
}: {
  options: PickerOption[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.pickerRow}>
      {options.map(o => (
        <TouchableOpacity
          key={o.value}
          style={[
            styles.pickerChip,
            selected === o.value && styles.pickerChipActive,
          ]}
          onPress={() => onSelect(o.value)}>
          <Text
            style={[
              styles.pickerChipText,
              selected === o.value && styles.pickerChipTextActive,
            ]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main App ────────────────────────────────────────────
function App(): React.JSX.Element {
  // Form state
  const [tenantId, setTenantId] = useState(DEFAULTS.tenantId);
  const [tenantSecret, setTenantSecret] = useState(DEFAULTS.tenantSecret);
  const [enrollMode, setEnrollMode] = useState(DEFAULTS.enrollMode as string);
  const [enrollEnvironment, setEnrollEnvironment] = useState(
    DEFAULTS.enrollEnvironment as string,
  );
  const [localizationCode, setLocalizationCode] = useState(
    DEFAULTS.localizationCode as string,
  );
  const [applicationId, setApplicationId] = useState(DEFAULTS.applicationId);
  const [levelOfTrust, setLevelOfTrust] = useState(DEFAULTS.levelOfTrust);
  const [reqId, setReqId] = useState(DEFAULTS.requestId);
  const [googleApiKey, setGoogleApiKey] = useState(DEFAULTS.googleApiKey);
  const [correlationId, setCorrelationId] = useState(DEFAULTS.correlationId);
  const [templateId, setTemplateId] = useState(DEFAULTS.templateId);
  const [contractParameters, setContractParameters] = useState(
    DEFAULTS.contractParameters,
  );
  const [enrollExitStep, setEnrollExitStep] = useState(
    DEFAULTS.enrollExitStep,
  );
  const [enrollForcedDocumentType, setEnrollForcedDocumentType] = useState(
    DEFAULTS.enrollForcedDocumentType as string,
  );
  const [skipTutorial, setSkipTutorial] = useState(DEFAULTS.skipTutorial);
  const [useEnrollTheme, setUseEnrollTheme] = useState(
    DEFAULTS.useEnrollTheme,
  );
  const [useLegacyAppColors, setUseLegacyAppColors] = useState(
    DEFAULTS.useLegacyAppColors,
  );
  const [themeJson, setThemeJson] = useState(DEFAULTS.themeJson);

  // Result state
  const [status, setStatus] = useState('Ready to launch eNROLL.');
  const [statusKind, setStatusKind] = useState<'info' | 'success' | 'error'>(
    'info',
  );
  const [requestIdResult, setRequestIdResult] = useState(
    'No request ID received yet.',
  );
  const [successResult, setSuccessResult] = useState(
    'No success result yet.',
  );
  const [errorResult, setErrorResult] = useState('No error result yet.');
  const [loading, setLoading] = useState(false);

  // Request ID listener
  useEffect(() => {
    const subscription = addRequestIdListener(event => {
      const json = JSON.stringify(event, null, 2);
      setRequestIdResult(json);
      setStatus(`Request ID received: ${event.requestId}`);
      setStatusKind('info');
    });
    return () => subscription.remove();
  }, []);

  const clearResults = useCallback(() => {
    setStatus('Ready to launch eNROLL.');
    setStatusKind('info');
    setRequestIdResult('No request ID received yet.');
    setSuccessResult('No success result yet.');
    setErrorResult('No error result yet.');
  }, []);

  const fillDefaults = useCallback(() => {
    setTenantId(DEFAULTS.tenantId);
    setTenantSecret(DEFAULTS.tenantSecret);
    setEnrollMode(DEFAULTS.enrollMode);
    setEnrollEnvironment(DEFAULTS.enrollEnvironment);
    setLocalizationCode(DEFAULTS.localizationCode);
    setApplicationId(DEFAULTS.applicationId);
    setLevelOfTrust(DEFAULTS.levelOfTrust);
    setReqId(DEFAULTS.requestId);
    setGoogleApiKey(DEFAULTS.googleApiKey);
    setCorrelationId(DEFAULTS.correlationId);
    setTemplateId(DEFAULTS.templateId);
    setContractParameters(DEFAULTS.contractParameters);
    setEnrollExitStep(DEFAULTS.enrollExitStep);
    setEnrollForcedDocumentType(DEFAULTS.enrollForcedDocumentType);
    setSkipTutorial(DEFAULTS.skipTutorial);
    setUseEnrollTheme(DEFAULTS.useEnrollTheme);
    setUseLegacyAppColors(DEFAULTS.useLegacyAppColors);
    setThemeJson(DEFAULTS.themeJson);
    clearResults();
  }, [clearResults]);

  const handleStart = useCallback(async () => {
    if (loading) {
      return;
    }
    clearResults();
    setStatus('Launching eNROLL...');
    setStatusKind('info');
    setSuccessResult('Waiting for result...');
    setLoading(true);

    let parsedTheme: any | undefined;
    if (useEnrollTheme || useLegacyAppColors) {
      try {
        parsedTheme = JSON.parse(themeJson);
      } catch (error: any) {
        setErrorResult(error?.message ?? 'Theme JSON is invalid.');
        setStatus('Theme JSON is invalid. Fix it before starting eNROLL.');
        setStatusKind('error');
        setSuccessResult('No success result yet.');
        setLoading(false);
        return;
      }
    }

    const options: StartEnrollOptions = {
      tenantId: tenantId.trim(),
      tenantSecret: tenantSecret.trim(),
      enrollMode: enrollMode as any,
      enrollEnvironment: enrollEnvironment as any,
      localizationCode: localizationCode as any,
      skipTutorial,
      enrollForcedDocumentType: enrollForcedDocumentType as any,
    };

    const opt = (v: string) => (v.trim() ? v.trim() : undefined);
    if (opt(applicationId)) {
      options.applicationId = opt(applicationId);
    }
    if (opt(levelOfTrust)) {
      options.levelOfTrust = opt(levelOfTrust);
    }
    if (opt(reqId)) {
      options.requestId = opt(reqId);
    }
    if (opt(googleApiKey)) {
      options.googleApiKey = opt(googleApiKey);
    }
    if (opt(correlationId)) {
      options.correlationId = opt(correlationId);
    }
    if (opt(templateId)) {
      options.templateId = opt(templateId);
    }
    if (opt(contractParameters)) {
      options.contractParameters = opt(contractParameters);
    }
    if (opt(enrollExitStep)) {
      options.enrollExitStep = opt(enrollExitStep) as any;
    }
    if (useEnrollTheme && parsedTheme) {
      options.enrollTheme = parsedTheme;
    } else if (useLegacyAppColors && parsedTheme?.colors) {
      options.appColors = parsedTheme.colors;
    }

    try {
      const result = await startEnroll(options);
      const json = JSON.stringify(result, null, 2);
      setSuccessResult(json);
      setStatus(
        `Enrollment completed successfully.${
          result.applicantId ? ` Applicant ID: ${result.applicantId}` : ''
        }`,
      );
      setStatusKind('success');
    } catch (error: any) {
      const payload = error?.data ?? error;
      const json =
        typeof payload === 'string'
          ? payload
          : JSON.stringify(payload, null, 2);
      setErrorResult(json);
      setStatus(
        `Enrollment failed: ${
          payload?.message ?? error?.message ?? 'Unknown error'
        }`,
      );
      setStatusKind('error');
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    clearResults,
    tenantId,
    tenantSecret,
    enrollMode,
    enrollEnvironment,
    localizationCode,
    skipTutorial,
    applicationId,
    levelOfTrust,
    reqId,
    googleApiKey,
    correlationId,
    templateId,
    contractParameters,
    enrollExitStep,
    enrollForcedDocumentType,
    useEnrollTheme,
    useLegacyAppColors,
    themeJson,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FB" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>eNROLL React Native Example</Text>
          <Text style={styles.heroSubtitle}>
            Platform: {Platform.OS} {Platform.Version}
          </Text>
        </View>

        {/* Configuration card */}
        <View style={styles.card}>
          <Field label="Tenant ID" value={tenantId} onChange={setTenantId} />
          <Field
            label="Tenant Secret"
            value={tenantSecret}
            onChange={setTenantSecret}
          />

          <Text style={styles.fieldLabel}>Enroll Mode</Text>
          <InlinePicker
            options={MODE_OPTIONS}
            selected={enrollMode}
            onSelect={setEnrollMode}
          />

          <Text style={styles.fieldLabel}>Environment</Text>
          <InlinePicker
            options={ENV_OPTIONS}
            selected={enrollEnvironment}
            onSelect={setEnrollEnvironment}
          />

          <Text style={styles.fieldLabel}>Localization</Text>
          <InlinePicker
            options={LANG_OPTIONS}
            selected={localizationCode}
            onSelect={setLocalizationCode}
          />

          <Field
            label="Application ID"
            value={applicationId}
            onChange={setApplicationId}
          />
          <Field
            label="Level Of Trust"
            value={levelOfTrust}
            onChange={setLevelOfTrust}
          />
          <Field label="Request ID" value={reqId} onChange={setReqId} />
          <Field
            label="Google API Key"
            value={googleApiKey}
            onChange={setGoogleApiKey}
          />
          <Field
            label="Correlation ID"
            value={correlationId}
            onChange={setCorrelationId}
          />
          <Field
            label="Template ID"
            value={templateId}
            onChange={setTemplateId}
          />

          <Text style={styles.fieldLabel}>Exit Step</Text>
          <InlinePicker
            options={EXIT_STEP_OPTIONS}
            selected={enrollExitStep}
            onSelect={setEnrollExitStep}
          />

          <Text style={styles.fieldLabel}>Forced Document Type</Text>
          <InlinePicker
            options={FORCED_DOCUMENT_OPTIONS}
            selected={enrollForcedDocumentType}
            onSelect={setEnrollForcedDocumentType}
          />

          <Field
            label="Contract Parameters"
            value={contractParameters}
            onChange={setContractParameters}
            multiline
          />

          <Field
            label="Theme JSON"
            value={themeJson}
            onChange={setThemeJson}
            multiline
          />

          <ToggleRow
            label="Skip Tutorial"
            selected={skipTutorial}
            onPress={() => setSkipTutorial(value => !value)}
          />
          <ToggleRow
            label="Send enrollTheme (colors + icons)"
            selected={useEnrollTheme}
            onPress={() => {
              setUseEnrollTheme(value => !value);
              setUseLegacyAppColors(false);
            }}
          />
          <ToggleRow
            label="Send legacy appColors only"
            selected={useLegacyAppColors}
            onPress={() => {
              setUseLegacyAppColors(value => !value);
              setUseEnrollTheme(false);
            }}
          />

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleStart}
              disabled={loading}>
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Running...' : 'Start eNROLL'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={fillDefaults}>
              <Text style={styles.btnSecondaryText}>Fill Defaults</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={clearResults}>
              <Text style={styles.btnSecondaryText}>Clear Results</Text>
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View
            style={[
              styles.statusBox,
              statusKind === 'success' && styles.statusSuccess,
              statusKind === 'error' && styles.statusError,
            ]}>
            <Text
              style={[
                styles.statusText,
                statusKind === 'success' && styles.statusTextSuccess,
                statusKind === 'error' && styles.statusTextError,
              ]}>
              {status}
            </Text>
          </View>

          <Text style={styles.note}>
            This example works on native Android/iOS. The real SDK flow needs a
            native app runtime with a valid iengine.lic license.
          </Text>
        </View>

        {/* Result cards */}
        <View style={styles.resultGrid}>
          <ResultBox title="Request ID Event" content={requestIdResult} />
          <ResultBox title="Success Result" content={successResult} />
          <ResultBox title="Error Result" content={errorResult} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Reusable components ─────────────────────────────────
function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldMultiline]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function ToggleRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={onPress}>
      <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
        {selected && <Text style={styles.checkMark}>&#10003;</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ResultBox({title, content}: {title: string; content: string}) {
  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultTitle}>{title}</Text>
      <Text style={styles.resultPre} selectable>
        {content}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  hero: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#14304A',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#5A6F82',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E0EA',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#14304A',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14304A',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#D7E0EA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#14304A',
    backgroundColor: '#FFFFFF',
  },
  fieldMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E9EEF7',
  },
  pickerChipActive: {
    backgroundColor: '#1D56B8',
  },
  pickerChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#14304A',
  },
  pickerChipTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D7E0EA',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1D56B8',
    borderColor: '#1D56B8',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14304A',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  btnPrimary: {
    backgroundColor: '#1D56B8',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: '#E9EEF7',
  },
  btnSecondaryText: {
    color: '#14304A',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#EEF4FB',
  },
  statusSuccess: {
    backgroundColor: '#E7F6EE',
  },
  statusError: {
    backgroundColor: '#FDECEC',
  },
  statusText: {
    fontSize: 14,
    color: '#5A6F82',
  },
  statusTextSuccess: {
    color: '#1F8F52',
  },
  statusTextError: {
    color: '#C23737',
  },
  note: {
    marginTop: 12,
    fontSize: 13,
    color: '#5A6F82',
  },
  resultGrid: {
    gap: 16,
    marginTop: 20,
  },
  resultBox: {
    backgroundColor: '#F9FBFD',
    borderWidth: 1,
    borderColor: '#D7E0EA',
    borderRadius: 14,
    padding: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14304A',
    marginBottom: 10,
  },
  resultPre: {
    fontSize: 13,
    color: '#5A6F82',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
});

export default App;
