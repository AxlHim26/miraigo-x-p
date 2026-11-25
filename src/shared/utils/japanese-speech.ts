import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * Language tag for Japanese text-to-speech.
 *
 * expo-speech on Android builds the locale with `Locale.Builder().setLanguage(tag)`, which only accepts a
 * bare language subtag. 'ja-JP' throws `IllformedLocaleException`, the module swallows it and falls back to
 * the device locale, so Japanese text is read with the phone's own (e.g. Vietnamese) voice. iOS and web
 * expect the full BCP-47 tag.
 */
export const JAPANESE_SPEECH_LANGUAGE = Platform.OS === 'android' ? 'ja' : 'ja-JP';

let japaneseVoiceAvailable: Promise<boolean> | undefined;

/**
 * False only when the engine lists voices and none of them is Japanese. Android silently falls back to the
 * default voice for a missing language, so callers should report a failure instead of speaking.
 * Resolves true when the voice list is unavailable, to avoid blocking speech on platforms that don't expose it.
 */
export const hasJapaneseVoice = () =>
  (japaneseVoiceAvailable ??= Speech.getAvailableVoicesAsync()
    .then((voices) => voices.length === 0 || voices.some((voice) => voice.language.toLowerCase().startsWith('ja')))
    .catch(() => true));
