import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

// MPEG 1 Layer 3 (MP3) Bitrates in kbps
const MP3_BITRATES = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
];

// MPEG 1 Sample Rates in Hz
const MP3_SAMPLERATES = [44100, 48000, 32000];

/**
 * Parses MP3 frames and slices the exact portion between startSec and endSec.
 */
function sliceMp3Frames(
  data: Uint8Array,
  startSec: number,
  endSec: number
): Uint8Array {
  let offset = 0;
  const totalLength = data.length;

  // Check for ID3v2 header at the start
  let id3Header: Uint8Array | null = null;
  if (
    totalLength > 10 &&
    data[0] === 0x49 && // 'I'
    data[1] === 0x44 && // 'D'
    data[2] === 0x33    // '3'
  ) {
    const synchsafe =
      ((data[6] & 0x7f) << 21) |
      ((data[7] & 0x7f) << 14) |
      ((data[8] & 0x7f) << 7) |
      (data[9] & 0x7f);
    const id3Size = 10 + synchsafe;
    if (id3Size <= totalLength) {
      id3Header = data.slice(0, id3Size);
      offset = id3Size;
    }
  }

  // Scan MPEG frames
  const selectedChunks: Uint8Array[] = [];
  if (id3Header) {
    selectedChunks.push(id3Header);
  }

  let currentTime = 0;

  while (offset + 4 < totalLength) {
    // Find frame sync (11 consecutive 1 bits: 0xFF followed by 0xE0 to 0xFF)
    if (data[offset] === 0xff && (data[offset + 1] & 0xe0) === 0xe0) {
      const b1 = data[offset + 1];
      const b2 = data[offset + 2];

      const mpegVersion = (b1 >> 3) & 0x03; // 3 = MPEG1
      const layer = (b1 >> 1) & 0x03;       // 1 = Layer III
      const bitrateIndex = (b2 >> 4) & 0x0f;
      const sampleRateIndex = (b2 >> 2) & 0x03;
      const padding = (b2 >> 1) & 0x01;

      // Ensure valid standard MPEG1 Layer 3 values
      if (
        mpegVersion === 3 &&
        layer === 1 &&
        bitrateIndex > 0 &&
        bitrateIndex < 15 &&
        sampleRateIndex < 3
      ) {
        const bitrate = MP3_BITRATES[bitrateIndex] * 1000;
        const sampleRate = MP3_SAMPLERATES[sampleRateIndex];
        const frameSize = Math.floor((144 * bitrate) / sampleRate) + padding;
        const frameDuration = 1152 / sampleRate;

        if (frameSize > 0 && offset + frameSize <= totalLength) {
          if (currentTime >= startSec && currentTime <= endSec) {
            selectedChunks.push(data.subarray(offset, offset + frameSize));
          } else if (currentTime > endSec) {
            // Reached past end selection
            break;
          }

          currentTime += frameDuration;
          offset += frameSize;
          continue;
        }
      }
    }
    offset++;
  }

  // If frame parsing succeeded and found frames
  if (selectedChunks.length > (id3Header ? 1 : 0)) {
    const totalOutLength = selectedChunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalOutLength);
    let cur = 0;
    for (const chunk of selectedChunks) {
      result.set(chunk, cur);
      cur += chunk.length;
    }
    return result;
  }

  // Fallback: proportional byte slicing
  const totalDurationEstimate = Math.max(endSec + 1, 60);
  const startRatio = Math.max(0, Math.min(1, startSec / totalDurationEstimate));
  const endRatio = Math.max(startRatio, Math.min(1, endSec / totalDurationEstimate));
  const startByte = Math.floor(startRatio * totalLength);
  const endByte = Math.floor(endRatio * totalLength);
  return data.slice(startByte, endByte);
}

/**
 * Trims an audio file from startSec to endSec and returns the local file URI of the trimmed output.
 */
export async function trimAudio(
  sourceUri: string,
  startSec: number,
  endSec: number,
  title: string = "Ringtone"
): Promise<string> {
  if (endSec <= startSec) {
    throw new Error("End time must be greater than start time.");
  }

  const sourceFile = new File(sourceUri);
  const bytes = await sourceFile.bytes();
  const trimmedBytes = sliceMp3Frames(bytes, startSec, endSec);

  const cleanTitle =
    title.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim() || "BeatNova_Ringtone";
  const outputFile = new File(Paths.cache, `${cleanTitle}_${Date.now()}.mp3`);
  outputFile.create();
  outputFile.write(trimmedBytes);

  return outputFile.uri;
}

/**
 * Saves a trimmed audio file to the device's Media Library (Downloads/Music/Ringtones).
 */
export async function saveTrimmedAudioToDevice(
  fileUri: string,
  albumName: string = "BeatNova Ringtones"
): Promise<MediaLibrary.Asset> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media library permission is required to save ringtones.");
  }

  const asset = await MediaLibrary.createAssetAsync(fileUri);
  try {
    const album = await MediaLibrary.getAlbumAsync(albumName);
    if (!album) {
      await MediaLibrary.createAlbumAsync(albumName, asset, true);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
    }
  } catch (err) {
    // MediaLibrary album creation can be optional depending on Android version
    console.warn("Could not add asset to specific album:", err);
  }

  return asset;
}
