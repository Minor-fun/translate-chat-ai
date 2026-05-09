/**
 * i18n.js - Internationalization support module
 * Providing multi-language interface support for translation module, utilizing existing translation features
 */

const fs = require('fs');
const path = require('path');

// Default language
const DEFAULT_LANGUAGE = 'en';

// Base language file (English)
let baseMessages = {};
try {
  const enPath = path.join(__dirname, '..', 'lang', 'en.json');
  if (fs.existsSync(enPath)) {
    baseMessages = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  } else {
    console.error('Error: en.json not found in lang directory');
  }
} catch (e) {
  console.error('Error loading base messages:', e);
}

// Loaded language cache
const loadedLanguages = {
  [DEFAULT_LANGUAGE]: baseMessages
};

/**
 * Internationalization management class
 */
class I18nManager {
  /**
   * Constructor
   * @param {Object} mod Module object
   * @param {Object} translator Translator object
   */
  constructor(mod, translator = null) {
    this.mod = mod;
    this.translator = translator;
    this.currentLanguage = DEFAULT_LANGUAGE;

    // Set language file directory
    const srcPath = 'src';
    this.srcDir = path.join(mod.info.path, srcPath);
    this.langDir = path.join(this.srcDir, 'lang');

    try {
      if (!fs.existsSync(this.langDir)) {
        fs.mkdirSync(this.langDir);
      }
    } catch (e) {
      this.mod.error('Failed to create language file directory:', e);
    }

    // Initialize language settings
    if (mod.settings.interfaceLanguage) {
      this.setLanguage(mod.settings.interfaceLanguage);
    }
  }

  /**
   * Set translator instance
   * @param {Object} translator Translator instance
   */
  setTranslator(translator) {
    this.translator = translator;
  }

  /**
   * Set current language
   * @param {string} lang Language code
   * @returns {Promise<boolean>} Whether successful
   */
  async setLanguage(lang) {
    if (lang === DEFAULT_LANGUAGE) {
      this.currentLanguage = DEFAULT_LANGUAGE;
      this.mod.settings.interfaceLanguage = DEFAULT_LANGUAGE;
      this.mod.saveSettings();
      return true;
    }

    try {
      // Try loading language file
      const langLoaded = await this.loadLanguageFile(lang);

      if (langLoaded) {
        // Check for missing keys and translate them if needed
        const missingKeys = this._getMissingKeys(lang);
        if (missingKeys.length > 0 && this.translator) {
          this.mod.log(`Found ${missingKeys.length} missing translation keys, translating...`);
          await this._translateMissingKeys(lang, missingKeys);
        }

        this.currentLanguage = lang;
        this.mod.settings.interfaceLanguage = lang;
        this.mod.saveSettings();
        return true;
      }

      // If no language file and translator exists, try translating messages
      if (this.translator) {
        await this.translateMessages(lang);
        return true;
      }

      return false;
    } catch (e) {
      this.mod.error('Failed to set language:', e);
      return false;
    }
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Load language file
   * @param {string} lang Language code
   * @returns {Promise<boolean>} Whether successfully loaded
   */
  async loadLanguageFile(lang) {
    const langFile = path.join(this.langDir, `${lang}.json`);

    try {
      if (fs.existsSync(langFile)) {
        const fileContent = fs.readFileSync(langFile, 'utf8');
        const langData = JSON.parse(fileContent);
        loadedLanguages[lang] = langData;
        return true;
      }
    } catch (e) {
      this.mod.error(`Failed to load language file ${lang}.json:`, e);
    }

    return false;
  }

  /**
   * Get missing translation keys for a language
   * @param {string} lang Language code
   * @returns {string[]} Array of missing keys
   */
  _getMissingKeys(lang) {
    const currentMessages = loadedLanguages[lang] || {};
    const missingKeys = [];

    for (const key of Object.keys(baseMessages)) {
      if (!currentMessages[key]) {
        missingKeys.push(key);
      }
    }

    return missingKeys;
  }

  /**
   * Translate only missing keys and merge with existing translations
   * @param {string} lang Target language code
   * @param {string[]} missingKeys Array of keys to translate
   * @returns {Promise<boolean>} Whether successful
   */
  async _translateMissingKeys(lang, missingKeys) {
    if (!this.translator || missingKeys.length === 0) {
      return false;
    }

    // Check if using Google Translate (not supported for batch translation)
    if (this._isGoogleEndpoint()) {
      this.mod.log('Google Translate does not support batch i18n translation. Please configure an AI endpoint.');
      return false;
    }

    const keysToTranslate = {};
    for (const key of missingKeys) {
      keysToTranslate[key] = baseMessages[key];
    }

    const translatedMessages = await this._translateKeySet(lang, keysToTranslate);

    if (Object.keys(translatedMessages).length > 0) {
      // Merge with existing translations
      const existingMessages = loadedLanguages[lang] || {};
      const mergedMessages = { ...existingMessages, ...translatedMessages };
      loadedLanguages[lang] = mergedMessages;
      this.saveLanguageFile(lang, mergedMessages);

      this.mod.log(`Translated ${Object.keys(translatedMessages).length} missing keys.`);
      return true;
    }

    return false;
  }

  /**
   * Check if current receive endpoint is Google Translate
   * @returns {boolean}
   */
  _isGoogleEndpoint() {
    if (!this.translator || !this.translator.endpointManager) {
      return true; // Default to true if can't determine
    }
    const endpointInfo = this.translator.endpointManager.getReceiveEndpointInfo();
    return endpointInfo.isGoogle;
  }

  /**
   * Translate and save messages
   * @param {string} lang Target language code
   * @returns {Promise<boolean>} Whether successfully translated
   */
  async translateMessages(lang) {
    if (!this.translator || lang === DEFAULT_LANGUAGE) {
      return false;
    }

    // Check if using Google Translate (not supported for batch translation)
    if (this._isGoogleEndpoint()) {
      this.mod.log('Google Translate does not support batch i18n translation. Please configure an AI endpoint.');
      return false;
    }

    this.mod.log(this.t('translatingMessages', lang));

    const messages = { ...baseMessages };
    const translatedMessages = await this._translateKeySet(lang, messages);

    if (Object.keys(translatedMessages).length > 0) {
      // Save results (even if partial)
      loadedLanguages[lang] = translatedMessages;
      this.saveLanguageFile(lang, translatedMessages);

      const totalKeys = Object.keys(messages).length;
      const translatedCount = Object.keys(translatedMessages).length;

      if (translatedCount === totalKeys) {
        this.mod.log(this.t('translationComplete'));
      } else {
        this.mod.log(`Partial translation complete: ${translatedCount}/${totalKeys} keys translated.`);
      }

      this.currentLanguage = lang;
      return true;
    } else {
      this.mod.log(this.t('translationFailed'));
      return false;
    }
  }

  /**
   * Translate a set of key-value pairs using numbered format
   * @param {string} lang Target language code
   * @param {Object} keyValuePairs Object with keys and their English values
   * @returns {Promise<Object>} Translated key-value pairs
   */
  async _translateKeySet(lang, keyValuePairs) {
    const MAX_BATCH_COUNT = 40;
    const MAX_RETRIES = 2;

    const keys = Object.keys(keyValuePairs);
    const translatedMessages = {};
    let remainingKeys = [...keys];

    // Create batches from key list
    const createBatches = (keyList) => {
      const batches = [];
      for (let i = 0; i < keyList.length; i += MAX_BATCH_COUNT) {
        batches.push(keyList.slice(i, i + MAX_BATCH_COUNT));
      }
      return batches;
    };

    let retryRound = 0;

    while (remainingKeys.length > 0 && retryRound <= MAX_RETRIES) {
      const batches = createBatches(remainingKeys);
      const failedKeys = [];

      if (retryRound > 0) {
        this.mod.log(`Retry round ${retryRound}: ${remainingKeys.length} keys remaining.`);
      } else {
        this.mod.log(`Translation split into ${batches.length} batches (${remainingKeys.length} keys).`);
      }

      for (let i = 0; i < batches.length; i++) {
        const batchKeys = batches[i];

        try {
          // Build numbered format text
          const numberedText = batchKeys.map((key, index) => {
            return `[${index + 1}] ${keyValuePairs[key]}`;
          }).join('\n');

          // Add instruction for AI
          const instructionPrefix = `Translate the following numbered items to ${lang}. Keep the [number] format exactly. Do not merge or split items:\n\n`;

          // Translate
          const translatedCombined = await this.translator.translateText(
            instructionPrefix + numberedText,
            lang,
            'en',
            false // Disable cache for batch translation
          );

          // Parse response
          const parsedResults = this._parseNumberedResponse(translatedCombined, batchKeys.length);

          // Collect successful translations
          for (let j = 0; j < batchKeys.length; j++) {
            const key = batchKeys[j];
            if (parsedResults[j + 1]) {
              translatedMessages[key] = parsedResults[j + 1];
            } else {
              failedKeys.push(key);
            }
          }

          this.mod.log(`Batch ${i + 1}/${batches.length}: ${Object.keys(parsedResults).length}/${batchKeys.length} items parsed.`);

        } catch (err) {
          this.mod.error(`Batch ${i + 1}/${batches.length} failed:`, err);
          // Add all batch keys to failed list
          failedKeys.push(...batchKeys);
        }

        // Wait between batches to avoid rate limits
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      remainingKeys = failedKeys;
      retryRound++;

      // Wait before retry round
      if (remainingKeys.length > 0 && retryRound <= MAX_RETRIES) {
        this.mod.log(`${remainingKeys.length} keys failed, retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    if (remainingKeys.length > 0) {
      this.mod.log(`Warning: ${remainingKeys.length} keys could not be translated.`);
    }

    return translatedMessages;
  }

  /**
   * Parse numbered response from AI
   * @param {string} response AI response text
   * @param {number} expectedCount Expected number of items
   * @returns {Object} Map of number -> translated text
   */
  _parseNumberedResponse(response, expectedCount) {
    const results = {};

    // Try multiple parsing strategies
    // Strategy 1: Match [n] format with regex
    const regex = /\[(\d+)\]\s*(.+?)(?=\n\[|\n*$)/gs;
    let match;

    while ((match = regex.exec(response)) !== null) {
      const num = parseInt(match[1], 10);
      const text = match[2].trim();
      if (num >= 1 && num <= expectedCount && text) {
        results[num] = text;
      }
    }

    // Strategy 2: If first strategy got few results, try line-by-line
    if (Object.keys(results).length < expectedCount / 2) {
      const lines = response.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const lineMatch = line.match(/^\[(\d+)\]\s*(.+)$/);
        if (lineMatch) {
          const num = parseInt(lineMatch[1], 10);
          const text = lineMatch[2].trim();
          if (num >= 1 && num <= expectedCount && text && !results[num]) {
            results[num] = text;
          }
        }
      }
    }

    return results;
  }

  /**
   * Save language file
   * @param {string} lang Language code
   * @param {Object} messages Message object
   */
  saveLanguageFile(lang, messages) {
    const langFile = path.join(this.langDir, `${lang}.json`);

    try {
      fs.writeFileSync(langFile, JSON.stringify(messages, null, 2), 'utf8');
    } catch (e) {
      this.mod.error(`Failed to save language file ${lang}.json:`, e);
    }
  }

  /**
   * Get translated text
   * @param {string} key Text key
   * @param {...any} args Formatting arguments
   * @returns {string} Translated text
   */
  getText(key, ...args) {
    // Get translation for current language, fallback to base language if not exists
    const messages = loadedLanguages[this.currentLanguage] || baseMessages;

    // Get translation for key, fallback to key if not exists
    let text = messages[key] || baseMessages[key] || key;

    // Argument replacement
    if (args.length > 0) {
      args.forEach((arg, index) => {
        text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
      });
    }

    return text;
  }

  /**
   * Short for getText
   */
  t(key, ...args) {
    return this.getText(key, ...args);
  }
}

module.exports = {
  I18nManager,
  DEFAULT_LANGUAGE,
  baseMessages
};