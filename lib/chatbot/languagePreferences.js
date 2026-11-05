// Language mode preferences for the assistant.
//
// There are two related values:
//   - languageMode: what the user selected — automatic detection or a manual language.
//   - language:     the language actually used for the current response.
//
// A manual mode always wins over automatic detection. Automatic detection is the default.

import {
  SUPPORTED_LANGUAGES,
} from './languageDictionary';
import { LANGUAGE_STORAGE_KEY, readLocal, removeLocal, writeLocal } from '../storage';

export const LANGUAGE_MODES = ['auto', 'en', 'tl', 'ceb'];
export const DEFAULT_LANGUAGE_MODE = 'auto';

export const LANGUAGE_INDICATORS = {
  en: 'EN',
  tl: 'TL',
  ceb: 'BIS',
};

export const LANGUAGE_NAMES = {
  en: 'English',
  tl: 'Tagalog',
  ceb: 'Bisaya',
};

export const LANGUAGE_MODE_LABELS = {
  auto: {
    en: 'Automatic Detection',
    tl: 'Awtomatikong Detection',
    ceb: 'Awtomatikong Detection',
  },
  en: {
    en: 'English',
    tl: 'English',
    ceb: 'English',
  },
  tl: {
    en: 'Tagalog',
    tl: 'Tagalog',
    ceb: 'Tagalog',
  },
  ceb: {
    en: 'Bisaya',
    tl: 'Bisaya',
    ceb: 'Bisaya',
  },
};

export const LANGUAGE_NOTICES = {
  auto: {
    en: 'Automatic language detection is on. I will follow the language of your message.',
    tl: 'Naka-on ang awtomatikong detection ng wika. Susundan ko ang wika ng iyong mensahe.',
    ceb: 'Naka-on ang awtomatikong detection sa pinulongan. Sundon nako ang pinulongan sa imong mensahe.',
  },
  en: {
    en: "Okay — I'll continue in English.",
    tl: 'Sige — magpapatuloy tayo sa English.',
    ceb: 'Sige — magpadayon kita sa English.',
  },
  tl: {
    en: "Okay — I'll continue in Tagalog.",
    tl: 'Sige — magpapatuloy tayo sa Tagalog.',
    ceb: 'Sige — magpadayon kita sa Tagalog.',
  },
  ceb: {
    en: "Okay — I'll continue in Bisaya.",
    tl: 'Sige — magpapatuloy tayo sa Bisaya.',
    ceb: 'Sige — magpadayon kita sa Bisaya.',
  },
};

export function normalizeLanguageMode(value) {
  const mode = String(value || '').toLowerCase();
  return LANGUAGE_MODES.includes(mode) ? mode : DEFAULT_LANGUAGE_MODE;
}

export function isManualLanguageMode(value) {
  const mode = normalizeLanguageMode(value);
  return mode !== 'auto';
}

export function isSupportedLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value);
}

/**
 * Resolve which language a response should use.
 *
 * Priority:
 *   1. An explicit in-message request ("speak Tagalog") switches the mode.
 *   2. A manual mode selected by the user always overrides detection.
 *   3. Detected language markers.
 *   4. The language already in use for the conversation.
 */
export function resolveResponseLanguage({
  mode = DEFAULT_LANGUAGE_MODE,
  detected = null,
  current = 'en',
  explicit = null,
} = {}) {
  if (isSupportedLanguage(explicit)) {
    return { language: explicit, mode: explicit, switchedByMessage: true };
  }

  const normalizedMode = normalizeLanguageMode(mode);
  if (isManualLanguageMode(normalizedMode)) {
    return { language: normalizedMode, mode: normalizedMode, switchedByMessage: false };
  }

  if (isSupportedLanguage(detected)) {
    return { language: detected, mode: normalizedMode, switchedByMessage: false };
  }

  return {
    language: isSupportedLanguage(current) ? current : 'en',
    mode: normalizedMode,
    switchedByMessage: false,
  };
}

export function indicatorFor(language) {
  return LANGUAGE_INDICATORS[language] || LANGUAGE_INDICATORS.en;
}

export function languageModeLabel(mode, uiLanguage = 'en') {
  const normalized = normalizeLanguageMode(mode);
  const labels = LANGUAGE_MODE_LABELS[normalized] || LANGUAGE_MODE_LABELS.auto;
  return labels[uiLanguage] || labels.en;
}

export function languageNotice(mode, uiLanguage = 'en') {
  const normalized = normalizeLanguageMode(mode);
  const notices = LANGUAGE_NOTICES[normalized] || LANGUAGE_NOTICES.auto;
  return notices[uiLanguage] || notices.en;
}

/**
 * The selector label shown in the compact assistant toolbar.
 * "AUTO" is intentionally short so the four modes fit on a narrow panel.
 */
export function modeButtonLabel(mode) {
  const normalized = normalizeLanguageMode(mode);
  if (normalized === 'auto') return 'AUTO';
  return LANGUAGE_INDICATORS[normalized];
}

export function loadLanguageMode() {
  const saved = readLocal(LANGUAGE_STORAGE_KEY);
  if (saved && typeof saved === 'object' && saved.mode) {
    return normalizeLanguageMode(saved.mode);
  }
  return DEFAULT_LANGUAGE_MODE;
}

export function saveLanguageMode(mode) {
  const normalized = normalizeLanguageMode(mode);
  const saved = writeLocal(LANGUAGE_STORAGE_KEY, {
    mode: normalized,
    savedAt: new Date().toISOString(),
  });
  return saved ? normalized : null;
}

export function clearLanguageMode() {
  removeLocal(LANGUAGE_STORAGE_KEY);
}
