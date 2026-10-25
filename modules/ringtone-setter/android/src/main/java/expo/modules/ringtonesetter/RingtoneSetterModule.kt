package expo.modules.ringtonesetter

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream

class RingtoneSetterModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("RingtoneSetter")

    AsyncFunction("canWriteSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.System.canWrite(context)
      } else {
        true
      }
    }

    AsyncFunction("openWriteSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val intent = Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
          data = Uri.parse("package:" + context.packageName)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
      }
    }

    AsyncFunction("saveToRingtones") { filePath: String, title: String ->
      val cleanPath = if (filePath.startsWith("file://")) filePath.substring(7) else filePath
      val sourceFile = File(cleanPath)

      if (!sourceFile.exists()) {
        throw Exception("Kaynak ses dosyası bulunamadı: $cleanPath")
      }

      val ext = sourceFile.extension.lowercase().ifEmpty { "m4a" }
      val mimeType = when (ext) {
        "mp3" -> "audio/mpeg"
        "m4a", "mp4", "aac" -> "audio/mp4"
        "ogg" -> "audio/ogg"
        "wav" -> "audio/wav"
        else -> "audio/mp4"
      }

      val sanitizedTitle = title.trim().ifEmpty { "BeatNova_Ringtone" }
      val fileName = if (sanitizedTitle.endsWith(".$ext", ignoreCase = true)) {
        sanitizedTitle
      } else {
        "$sanitizedTitle.$ext"
      }

      val resolver = context.contentResolver

      // Aynı isimde mevcut zil sesi varsa mükerrer kaydı önlemek için temizle
      try {
        val projection = arrayOf(MediaStore.Audio.Media._ID)
        val selection = "${MediaStore.Audio.Media.DISPLAY_NAME} = ? AND ${MediaStore.Audio.Media.IS_RINGTONE} = 1"
        val selectionArgs = arrayOf(fileName)
        resolver.query(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, projection, selection, selectionArgs, null)?.use { cursor ->
          while (cursor.moveToNext()) {
            val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID))
            val existingUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id)
            resolver.delete(existingUri, null, null)
          }
        }
      } catch (_: Exception) {
        // Eski kaydı silme denemesi başarısız olsa da yeni kayda devam et
      }

      val contentUri: Uri

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val values = ContentValues().apply {
          put(MediaStore.Audio.Media.TITLE, sanitizedTitle)
          put(MediaStore.Audio.Media.DISPLAY_NAME, fileName)
          put(MediaStore.Audio.Media.MIME_TYPE, mimeType)
          put(MediaStore.Audio.Media.IS_RINGTONE, 1)
          put(MediaStore.Audio.Media.IS_NOTIFICATION, 0)
          put(MediaStore.Audio.Media.IS_ALARM, 0)
          put(MediaStore.Audio.Media.IS_MUSIC, 0)
          put(MediaStore.Audio.Media.RELATIVE_PATH, Environment.DIRECTORY_RINGTONES)
          put(MediaStore.Audio.Media.IS_PENDING, 1)
        }

        val insertedUri = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values)
          ?: throw Exception("MediaStore kaydı oluşturulamadı.")

        resolver.openOutputStream(insertedUri)?.use { out ->
          FileInputStream(sourceFile).use { input ->
            input.copyTo(out)
          }
        } ?: throw Exception("Zil sesi dosyası yazılamadı.")

        values.clear()
        values.put(MediaStore.Audio.Media.IS_PENDING, 0)
        resolver.update(insertedUri, values, null, null)

        contentUri = insertedUri
      } else {
        // Android 9 ve altı (Legacy API)
        @Suppress("DEPRECATION")
        val ringtonesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_RINGTONES)
        if (!ringtonesDir.exists()) {
          ringtonesDir.mkdirs()
        }

        val destFile = File(ringtonesDir, fileName)
        sourceFile.copyTo(destFile, overwrite = true)

        @Suppress("DEPRECATION")
        val values = ContentValues().apply {
          put(MediaStore.Audio.Media.DATA, destFile.absolutePath)
          put(MediaStore.Audio.Media.TITLE, sanitizedTitle)
          put(MediaStore.Audio.Media.DISPLAY_NAME, fileName)
          put(MediaStore.Audio.Media.MIME_TYPE, mimeType)
          put(MediaStore.Audio.Media.IS_RINGTONE, 1)
          put(MediaStore.Audio.Media.IS_NOTIFICATION, 0)
          put(MediaStore.Audio.Media.IS_ALARM, 0)
          put(MediaStore.Audio.Media.IS_MUSIC, 0)
        }

        contentUri = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values)
          ?: Uri.fromFile(destFile)
      }

      contentUri.toString()
    }

    AsyncFunction("setDefaultRingtone") { uriString: String ->
      val uri = Uri.parse(uriString)
      try {
        RingtoneManager.setActualDefaultRingtoneUri(
          context,
          RingtoneManager.TYPE_RINGTONE,
          uri
        )
        true
      } catch (e: Exception) {
        throw Exception("Varsayılan zil sesi ayarlanamadı: ${e.message}")
      }
    }
  }
}
