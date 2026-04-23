import Foundation
import UIKit
import React
import EnrollFramework

@objc(EnrollReactNative)
class EnrollModule: RCTEventEmitter, EnrollCallBack {

    private var isFlowInProgress = false
    private var resolveBlock: RCTPromiseResolveBlock?
    private var rejectBlock: RCTPromiseRejectBlock?

    override init() {
        super.init()
    }

    @objc
    override static func moduleName() -> String! {
        return "EnrollReactNative"
    }

    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    override func supportedEvents() -> [String]! {
        return ["onRequestId"]
    }

    // ------------------------------------------------------------------
    // MARK: - Plugin method exposed to JavaScript
    // ------------------------------------------------------------------

    @objc(startEnroll:withResolver:withRejecter:)
    func startEnroll(
        _ options: NSDictionary,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        if isFlowInProgress {
            reject("FLOW_IN_PROGRESS", "An enrollment flow is already in progress", nil)
            return
        }

        // ---- Required parameters ----
        guard let tenantId = options["tenantId"] as? String, !tenantId.isEmpty else {
            reject("INVALID_ARGUMENT", "tenantId is required", nil)
            return
        }
        guard let tenantSecret = options["tenantSecret"] as? String, !tenantSecret.isEmpty else {
            reject("INVALID_ARGUMENT", "tenantSecret is required", nil)
            return
        }
        guard let enrollModeStr = options["enrollMode"] as? String, !enrollModeStr.isEmpty else {
            reject("INVALID_ARGUMENT", "enrollMode is required", nil)
            return
        }
        guard let enrollMode = parseEnrollMode(enrollModeStr) else {
            reject("INVALID_ARGUMENT", "Invalid enrollMode: \(enrollModeStr)", nil)
            return
        }

        // ---- Conditionally required parameters ----
        let applicationId = options["applicationId"] as? String ?? ""
        let levelOfTrust = options["levelOfTrust"] as? String ?? ""
        let templateId = options["templateId"] as? String ?? ""

        if enrollMode == .authentication {
            if applicationId.isEmpty {
                reject("INVALID_ARGUMENT", "applicationId is required for auth mode", nil)
                return
            }
            if levelOfTrust.isEmpty {
                reject("INVALID_ARGUMENT", "levelOfTrust is required for auth mode", nil)
                return
            }
        }

        if enrollMode == .signContarct {
            if templateId.isEmpty {
                reject("INVALID_ARGUMENT", "templateId is required for signContract mode", nil)
                return
            }
        }

        // ---- Optional parameters ----
        let enrollEnvironment = parseEnrollEnvironment(options["enrollEnvironment"] as? String)
        let localizationCode = parseLocalizationCode(options["localizationCode"] as? String)
        let googleApiKey = options["googleApiKey"] as? String ?? ""
        let skipTutorial = options["skipTutorial"] as? Bool ?? false
        let correlationId = options["correlationId"] as? String ?? ""
        let requestId = options["requestId"] as? String ?? ""
        let contractParameters = options["contractParameters"] as? String ?? ""
        let enrollForcedDocumentType = parseEnrollForcedDocumentType(options["enrollForcedDocumentType"] as? String)
        let exitStep = parseExitStep(options["enrollExitStep"] as? String)
        let contractTemplateId = Int(templateId)

        // ---- Colors: enrollTheme.colors > appColors ----
        let enrollColors: EnrollColors? = {
            if let themeObj = options["enrollTheme"] as? [String: Any],
               let colorsObj = themeObj["colors"] as? [String: Any] {
                return self.generateDynamicColors(colors: colorsObj)
            }
            guard let colorsObj = options["appColors"] as? [String: Any] else { return nil }
            return self.generateDynamicColors(colors: colorsObj)
        }()

        // ---- RTL layout for Arabic ----
        configureLayoutDirection(localizationCode)

        // ---- Save promise & mark in progress ----
        self.resolveBlock = resolve
        self.rejectBlock = reject
        self.isFlowInProgress = true

        // ---- Launch SDK on main thread ----
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            guard let presenterVC = RCTPresentedViewController() else {
                self.isFlowInProgress = false
                self.resolveBlock = nil
                self.rejectBlock = nil
                reject("VIEW_CONTROLLER_ERROR", "Unable to get presenting view controller", nil)
                return
            }

            do {
                let initModel = try EnrollInitModel(
                    tenantId: tenantId,
                    tenantSecret: tenantSecret,
                    enrollEnviroment: enrollEnvironment,
                    localizationCode: localizationCode,
                    enrollCallBack: self,
                    enrollMode: enrollMode,
                    skipTutorial: skipTutorial,
                    enrollColors: enrollColors,
                    levelOffTrustId: levelOfTrust.isEmpty ? nil : levelOfTrust,
                    applicantId: applicationId.isEmpty ? nil : applicationId,
                    correlationId: correlationId.isEmpty ? nil : correlationId,
                    forcedDocumentType: enrollForcedDocumentType,
                    requestId: requestId.isEmpty ? nil : requestId,
                    contractTemplateId: contractTemplateId,
                    signContarctParam: contractParameters.isEmpty ? nil : contractParameters,
                    exitStep: exitStep
                )

                let enrollVC = try Enroll.initViewController(
                    enrollInitModel: initModel,
                    presenterVC: presenterVC
                )
                presenterVC.present(enrollVC, animated: true)
            } catch {
                self.isFlowInProgress = false
                self.resolveBlock = nil
                self.rejectBlock = nil
                reject("ENROLL_LAUNCH_ERROR", "Failed to start enrollment: \(error.localizedDescription)", error)
            }
        }
    }

    // ------------------------------------------------------------------
    // MARK: - EnrollCallBack protocol
    // ------------------------------------------------------------------

    func enrollDidSucceed(with model: EnrollFramework.EnrollSuccessModel) {
        isFlowInProgress = false
        guard let resolve = resolveBlock else { return }
        resolveBlock = nil
        rejectBlock = nil

        var result: [String: Any] = [
            "applicantId": model.applicantId ?? "",
            "exitStepCompleted": false
        ]
        resolve(result)
    }

    func enrollDidFail(with error: EnrollFramework.EnrollErrorModel) {
        isFlowInProgress = false
        guard let reject = rejectBlock else { return }
        resolveBlock = nil
        rejectBlock = nil

        reject("ENROLL_ERROR", error.errorMessage ?? "Unknown error", nil)
    }

    func didInitializeRequest(with requestId: String) {
        sendEvent(withName: "onRequestId", body: ["requestId": requestId])
    }

    // ------------------------------------------------------------------
    // MARK: - Enum parsers
    // ------------------------------------------------------------------

    private func parseEnrollMode(_ mode: String) -> EnrollMode? {
        switch mode.lowercased() {
        case "onboarding":
            return .onboarding
        case "auth":
            return .authentication
        case "update":
            return .update
        case "signcontract":
            return .signContarct
        default:
            return nil
        }
    }

    private func parseEnrollEnvironment(_ env: String?) -> EnrollFramework.EnrollEnviroment {
        switch env {
        case "production":
            return .production
        default:
            return .staging
        }
    }

    private func parseLocalizationCode(_ code: String?) -> EnrollFramework.LocalizationEnum {
        switch code {
        case "ar":
            return .ar
        default:
            return .en
        }
    }

    private func parseEnrollForcedDocumentType(_ type: String?) -> EnrollForcedDocumentType? {
        switch type {
        case "nationalIdOnly":
            return .nationalId
        case "passportOnly":
            return .passport
        case "nationalIdOrPassport":
            return .deafult
        default:
            return nil
        }
    }

    private func parseExitStep(_ step: String?) -> EnrollFramework.StepType? {
        guard let step = step else { return nil }
        switch step {
        case "phoneOtp":
            return .phoneOtp
        case "personalConfirmation":
            return .personalConfirmation
        case "smileLiveness":
            return .smileLiveness
        case "emailOtp":
            return .emailOtp
        case "saveMobileDevice":
            return .saveMobileDevice
        case "deviceLocation":
            return .deviceLocation
        case "password":
            return .password
        case "securityQuestions":
            return .securityQuestions
        case "amlCheck":
            return .amlCheck
        case "termsAndConditions":
            return .termsAndConditions
        case "electronicSignature":
            return .electronicSignature
        case "ntraCheck":
            return .ntraCheck
        case "csoCheck":
            return .csoCheck
        default:
            return nil
        }
    }

    // ------------------------------------------------------------------
    // MARK: - Color parsing
    // ------------------------------------------------------------------

    private func generateDynamicColors(colors: [String: Any]) -> EnrollColors? {
        var primaryColor: UIColor?
        var appBackgroundColor: UIColor?
        var appBlack: UIColor?
        var secondary: UIColor?
        var appWhite: UIColor?
        var errorColor: UIColor?
        var textColor: UIColor?
        var successColor: UIColor?
        var warningColor: UIColor?

        if let primary = colors["primary"] as? [String: Any] {
            primaryColor = uiColorFrom(dict: primary)
        }
        if let bg = colors["appBackgroundColor"] as? [String: Any] {
            appBackgroundColor = uiColorFrom(dict: bg)
        }
        if let black = colors["appBlack"] as? [String: Any] {
            appBlack = uiColorFrom(dict: black)
        }
        if let sec = colors["secondary"] as? [String: Any] {
            secondary = uiColorFrom(dict: sec)
        }
        if let white = colors["appWhite"] as? [String: Any] {
            appWhite = uiColorFrom(dict: white)
        }
        if let err = colors["errorColor"] as? [String: Any] {
            errorColor = uiColorFrom(dict: err)
        }
        if let txt = colors["textColor"] as? [String: Any] {
            textColor = uiColorFrom(dict: txt)
        }
        if let suc = colors["successColor"] as? [String: Any] {
            successColor = uiColorFrom(dict: suc)
        }
        if let warn = colors["warningColor"] as? [String: Any] {
            warningColor = uiColorFrom(dict: warn)
        }

        return EnrollColors(
            primary: primaryColor,
            secondary: secondary,
            appBackgroundColor: appBackgroundColor,
            textColor: textColor,
            errorColor: errorColor,
            successColor: successColor,
            warningColor: warningColor,
            appWhite: appWhite,
            appBlack: appBlack
        )
    }

    private func uiColorFrom(dict: [String: Any]) -> UIColor? {
        guard let r = dict["r"] as? Int,
              let g = dict["g"] as? Int,
              let b = dict["b"] as? Int else {
            return nil
        }
        let opacity = dict["opacity"] as? Double ?? 1.0
        return UIColor(
            red: CGFloat(r) / 255.0,
            green: CGFloat(g) / 255.0,
            blue: CGFloat(b) / 255.0,
            alpha: CGFloat(opacity)
        )
    }

    // ------------------------------------------------------------------
    // MARK: - RTL layout configuration
    // ------------------------------------------------------------------

    private func configureLayoutDirection(_ code: EnrollFramework.LocalizationEnum) {
        DispatchQueue.main.async {
            if code == .ar {
                UIView.appearance().semanticContentAttribute = .forceRightToLeft
                UICollectionView.appearance().semanticContentAttribute = .forceRightToLeft
                UINavigationBar.appearance().semanticContentAttribute = .forceRightToLeft
                UITextField.appearance().semanticContentAttribute = .forceRightToLeft
                UITextField.appearance().textAlignment = .right
                UITextView.appearance().semanticContentAttribute = .forceRightToLeft
                UITableView.appearance().semanticContentAttribute = .forceRightToLeft
            } else {
                UIView.appearance().semanticContentAttribute = .forceLeftToRight
                UICollectionView.appearance().semanticContentAttribute = .forceLeftToRight
                UINavigationBar.appearance().semanticContentAttribute = .forceLeftToRight
                UITextField.appearance().semanticContentAttribute = .forceLeftToRight
                UITextField.appearance().textAlignment = .left
                UITextView.appearance().semanticContentAttribute = .forceLeftToRight
                UITableView.appearance().semanticContentAttribute = .forceLeftToRight
            }
        }
    }
}
