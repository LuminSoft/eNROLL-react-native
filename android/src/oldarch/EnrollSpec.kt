package com.luminsoft.enroll.reactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap

abstract class EnrollSpec internal constructor(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

    abstract fun startEnroll(options: ReadableMap, promise: Promise)
}
