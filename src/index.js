/**
 * Translator class
 * Main entry module - Coordinates all sub-modules
 */

'use strict';

const path = require('path');
const { I18nManager } = require('./managers/i18n-manager');
const EndpointManager = require('./managers/endpoint-manager');
const { TranslationService, AVAILABLE_LANGUAGES } = require('./core/translation-service');
const ChatHooks = require('./core/chat-hooks');
const CommandHandler = require('./command');
const { defaultCacheManager } = require('./managers/cache-manager');

module.exports = class Translator {
  constructor(mod) {
    this.mod = mod;
    this.i18n = new I18nManager(mod);
    this.endpointManager = new EndpointManager(mod);
    this.translationService = new TranslationService(this.endpointManager, this.i18n);

    // Enable cache by default
    if (this.mod.settings.useCache === undefined) {
      this.mod.settings.useCache = true;
    }
    defaultCacheManager.setEnabled(this.mod.settings.useCache);

    // Build cache path from index.js location (src/) to avoid path issues
    const cacheConfig = Object.assign({}, this.mod.settings.cache || {});
    cacheConfig.cachePath = path.join(__dirname, cacheConfig.cachePath || '../data/translation-cache.json');
    defaultCacheManager.updateConfig(cacheConfig);

    this.chatHooks = new ChatHooks(mod, this.translationService, this.i18n);

    // Async initialization
    this._initAsync();

    // Initialize command handler
    this.commandHandler = new CommandHandler(mod, this);
    this.commandHandler.registerCommands();
    this.chatHooks.setup();

    // In-game welcome message
    this.mod.game.on('leave_loading_screen', () => {
      if (mod.settings.sendMode) {
        this.mod.command.message(this.getStatusSummaryLine());
        this.mod.command.message(this.getModelSummaryLine());
      }
    });
  }

  async _initAsync() {
    try {
      await defaultCacheManager.init();
      this.i18n.setTranslator(this);
      this.translationService.setI18n(this.i18n);

      if (this.mod.settings.interfaceLanguage && this.mod.settings.interfaceLanguage !== 'en') {
        await this.i18n.setLanguage(this.mod.settings.interfaceLanguage);
      }
    } catch (e) {
      console.error('Translation system init error:', e);
    }
  }

  // Endpoint Management
  getEndpointManager() { return this.endpointManager; }
  addEndpoint(name, url, key) { return this.endpointManager.addEndpoint(name, url, key); }
  removeEndpoint(name) { return this.endpointManager.removeEndpoint(name); }
  setEndpointModels(name, models) { return this.endpointManager.setModels(name, models); }
  fetchEndpointModels(name) { return this.endpointManager.fetchModels(name); }
  addEndpointModel(name, model) { return this.endpointManager.addModel(name, model); }
  removeEndpointModel(name, model) { return this.endpointManager.removeModel(name, model); }
  getEndpointRemoteModels(name) { return this.endpointManager.getRemoteModels(name); }
  listEndpoints() { return this.endpointManager.listEndpoints(); }
  setReceiveEndpoint(name, model) { return this.endpointManager.setReceiveConfig(name, model); }
  setSendEndpoint(name, model) { return this.endpointManager.setSendConfig(name, model); }
  setFallbackEndpoint(name, model) { return this.endpointManager.setFallbackConfig(name, model); }
  getReceiveConfig() { return this.endpointManager.getReceiveConfig(); }
  getSendConfig() { return this.endpointManager.getSendConfig(); }
  getFallbackConfig() { return this.endpointManager.getFallbackConfig(); }

  // Translation
  async translateText(text, targetLang, sourceLang = 'auto', useCache = true) {
    return this.translationService.translate(text, targetLang, sourceLang, useCache);
  }

  getReceiveProvider() { return this.translationService.getReceiveProvider(); }
  getSendProvider() { return this.translationService.getSendProvider(); }

  getEngineState() {
    return {
      receive: this.translationService.getState('receive'),
      send: this.translationService.getState('send'),
      provider: this.endpointManager.getReceiveConfig().endpoint,
      model: this.translationService.getState('receive').model,
      fullDisplayName: this.getReceiveProvider()
    };
  }

  // Cache Management
  getCacheStats() { return this.translationService.getCacheStats(); }

  setCacheEnabled(enabled) {
    this.mod.settings.useCache = enabled;
    return defaultCacheManager.setEnabled(enabled);
  }

  updateCacheConfig(config) {
    defaultCacheManager.updateConfig(config);
    return defaultCacheManager.saveToFile().then(() => defaultCacheManager.config);
  }

  searchCache(keyword, limit = 5) { return defaultCacheManager.search(keyword, limit); }
  removeCacheByLang(lang) { return defaultCacheManager.clearSelected({ fromLang: lang }); }
  removeCacheByTargetLang(lang) { return defaultCacheManager.clearSelected({ toLang: lang }); }
  removeCacheByKeyword(keyword) { return defaultCacheManager.clearSelected({ keyword }); }
  saveCache() { return defaultCacheManager.saveToFile(); }

  // I18n
  async setInterfaceLanguage(lang) { return this.i18n.setLanguage(lang); }
  getInterfaceLanguage() { return this.i18n.getLanguage(); }
  getI18n() { return this.i18n; }

  // Utility
  getSupportedLanguages() { return AVAILABLE_LANGUAGES; }

  getReceiveChannelsSummary() {
    const receiveChannel = this.mod.settings.receiveChannel || {};
    const channelLabels = [
      ['say', 'channelSay'],
      ['party', 'channelParty'],
      ['guild', 'channelGuild'],
      ['trade', 'channelTrade'],
      ['team', 'channelTeam'],
      ['global', 'channelGlobal']
    ];

    const disabledChannels = channelLabels
      .filter(([key]) => receiveChannel[key] === false)
      .map(([, labelKey]) => this.i18n.t(labelKey));

    if (disabledChannels.length === 0) {
      return this.i18n.t('channelsAllOn');
    }

    return this.i18n.t('channelsOffSummary', disabledChannels.join(', '));
  }

  getStatusSummaryLine() {
    const stats = this.getCacheStats() || { hits: 0, misses: 0 };
    const totalTranslated = (stats.hits || 0) + (stats.misses || 0);
    return this.i18n.t(
      'welcomeStatusMessage',
      this.mod.settings.sendLang,
      stats.hits || 0,
      totalTranslated,
      this.getReceiveChannelsSummary()
    );
  }

  getDirectionModelName(direction) {
    const endpointInfo = direction === 'send'
      ? this.endpointManager.getSendEndpointInfo()
      : direction === 'fallback'
        ? this.endpointManager.getFallbackEndpointInfo()
        : this.endpointManager.getReceiveEndpointInfo();

    if (endpointInfo.isGoogle) {
      return 'Google';
    }

    return endpointInfo.model || endpointInfo.endpoint?.name || 'unknown';
  }

  getModelSummaryLine() {
    return this.i18n.t(
      'welcomeModelMessage',
      this.getDirectionModelName('receive'),
      this.getDirectionModelName('send'),
      this.getDirectionModelName('fallback')
    );
  }

  // Destructor - Called when module is unloaded
  destructor() {
    // Save cache to file before unloading
    if (defaultCacheManager.modified) {
      defaultCacheManager.saveToFile().catch(() => { });
    }
    // Stop auto-save timer
    defaultCacheManager.destroy();
  }

};
