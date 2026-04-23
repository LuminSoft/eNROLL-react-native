package com.luminsoft.enroll.reactnative

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.NativeModule
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.module.model.ReactModuleInfo

class EnrollPackage : TurboReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == EnrollModule.NAME) {
            EnrollModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
            moduleInfos[EnrollModule.NAME] = ReactModuleInfo(
                EnrollModule.NAME,
                EnrollModule.NAME,
                false,  // canOverrideExistingModule
                false,  // needsEagerInit
                BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,  // isTurboModule
                false   // isCxxModule
            )
            moduleInfos
        }
    }
}
