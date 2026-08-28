package com.pegion

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioDeviceInfo
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AudioCallModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "AudioCallModule"
    private val audioManager: AudioManager? by lazy {
        reactContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    }
    private var audioFocusRequest: AudioFocusRequest? = null

    override fun getName(): String = "AudioCallModule"

    private fun requestAudioFocus() {
        val am = audioManager ?: return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val playbackAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
                val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(playbackAttributes)
                    .setAcceptsDelayedFocusGain(false)
                    .setOnAudioFocusChangeListener { focusChange ->
                        Log.d(TAG, "Audio focus changed: $focusChange")
                    }
                    .build()
                audioFocusRequest = focusRequest
                am.requestAudioFocus(focusRequest)
            } else {
                @Suppress("DEPRECATION")
                am.requestAudioFocus(
                    null,
                    AudioManager.STREAM_VOICE_CALL,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to request audio focus: ${e.message}")
        }
    }

    private fun abandonAudioFocus() {
        val am = audioManager ?: return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest?.let { am.abandonAudioFocusRequest(it) }
                audioFocusRequest = null
            } else {
                @Suppress("DEPRECATION")
                am.abandonAudioFocus(null)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to abandon audio focus: ${e.message}")
        }
    }

    private fun routeAudio(speakerOn: Boolean) {
        val am = audioManager ?: return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val devices = am.availableCommunicationDevices
                if (speakerOn) {
                    val speakerDevice = devices.firstOrNull { it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER }
                    if (speakerDevice != null) {
                        am.setCommunicationDevice(speakerDevice)
                    }
                } else {
                    val earpieceDevice = devices.firstOrNull {
                        it.type == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE ||
                        it.type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                        it.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
                    }
                    if (earpieceDevice != null) {
                        am.setCommunicationDevice(earpieceDevice)
                    } else {
                        am.clearCommunicationDevice()
                    }
                }
            }
            @Suppress("DEPRECATION")
            am.isSpeakerphoneOn = speakerOn
        } catch (e: Exception) {
            Log.w(TAG, "Error routing audio: ${e.message}")
        }
    }

    @ReactMethod
    fun setSpeakerphoneOn(on: Boolean, promise: Promise) {
        try {
            audioManager?.let { am ->
                am.mode = AudioManager.MODE_IN_COMMUNICATION
                routeAudio(on)
                promise.resolve(on)
            } ?: promise.reject("ERROR", "AudioManager not available")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun startCallAudio(isVideo: Boolean, promise: Promise) {
        try {
            audioManager?.let { am ->
                requestAudioFocus()
                am.mode = AudioManager.MODE_IN_COMMUNICATION
                am.isMicrophoneMute = false
                routeAudio(isVideo)

                // Ensure voice call volume is audible
                val streamType = AudioManager.STREAM_VOICE_CALL
                val maxVol = am.getStreamMaxVolume(streamType)
                val curVol = am.getStreamVolume(streamType)
                if (curVol < (maxVol * 0.4).toInt()) {
                    am.setStreamVolume(streamType, (maxVol * 0.8).toInt(), 0)
                }
                promise.resolve(true)
            } ?: promise.reject("ERROR", "AudioManager not available")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopCallAudio(promise: Promise) {
        try {
            audioManager?.let { am ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    try {
                        am.clearCommunicationDevice()
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to clearCommunicationDevice: ${e.message}")
                    }
                }
                @Suppress("DEPRECATION")
                am.isSpeakerphoneOn = false
                am.isMicrophoneMute = false
                am.mode = AudioManager.MODE_NORMAL
                abandonAudioFocus()
                promise.resolve(true)
            } ?: promise.reject("ERROR", "AudioManager not available")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}

