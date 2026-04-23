package com.luminsoft.enroll.reactnative

import android.util.Log
import androidx.compose.ui.graphics.Color
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.luminsoft.enroll_sdk.core.models.EnrollCallback
import com.luminsoft.enroll_sdk.core.models.EnrollEnvironment
import com.luminsoft.enroll_sdk.core.models.EnrollFailedModel
import com.luminsoft.enroll_sdk.core.models.EnrollForcedDocumentType
import com.luminsoft.enroll_sdk.core.models.EnrollMode
import com.luminsoft.enroll_sdk.core.models.EnrollSuccessModel
import com.luminsoft.enroll_sdk.core.models.LocalizationCode
import com.luminsoft.enroll_sdk.main.main_data.main_models.get_onboaring_configurations.EkycStepType
import com.luminsoft.enroll_sdk.sdk.eNROLL
import com.luminsoft.enroll_sdk.ui_components.theme.AppColors
import com.luminsoft.enroll_sdk.ui_components.theme.AppIcons
import com.luminsoft.enroll_sdk.ui_components.theme.AppTheme
import com.luminsoft.enroll_sdk.ui_components.theme.BackgroundIcons
import com.luminsoft.enroll_sdk.ui_components.theme.CommonIcons
import com.luminsoft.enroll_sdk.ui_components.theme.EmailIcons
import com.luminsoft.enroll_sdk.ui_components.theme.FaceMatchingIcons
import com.luminsoft.enroll_sdk.ui_components.theme.FieldIcons
import com.luminsoft.enroll_sdk.ui_components.theme.ForgetIcons
import com.luminsoft.enroll_sdk.ui_components.theme.IconRenderingMode
import com.luminsoft.enroll_sdk.ui_components.theme.IconSource
import com.luminsoft.enroll_sdk.ui_components.theme.LocationIcons
import com.luminsoft.enroll_sdk.ui_components.theme.LogoConfig
import com.luminsoft.enroll_sdk.ui_components.theme.LogoMode
import com.luminsoft.enroll_sdk.ui_components.theme.NationalIdIcons
import com.luminsoft.enroll_sdk.ui_components.theme.PassportIcons
import com.luminsoft.enroll_sdk.ui_components.theme.PasswordIcons
import com.luminsoft.enroll_sdk.ui_components.theme.PhoneIcons
import com.luminsoft.enroll_sdk.ui_components.theme.PopupIcons
import com.luminsoft.enroll_sdk.ui_components.theme.SecurityQuestionsIcons
import com.luminsoft.enroll_sdk.ui_components.theme.SignatureIcons
import com.luminsoft.enroll_sdk.ui_components.theme.StepIcon
import com.luminsoft.enroll_sdk.ui_components.theme.UiIcons
import com.luminsoft.enroll_sdk.ui_components.theme.UpdateIcons
import org.json.JSONObject
import android.graphics.Color as AndroidColor

class EnrollModule internal constructor(context: ReactApplicationContext) :
    EnrollSpec(context) {

    override fun getName(): String = NAME

    @Volatile
    private var isFlowInProgress = false
    private var listenerCount = 0

    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount++
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount -= count
        if (listenerCount < 0) listenerCount = 0
    }

    // ------------------------------------------------------------------
    // Plugin method exposed to JavaScript
    // ------------------------------------------------------------------

    @ReactMethod
    override fun startEnroll(options: ReadableMap, promise: Promise) {
        if (isFlowInProgress) {
            promise.reject("FLOW_IN_PROGRESS", "An enrollment flow is already in progress")
            return
        }

        val currentActivity = currentActivity
        if (currentActivity == null) {
            promise.reject("ACTIVITY_ERROR", "Activity is not available")
            return
        }

        // ---- Required parameters ----
        val tenantId = options.getString("tenantId")
        if (tenantId.isNullOrEmpty()) {
            promise.reject("INVALID_ARGUMENT", "tenantId is required")
            return
        }

        val tenantSecret = options.getString("tenantSecret")
        if (tenantSecret.isNullOrEmpty()) {
            promise.reject("INVALID_ARGUMENT", "tenantSecret is required")
            return
        }

        val enrollModeStr = options.getString("enrollMode")
        if (enrollModeStr.isNullOrEmpty()) {
            promise.reject("INVALID_ARGUMENT", "enrollMode is required")
            return
        }

        val enrollMode = parseEnrollMode(enrollModeStr)
        if (enrollMode == null) {
            promise.reject("INVALID_ARGUMENT", "Invalid enrollMode: $enrollModeStr")
            return
        }

        // ---- Conditionally required parameters ----
        val applicationId = options.getString("applicationId") ?: ""
        val levelOfTrust = options.getString("levelOfTrust") ?: ""
        val templateId = options.getString("templateId") ?: ""

        if (enrollMode == EnrollMode.AUTH) {
            if (applicationId.isEmpty()) {
                promise.reject("INVALID_ARGUMENT", "applicationId is required for auth mode")
                return
            }
            if (levelOfTrust.isEmpty()) {
                promise.reject("INVALID_ARGUMENT", "levelOfTrust is required for auth mode")
                return
            }
        }

        if (enrollMode == EnrollMode.SIGN_CONTRACT) {
            if (templateId.isEmpty()) {
                promise.reject("INVALID_ARGUMENT", "templateId is required for signContract mode")
                return
            }
        }

        // ---- Optional parameters ----
        val enrollEnvironment = parseEnrollEnvironment(options.getString("enrollEnvironment"))
        val localizationCode = parseLocalizationCode(options.getString("localizationCode"))
        val googleApiKey = options.getString("googleApiKey") ?: ""
        val skipTutorial = if (options.hasKey("skipTutorial")) options.getBoolean("skipTutorial") else false
        val correlationId = options.getString("correlationId") ?: ""
        val requestId = options.getString("requestId") ?: ""
        val contractParameters = options.getString("contractParameters") ?: ""
        val enrollForcedDocumentType = parseEnrollForcedDocumentType(options.getString("enrollForcedDocumentType"))
        val exitStep = parseExitStep(options.getString("enrollExitStep"))

        // ---- Theme (colors + icons) ----
        val defaultAppColors = AppColors(
            primary = Color(0xFF1D56B8),
            secondary = Color(0xFF5791DB.toInt()),
            backGround = Color(0xFFFFFFFF),
            textColor = Color(0xFF004194.toInt()),
            errorColor = Color(0xFFDB305B),
            successColor = Color(0xFF61CC3D.toInt()),
            warningColor = Color(0xFFF9D548),
            white = Color(0xFFFFFFFF),
            appBlack = Color(0xFF333333)
        )

        val themeMap = if (options.hasKey("enrollTheme")) options.getMap("enrollTheme") else null

        val appColors = if (themeMap != null && themeMap.hasKey("colors")) {
            parseEnrollColors(themeMap.getMap("colors")!!, defaultAppColors)
        } else if (options.hasKey("appColors") && options.getMap("appColors") != null) {
            parseEnrollColors(options.getMap("appColors")!!, defaultAppColors)
        } else {
            defaultAppColors
        }

        val appIcons = if (themeMap != null && themeMap.hasKey("icons")) {
            val iconsJson = JSONObject(themeMap.getMap("icons")!!.toHashMap().toString())
            parseAppIcons(iconsJson)
        } else {
            AppIcons()
        }

        val appTheme = AppTheme(
            colors = appColors,
            icons = appIcons
        )

        // ---- Launch the SDK ----
        isFlowInProgress = true

        try {
            eNROLL.init(
                tenantId,
                tenantSecret,
                applicationId,
                levelOfTrust,
                enrollMode,
                enrollEnvironment,
                localizationCode = localizationCode,
                enrollCallback = object : EnrollCallback {
                    override fun success(enrollSuccessModel: EnrollSuccessModel) {
                        Log.d(TAG, "eNROLL success: ${enrollSuccessModel.enrollMessage}")
                        isFlowInProgress = false

                        val result = Arguments.createMap()
                        result.putString("applicantId", enrollSuccessModel.applicantId ?: "")
                        result.putString("enrollMessage", enrollSuccessModel.enrollMessage)
                        result.putString("documentId", enrollSuccessModel.documentId)
                        result.putString("requestId", enrollSuccessModel.requestId)
                        result.putBoolean("exitStepCompleted", enrollSuccessModel.exitStepCompleted)
                        result.putString("completedStepName", enrollSuccessModel.completedStepName)
                        promise.resolve(result)
                    }

                    override fun error(enrollFailedModel: EnrollFailedModel) {
                        Log.e(TAG, "eNROLL error: ${enrollFailedModel.failureMessage}")
                        isFlowInProgress = false
                        promise.reject(
                            "ENROLL_ERROR",
                            enrollFailedModel.failureMessage,
                            null as Throwable?
                        )
                    }

                    override fun getRequestId(rid: String) {
                        Log.d(TAG, "eNROLL requestId: $rid")
                        val params = Arguments.createMap()
                        params.putString("requestId", rid)
                        sendEvent("onRequestId", params)
                    }
                },
                googleApiKey = googleApiKey,
                skipTutorial = skipTutorial,
                correlationId = correlationId,
                appTheme = appTheme,
                enrollForcedDocumentType = enrollForcedDocumentType,
                requestId = requestId,
                templateId = templateId,
                contractParameters = contractParameters,
                exitStep = exitStep
            )

            eNROLL.launch(currentActivity)

        } catch (e: Exception) {
            Log.e(TAG, "Error starting enrollment: ${e.message}", e)
            isFlowInProgress = false
            promise.reject("ENROLL_LAUNCH_ERROR", "Failed to start enrollment: ${e.message}", e)
        }
    }

    // ------------------------------------------------------------------
    // Event emitter
    // ------------------------------------------------------------------

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // ------------------------------------------------------------------
    // Enum parsers
    // ------------------------------------------------------------------

    private fun parseEnrollMode(mode: String?): EnrollMode? {
        return when (mode) {
            "onboarding" -> EnrollMode.ONBOARDING
            "auth" -> EnrollMode.AUTH
            "update" -> EnrollMode.UPDATE
            "signContract" -> EnrollMode.SIGN_CONTRACT
            else -> null
        }
    }

    private fun parseEnrollEnvironment(env: String?): EnrollEnvironment {
        return when (env) {
            "production" -> EnrollEnvironment.PRODUCTION
            else -> EnrollEnvironment.STAGING
        }
    }

    private fun parseLocalizationCode(code: String?): LocalizationCode {
        return when (code) {
            "ar" -> LocalizationCode.AR
            else -> LocalizationCode.EN
        }
    }

    private fun parseEnrollForcedDocumentType(type: String?): EnrollForcedDocumentType {
        return when (type) {
            "nationalIdOnly" -> EnrollForcedDocumentType.NATIONAL_ID_ONLY
            "passportOnly" -> EnrollForcedDocumentType.PASSPORT_ONLY
            else -> EnrollForcedDocumentType.NATIONAL_ID_OR_PASSPORT
        }
    }

    private fun parseExitStep(step: String?): EkycStepType? {
        return when (step) {
            "phoneOtp" -> EkycStepType.PhoneOtp
            "personalConfirmation" -> EkycStepType.PersonalConfirmation
            "smileLiveness" -> EkycStepType.SmileLiveness
            "emailOtp" -> EkycStepType.EmailOtp
            "saveMobileDevice" -> EkycStepType.SaveMobileDevice
            "deviceLocation" -> EkycStepType.DeviceLocation
            "password" -> EkycStepType.SettingPassword
            "securityQuestions" -> EkycStepType.SecurityQuestions
            "amlCheck" -> EkycStepType.AmlCheck
            "termsAndConditions" -> EkycStepType.TermsConditions
            "electronicSignature" -> EkycStepType.ElectronicSignature
            "ntraCheck" -> EkycStepType.NtraCheck
            "csoCheck" -> EkycStepType.CsoCheck
            else -> null
        }
    }

    // ------------------------------------------------------------------
    // Color parsing
    // ------------------------------------------------------------------

    private fun parseEnrollColors(colorsMap: ReadableMap, defaults: AppColors): AppColors {
        return AppColors(
            primary = parseSingleColor(colorsMap, "primary") ?: defaults.primary,
            secondary = parseSingleColor(colorsMap, "secondary") ?: defaults.secondary,
            backGround = parseSingleColor(colorsMap, "appBackgroundColor") ?: defaults.backGround,
            textColor = parseSingleColor(colorsMap, "textColor") ?: defaults.textColor,
            errorColor = parseSingleColor(colorsMap, "errorColor") ?: defaults.errorColor,
            successColor = parseSingleColor(colorsMap, "successColor") ?: defaults.successColor,
            warningColor = parseSingleColor(colorsMap, "warningColor") ?: defaults.warningColor,
            white = parseSingleColor(colorsMap, "appWhite") ?: defaults.white,
            appBlack = parseSingleColor(colorsMap, "appBlack") ?: defaults.appBlack
        )
    }

    private fun parseSingleColor(parentMap: ReadableMap, key: String): Color? {
        if (!parentMap.hasKey(key)) return null
        val map = parentMap.getMap(key) ?: return null
        val r = if (map.hasKey("r")) map.getInt("r") else return null
        val g = if (map.hasKey("g")) map.getInt("g") else return null
        val b = if (map.hasKey("b")) map.getInt("b") else return null
        val opacity = if (map.hasKey("opacity")) map.getDouble("opacity") else 1.0
        return Color(
            red = r / 255f,
            green = g / 255f,
            blue = b / 255f,
            alpha = opacity.toFloat()
        )
    }

    // ------------------------------------------------------------------
    // Icon parsing (Android only)
    // ------------------------------------------------------------------

    private fun resolveDrawableName(name: String): Int {
        val ctx = reactApplicationContext
        val resId = ctx.resources.getIdentifier(name, "drawable", ctx.packageName)
        if (resId == 0) Log.w(TAG, "Drawable not found: $name")
        return resId
    }

    private fun parseStepIcon(json: JSONObject): StepIcon? {
        val assetName = json.optString("assetName", "").takeIf { it.isNotEmpty() } ?: return null
        val resId = resolveDrawableName(assetName)
        if (resId == 0) return null
        val renderingMode = when (json.optString("renderingMode", "original")) {
            "template" -> IconRenderingMode.TEMPLATE
            else -> IconRenderingMode.ORIGINAL
        }
        return StepIcon(source = IconSource.Resource(resId), renderingMode = renderingMode)
    }

    private fun parseLogoConfig(json: JSONObject): LogoConfig {
        val mode = when (json.optString("mode", "defaultLogo")) {
            "custom" -> LogoMode.CUSTOM
            "hidden" -> LogoMode.HIDDEN
            else -> LogoMode.DEFAULT
        }
        val assetName = json.optString("assetName", "").takeIf { it.isNotEmpty() }
        val asset = assetName?.let {
            val resId = resolveDrawableName(it)
            if (resId != 0) IconSource.Resource(resId) else null
        }
        val renderingMode = when (json.optString("renderingMode", "original")) {
            "template" -> IconRenderingMode.TEMPLATE
            else -> IconRenderingMode.ORIGINAL
        }
        return LogoConfig(mode = mode, asset = asset, renderingMode = renderingMode)
    }

    private fun parseAppIcons(json: JSONObject): AppIcons {
        return AppIcons(
            logo = json.optJSONObject("logo")?.let { parseLogoConfig(it) } ?: LogoConfig(),
            location = json.optJSONObject("location")?.let { parseLocationIcons(it) } ?: LocationIcons(),
            nationalId = json.optJSONObject("nationalId")?.let { parseNationalIdIcons(it) } ?: NationalIdIcons(),
            passport = json.optJSONObject("passport")?.let { parsePassportIcons(it) } ?: PassportIcons(),
            phone = json.optJSONObject("phone")?.let { parsePhoneIcons(it) } ?: PhoneIcons(),
            email = json.optJSONObject("email")?.let { parseEmailIcons(it) } ?: EmailIcons(),
            faceMatching = json.optJSONObject("faceMatching")?.let { parseFaceMatchingIcons(it) } ?: FaceMatchingIcons(),
            securityQuestions = json.optJSONObject("securityQuestions")?.let { parseSecurityQuestionsIcons(it) } ?: SecurityQuestionsIcons(),
            password = json.optJSONObject("password")?.let { parsePasswordIcons(it) } ?: PasswordIcons(),
            signature = json.optJSONObject("signature")?.let { parseSignatureIcons(it) } ?: SignatureIcons(),
            common = json.optJSONObject("common")?.let { parseCommonIcons(it) } ?: CommonIcons(),
            update = json.optJSONObject("update")?.let { parseUpdateIcons(it) } ?: UpdateIcons(),
            forget = json.optJSONObject("forget")?.let { parseForgetIcons(it) } ?: ForgetIcons(),
        )
    }

    private fun parseLocationIcons(json: JSONObject) = LocationIcons(
        tutorial = json.optJSONObject("tutorial")?.let { parseStepIcon(it) },
        requestAccess = json.optJSONObject("requestAccess")?.let { parseStepIcon(it) },
        accessError = json.optJSONObject("accessError")?.let { parseStepIcon(it) },
        grab = json.optJSONObject("grab")?.let { parseStepIcon(it) },
    )

    private fun parseNationalIdIcons(json: JSONObject) = NationalIdIcons(
        tutorial = json.optJSONObject("tutorial")?.let { parseStepIcon(it) },
        tutorialIdOrPassport = json.optJSONObject("tutorialIdOrPassport")?.let { parseStepIcon(it) },
        preScan = json.optJSONObject("preScan")?.let { parseStepIcon(it) },
        scanError = json.optJSONObject("scanError")?.let { parseStepIcon(it) },
        choose = json.optJSONObject("choose")?.let { parseStepIcon(it) },
    )

    private fun parsePassportIcons(json: JSONObject) = PassportIcons(
        tutorial = json.optJSONObject("tutorial")?.let { parseStepIcon(it) },
        preScan = json.optJSONObject("preScan")?.let { parseStepIcon(it) },
        ePassportPreScan = json.optJSONObject("ePassportPreScan")?.let { parseStepIcon(it) },
        choose = json.optJSONObject("choose")?.let { parseStepIcon(it) },
    )

    private fun parsePhoneIcons(json: JSONObject) = PhoneIcons(
        tutorial = json.optJSONObject("tutorial")?.let { parseStepIcon(it) },
        select = json.optJSONObject("select")?.let { parseStepIcon(it) },
        validateOtp = json.optJSONObject("validateOtp")?.let { parseStepIcon(it) },
    )

    private fun parseEmailIcons(json: JSONObject) = EmailIcons(
        tutorial = json.optJSONObject("tutorial")?.let { parseStepIcon(it) },
        select = json.optJSONObject("select")?.let { parseStepIcon(it) },
        validateOtp = json.optJSONObject("validateOtp")?.let { parseStepIcon(it) },
    )

    private fun parseFaceMatchingIcons(json: JSONObject) = FaceMatchingIcons(
        tutorial = json.optJSONObject("tutorial")?.let { parseStepIcon(it) },
        preScan = json.optJSONObject("preScan")?.let { parseStepIcon(it) },
        error = json.optJSONObject("error")?.let { parseStepIcon(it) },
    )

    private fun parseSecurityQuestionsIcons(json: JSONObject) = SecurityQuestionsIcons(
        tutorial = json.optJSONObject("tutorial")?.let { parseStepIcon(it) },
        authScreen = json.optJSONObject("authScreen")?.let { parseStepIcon(it) },
    )

    private fun parsePasswordIcons(json: JSONObject) = PasswordIcons(
        tutorial = json.optJSONObject("tutorial")?.let { parseStepIcon(it) },
        authScreen = json.optJSONObject("authScreen")?.let { parseStepIcon(it) },
    )

    private fun parseSignatureIcons(json: JSONObject) = SignatureIcons(
        tutorial = json.optJSONObject("tutorial")?.let { parseStepIcon(it) },
    )

    private fun parseCommonIcons(json: JSONObject) = CommonIcons(
        backgrounds = json.optJSONObject("backgrounds")?.let { parseBackgroundIcons(it) } ?: BackgroundIcons(),
        popups = json.optJSONObject("popups")?.let { parsePopupIcons(it) } ?: PopupIcons(),
        fieldIcons = json.optJSONObject("fieldIcons")?.let { parseFieldIcons(it) } ?: FieldIcons(),
        ui = json.optJSONObject("ui")?.let { parseUiIcons(it) } ?: UiIcons(),
        termsAndConditions = json.optJSONObject("termsAndConditions")?.let { parseStepIcon(it) },
    )

    private fun parseBackgroundIcons(json: JSONObject) = BackgroundIcons(
        main = json.optJSONObject("main")?.let { parseStepIcon(it) },
        layer1 = json.optJSONObject("layer1")?.let { parseStepIcon(it) },
        layer2 = json.optJSONObject("layer2")?.let { parseStepIcon(it) },
        layer3 = json.optJSONObject("layer3")?.let { parseStepIcon(it) },
        blur = json.optJSONObject("blur")?.let { parseStepIcon(it) },
        header = json.optJSONObject("header")?.let { parseStepIcon(it) },
        footer = json.optJSONObject("footer")?.let { parseStepIcon(it) },
    )

    private fun parsePopupIcons(json: JSONObject) = PopupIcons(
        background = json.optJSONObject("background")?.let { parseStepIcon(it) },
        warningIcon = json.optJSONObject("warningIcon")?.let { parseStepIcon(it) },
        errorIcon = json.optJSONObject("errorIcon")?.let { parseStepIcon(it) },
        successIcon = json.optJSONObject("successIcon")?.let { parseStepIcon(it) },
    )

    private fun parseFieldIcons(json: JSONObject) = FieldIcons(
        user = json.optJSONObject("user")?.let { parseStepIcon(it) },
        calendar = json.optJSONObject("calendar")?.let { parseStepIcon(it) },
        gender = json.optJSONObject("gender")?.let { parseStepIcon(it) },
        issuingAuthority = json.optJSONObject("issuingAuthority")?.let { parseStepIcon(it) },
        nationality = json.optJSONObject("nationality")?.let { parseStepIcon(it) },
        num = json.optJSONObject("num")?.let { parseStepIcon(it) },
        passport = json.optJSONObject("passport")?.let { parseStepIcon(it) },
        address = json.optJSONObject("address")?.let { parseStepIcon(it) },
        idCard = json.optJSONObject("idCard")?.let { parseStepIcon(it) },
        profession = json.optJSONObject("profession")?.let { parseStepIcon(it) },
        religion = json.optJSONObject("religion")?.let { parseStepIcon(it) },
        maritalStatus = json.optJSONObject("maritalStatus")?.let { parseStepIcon(it) },
    )

    private fun parseUiIcons(json: JSONObject) = UiIcons(
        visibility = json.optJSONObject("visibility")?.let { parseStepIcon(it) },
        visibilityOff = json.optJSONObject("visibilityOff")?.let { parseStepIcon(it) },
        mobile = json.optJSONObject("mobile")?.let { parseStepIcon(it) },
        mail = json.optJSONObject("mail")?.let { parseStepIcon(it) },
        answer = json.optJSONObject("answer")?.let { parseStepIcon(it) },
        error = json.optJSONObject("error")?.let { parseStepIcon(it) },
        info = json.optJSONObject("info")?.let { parseStepIcon(it) },
        edit = json.optJSONObject("edit")?.let { parseStepIcon(it) },
        activePhone = json.optJSONObject("activePhone")?.let { parseStepIcon(it) },
    )

    private fun parseUpdateIcons(json: JSONObject) = UpdateIcons(
        modeIcon = json.optJSONObject("modeIcon")?.let { parseStepIcon(it) },
        idCard = json.optJSONObject("idCard")?.let { parseStepIcon(it) },
        passport = json.optJSONObject("passport")?.let { parseStepIcon(it) },
        mobile = json.optJSONObject("mobile")?.let { parseStepIcon(it) },
        email = json.optJSONObject("email")?.let { parseStepIcon(it) },
        device = json.optJSONObject("device")?.let { parseStepIcon(it) },
        address = json.optJSONObject("address")?.let { parseStepIcon(it) },
        securityQuestions = json.optJSONObject("securityQuestions")?.let { parseStepIcon(it) },
        password = json.optJSONObject("password")?.let { parseStepIcon(it) },
    )

    private fun parseForgetIcons(json: JSONObject) = ForgetIcons(
        modeIcon = json.optJSONObject("modeIcon")?.let { parseStepIcon(it) },
        nationalId = json.optJSONObject("nationalId")?.let { parseStepIcon(it) },
        passport = json.optJSONObject("passport")?.let { parseStepIcon(it) },
        phone = json.optJSONObject("phone")?.let { parseStepIcon(it) },
        email = json.optJSONObject("email")?.let { parseStepIcon(it) },
        device = json.optJSONObject("device")?.let { parseStepIcon(it) },
        location = json.optJSONObject("location")?.let { parseStepIcon(it) },
        securityQuestions = json.optJSONObject("securityQuestions")?.let { parseStepIcon(it) },
        password = json.optJSONObject("password")?.let { parseStepIcon(it) },
    )

    companion object {
        const val NAME = "EnrollReactNative"
        private const val TAG = "EnrollReactNative"
    }
}
