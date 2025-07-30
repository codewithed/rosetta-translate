import { RecordingOptions, IOSOutputFormat, AudioQuality } from "expo-audio";

export const optionsForRecorder: RecordingOptions = {
  // Common options that apply unless overridden by platform-specific settings
  extension: ".wav",
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 128000,

  ios: {
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  android: {
    extension: ".3gp",
    outputFormat: "3gp",
    audioEncoder: "amr_wb",
  },
};
