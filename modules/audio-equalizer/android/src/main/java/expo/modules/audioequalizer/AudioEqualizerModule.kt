package expo.modules.audioequalizer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.audiofx.AudioEffect
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.Virtualizer
import android.os.Build
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AudioEqualizerModule : Module() {
  private var currentSessionId: Int = 0
  private var equalizer: Equalizer? = null
  private var bassBoost: BassBoost? = null
  private var virtualizer: Virtualizer? = null

  private var isEnabled: Boolean = true
  private var bandLevels: MutableList<Double> = mutableListOf(0.0, 0.0, 0.0, 0.0, 0.0)
  private var bassBoostStrength: Double = 0.0
  private var virtualizerStrength: Double = 0.0

  private var sessionReceiver: BroadcastReceiver? = null

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React application context not available")

  override fun definition() = ModuleDefinition {
    Name("AudioEqualizer")

    OnCreate {
      registerSessionReceiver()
      initEffects(0)
    }

    OnDestroy {
      unregisterSessionReceiver()
      releaseEffects()
    }

    AsyncFunction("isAvailable") {
      try {
        if (equalizer == null) {
          initEffects(currentSessionId)
        }
        equalizer != null
      } catch (e: Exception) {
        false
      }
    }

    AsyncFunction("getBandFrequencies") {
      val frequencies = mutableListOf<Int>()
      try {
        if (equalizer == null) {
          initEffects(currentSessionId)
        }
        val eq = equalizer
        if (eq != null) {
          val numBands = eq.numberOfBands.toInt()
          for (i in 0 until numBands) {
            val centerFreqMilliHz = eq.getCenterFreq(i.toShort())
            frequencies.add(centerFreqMilliHz / 1000) // Convert milliHertz to Hertz
          }
        }
      } catch (e: Exception) {
        Log.w("AudioEqualizer", "Could not get band frequencies: ${e.message}")
      }
      frequencies
    }

    AsyncFunction("applySettings") { enabled: Boolean, bands: List<Double>, bass: Double, virt: Double ->
      isEnabled = enabled
      bandLevels.clear()
      bandLevels.addAll(bands)
      bassBoostStrength = bass
      virtualizerStrength = virt

      if (equalizer == null) {
        initEffects(currentSessionId)
      } else {
        applyCurrentState()
      }
      true
    }

    AsyncFunction("setEnabled") { enabled: Boolean ->
      isEnabled = enabled
      applyCurrentState()
      true
    }
  }

  private fun registerSessionReceiver() {
    try {
      sessionReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
          val action = intent?.action ?: return
          val sessionId = intent.getIntExtra(AudioEffect.EXTRA_AUDIO_SESSION, 0)

          if (AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION == action) {
            if (sessionId > 0 && sessionId != currentSessionId) {
              Log.d("AudioEqualizer", "Attaching to opened audio session: $sessionId")
              currentSessionId = sessionId
              initEffects(sessionId)
            }
          } else if (AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION == action) {
            if (sessionId == currentSessionId && currentSessionId != 0) {
              Log.d("AudioEqualizer", "Closing audio session: $sessionId, falling back to global mix")
              currentSessionId = 0
              initEffects(0)
            }
          }
        }
      }

      val filter = IntentFilter().apply {
        addAction(AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION)
        addAction(AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.registerReceiver(sessionReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        context.registerReceiver(sessionReceiver, filter)
      }
    } catch (e: Exception) {
      Log.w("AudioEqualizer", "Could not register audio session receiver: ${e.message}")
    }
  }

  private fun unregisterSessionReceiver() {
    try {
      sessionReceiver?.let {
        context.unregisterReceiver(it)
        sessionReceiver = null
      }
    } catch (e: Exception) {
      // Ignore
    }
  }

  @Synchronized
  private fun initEffects(sessionId: Int) {
    releaseEffects()

    try {
      equalizer = Equalizer(1000, sessionId).apply {
        enabled = isEnabled
      }
    } catch (e: Exception) {
      Log.w("AudioEqualizer", "Could not create Equalizer for session $sessionId: ${e.message}")
      equalizer = null
    }

    try {
      bassBoost = BassBoost(1000, sessionId).apply {
        enabled = isEnabled && bassBoostStrength > 0
      }
    } catch (e: Exception) {
      Log.w("AudioEqualizer", "Could not create BassBoost for session $sessionId: ${e.message}")
      bassBoost = null
    }

    try {
      virtualizer = Virtualizer(1000, sessionId).apply {
        enabled = isEnabled && virtualizerStrength > 0
      }
    } catch (e: Exception) {
      Log.w("AudioEqualizer", "Could not create Virtualizer for session $sessionId: ${e.message}")
      virtualizer = null
    }

    applyCurrentState()
  }

  @Synchronized
  private fun applyCurrentState() {
    try {
      equalizer?.let { eq ->
        eq.enabled = isEnabled
        if (isEnabled) {
          val range = eq.bandLevelRange
          val minLevel = range?.get(0)?.toInt() ?: -1500
          val maxLevel = range?.get(1)?.toInt() ?: 1500
          val numBands = eq.numberOfBands.toInt()

          for (i in 0 until numBands) {
            val dB = if (i < bandLevels.size) bandLevels[i] else 0.0
            val mB = (dB * 100).toInt().coerceIn(minLevel, maxLevel).toShort()
            eq.setBandLevel(i.toShort(), mB)
          }
        }
      }
    } catch (e: Exception) {
      Log.w("AudioEqualizer", "Failed applying band levels: ${e.message}")
    }

    try {
      bassBoost?.let { bb ->
        val active = isEnabled && bassBoostStrength > 0
        bb.enabled = active
        if (active && bb.strengthSupported) {
          val targetStrength = (bassBoostStrength * 10).toInt().coerceIn(0, 1000).toShort()
          bb.setStrength(targetStrength)
        }
      }
    } catch (e: Exception) {
      Log.w("AudioEqualizer", "Failed applying bass boost: ${e.message}")
    }

    try {
      virtualizer?.let { virt ->
        val active = isEnabled && virtualizerStrength > 0
        virt.enabled = active
        if (active && virt.strengthSupported) {
          val targetStrength = (virtualizerStrength * 10).toInt().coerceIn(0, 1000).toShort()
          virt.setStrength(targetStrength)
        }
      }
    } catch (e: Exception) {
      Log.w("AudioEqualizer", "Failed applying virtualizer: ${e.message}")
    }
  }

  @Synchronized
  private fun releaseEffects() {
    try {
      equalizer?.release()
    } catch (e: Exception) {
      // Ignore
    }
    equalizer = null

    try {
      bassBoost?.release()
    } catch (e: Exception) {
      // Ignore
    }
    bassBoost = null

    try {
      virtualizer?.release()
    } catch (e: Exception) {
      // Ignore
    }
    virtualizer = null
  }
}
