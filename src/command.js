/**
 * command.js
 * Command handling module - Process user commands
 */

'use strict';

const Gui = require('./gui');
const { AVAILABLE_LANGUAGES } = require('./core/translation-service');

function receiveChannelEffect(labelKey) {
  return (value, mod, utils) => {
    const statusKey = value ? 'receiveChannelOn' : 'receiveChannelOff';
    mod.command.message(utils.t('receiveChannelStatus', utils.t(labelKey), utils.t(statusKey)));
  };
}

/**
 * Configuration item schema definition
 */
const SETTINGS_SCHEMA = {
  // Basic configuration
  'enabled': {
    type: 'boolean',
    default: false,
    description: 'Module enabled status',
    applyEffect: (value, mod, utils) => mod.command.message(utils.t(value ? 'moduleEnabled' : 'moduleDisabled'))
  },
  'sourceLang': {
    type: 'string',
    default: 'auto',
    description: 'Source language',
    validate: (value) => AVAILABLE_LANGUAGES.includes(value) || value === 'auto',
    validateMessage: (value, utils) => utils.t('invalidLanguage', value),
    applyEffect: (value, mod, utils) => mod.command.message(utils.t('sourceLanguageChanged', value))
  },
  'targetLang': {
    type: 'string',
    default: 'en',
    description: 'Target language',
    validate: (value) => AVAILABLE_LANGUAGES.includes(value) && value !== 'auto',
    validateMessage: (value, utils) => {
      if (!AVAILABLE_LANGUAGES.includes(value)) return utils.t('invalidLanguage', value);
      if (value === 'auto') return utils.t('targetLanguageAuto');
      return '';
    },
    applyEffect: (value, mod, utils) => mod.command.message(utils.t('targetLanguageChanged', value))
  },
  'sendMode': {
    type: 'boolean',
    default: false,
    description: 'Send mode',
    applyEffect: (value, mod, utils) => mod.command.message(utils.t('sendModeStatus', value ? utils.t('sendModeEnabled', mod.settings.sendLang) : utils.t('sendModeDisabled')))
  },
  'sendLang': {
    type: 'string',
    default: 'en',
    description: 'Send language',
    validate: (value) => AVAILABLE_LANGUAGES.includes(value),
    validateMessage: (value, utils) => utils.t('invalidLanguage', value),
    applyEffect: (value, mod, utils) => {
      mod.settings.sendMode = true;
      mod.command.message(utils.t('sendLanguageChanged', value));
    }
  },

  // Receive channel switches
  'receiveChannelSay': {
    type: 'boolean',
    default: true,
    description: 'Receive channel: say',
    path: 'receiveChannel.say',
    applyEffect: receiveChannelEffect('channelSay')
  },
  'receiveChannelParty': {
    type: 'boolean',
    default: true,
    description: 'Receive channel: party',
    path: 'receiveChannel.party',
    applyEffect: receiveChannelEffect('channelParty')
  },
  'receiveChannelGuild': {
    type: 'boolean',
    default: true,
    description: 'Receive channel: guild',
    path: 'receiveChannel.guild',
    applyEffect: receiveChannelEffect('channelGuild')
  },
  'receiveChannelTrade': {
    type: 'boolean',
    default: true,
    description: 'Receive channel: trade',
    path: 'receiveChannel.trade',
    applyEffect: receiveChannelEffect('channelTrade')
  },
  'receiveChannelTeam': {
    type: 'boolean',
    default: true,
    description: 'Receive channel: team',
    path: 'receiveChannel.team',
    applyEffect: receiveChannelEffect('channelTeam')
  },
  'receiveChannelGlobal': {
    type: 'boolean',
    default: true,
    description: 'Receive channel: global',
    path: 'receiveChannel.global',
    applyEffect: receiveChannelEffect('channelGlobal')
  },

  // Interface language settings
  'interfaceLanguage': {
    type: 'string',
    default: 'en',
    description: 'Interface language',
    validate: (value) => AVAILABLE_LANGUAGES.includes(value),
    validateMessage: (value, utils) => utils.t('invalidLanguage', value),
    applyEffect: async (value, mod, utils) => {
      const success = await utils.translator.setInterfaceLanguage(value);
      if (success) {
        mod.command.message(utils.translator.getI18n().t('interfaceLanguageChanged', value));
      }
    }
  },

  // Cache configuration
  'useCache': {
    type: 'boolean',
    default: false,
    description: 'Enable cache',
    path: 'cache.enabled',
    applyEffect: (value, mod, utils) => {
      mod.settings.useCache = value;
      utils.translator.setCacheEnabled(value);
      mod.command.message(utils.t('cacheEnabled', value ? utils.t('enabled') : utils.t('disabled')));
    }
  },
  'cacheMaxSize': {
    type: 'number',
    default: 20000,
    description: 'Maximum cache entries',
    path: 'cache.maxSize',
    validate: (value) => value > 0,
    validateMessage: (value, utils) => utils.t('positiveNumber'),
    applyEffect: (value, mod, utils) => {
      utils.translator.updateCacheConfig({ maxSize: value }).then(config =>
        mod.command.message(utils.t('maxCacheSet', config.maxSize)));
    }
  },
  'cacheInterval': {
    type: 'number',
    default: 10,
    description: 'Auto-save interval (minutes)',
    path: 'cache.autoSaveInterval',
    validate: (value) => value >= 0,
    validateMessage: (value, utils) => utils.t('nonNegativeNumber'),
    applyEffect: (value, mod, utils) => {
      const MAX_INTERVAL_MINUTES = 1440;
      const effectiveInterval = Math.min(value, MAX_INTERVAL_MINUTES);
      if (value > MAX_INTERVAL_MINUTES) {
        mod.command.message(utils.t('maxIntervalWarning', value, MAX_INTERVAL_MINUTES));
      }
      utils.translator.updateCacheConfig({ autoSaveInterval: effectiveInterval }).then(config =>
        mod.command.message(utils.t('autoSaveSet', effectiveInterval)));
    }
  },
  'cacheWriteThreshold': {
    type: 'number',
    default: 100,
    description: 'Write threshold',
    path: 'cache.writeThreshold',
    validate: (value) => value > 0,
    validateMessage: (value, utils) => utils.t('positiveNumber'),
    applyEffect: (value, mod, utils) => {
      utils.translator.updateCacheConfig({ writeThreshold: value });
      mod.command.message(utils.t('writeThresholdSet', value));
    }
  },
  'cacheCleanupPercentage': {
    type: 'number',
    default: 0.2,
    description: 'Cleanup percentage',
    path: 'cache.cleanupPercentage',
    validate: (value) => value > 0 && value <= 1,
    validateMessage: (value, utils) => utils.t('percentageRange'),
    applyEffect: (value, mod, utils) => {
      utils.translator.updateCacheConfig({ cleanupPercentage: value });
      mod.command.message(utils.t('cleanupPercentageSet', value));
    }
  }
};

/**
 * Config handler class
 */
class ConfigHandler {
  constructor(mod, utils) {
    this.mod = mod;
    this.utils = utils;
    this.schema = SETTINGS_SCHEMA;
  }

  handleConfigCommand(key, value) {
    const schema = this.schema[key];
    if (!schema) {
      this.mod.command.message(this.utils.t('invalidKey', key));
      return;
    }

    if (value === undefined) {
      const currentValue = this.getConfigValue(key);
      this.mod.command.message(`${schema.description}: ${currentValue}`);
      return;
    }

    let processedValue = this.processValue(value, schema);

    if (schema.validate && !schema.validate(processedValue)) {
      this.mod.command.message(schema.validateMessage ? schema.validateMessage(value, this.utils) : this.utils.t('valueError', value));
      return;
    }

    this.setConfigValue(key, processedValue);

    if (schema.applyEffect) {
      schema.applyEffect(processedValue, this.mod, this.utils);
    }

    this.mod.saveSettings();
  }

  processValue(value, schema) {
    if (schema.processInput) return schema.processInput(value);

    switch (schema.type) {
      case 'boolean':
        if (value === 'true' || value === 'on' || value === '1') return true;
        if (value === 'false' || value === 'off' || value === '0') return false;
        return Boolean(value);
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      case 'array':
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').map(v => v.trim());
        return [value];
      default:
        return value;
    }
  }

  getConfigValue(key) {
    const schema = this.schema[key];
    if (!schema) return undefined;

    return schema.path
      ? this.getValueByPath(this.mod.settings, schema.path)
      : (this.mod.settings[key] !== undefined ? this.mod.settings[key] : schema.default);
  }

  setConfigValue(key, value) {
    const schema = this.schema[key];
    if (!schema) return;

    schema.path
      ? this.setValueByPath(this.mod.settings, schema.path, value)
      : this.mod.settings[key] = value;
  }

  getValueByPath(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  setValueByPath(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
}

/**
 * Command handler module
 */
class CommandHandler {
  constructor(mod, translator) {
    this.mod = mod;
    this.translator = translator;
    this.i18n = translator.getI18n();
    this.t = (key, ...args) => this.i18n.t(key, ...args);

    const utils = {
      translator: this.translator,
      t: this.t
    };
    this.configHandler = new ConfigHandler(mod, utils);

    // Initialize GUI
    this.gui = new Gui(mod, this.translator);
    this.gui.init();
  }

  registerCommands() {
    this.mod.command.add('translate', {
      $default: () => this.showGui(),
      list: () => this.showCommandList(),

      // Endpoint management commands
      endpoint: {
        $none: () => this.listEndpointsCmd(),
        add: (...args) => this.addEndpointCmd(args),
        'fetch-models': (name) => this.fetchEndpointModelsCmd(name),
        models: (...args) => this.setEndpointModelsCmd(args),
        delete: (name) => this.deleteEndpointCmd(name),
        list: () => this.listEndpointsCmd(),
        receive: (name, ...modelParts) => this.setReceiveEndpointCmd(name, modelParts.join(' ')),
        send: (name, ...modelParts) => this.setSendEndpointCmd(name, modelParts.join(' ')),
        fallback: (name, ...modelParts) => this.setFallbackEndpointCmd(name, modelParts.join(' '))
      },

      // Cache commands
      cache: {
        $none: () => this.showGui(),
        search: keyword => this.searchCacheItems(keyword),
        remove: this.getCacheRemoveCommands(),
        save: () => this.saveCache()
      },

      // Interface language
      interface: {
        $default: (lang) => this.setInterfaceLanguage(lang),
        list: () => this.listInterfaceLanguages()
      },

      // Configuration commands
      config: {
        $default: () => this.showGui(),
        enabled: (value) => this.configHandler.handleConfigCommand('enabled', value),
        sendMode: (value) => this.configHandler.handleConfigCommand('sendMode', value),
        sourceLang: (value) => this.configHandler.handleConfigCommand('sourceLang', value),
        targetLang: (value) => this.configHandler.handleConfigCommand('targetLang', value),
        sendLang: (value) => this.configHandler.handleConfigCommand('sendLang', value),
        receiveChannelSay: (value) => this.configHandler.handleConfigCommand('receiveChannelSay', value),
        receiveChannelParty: (value) => this.configHandler.handleConfigCommand('receiveChannelParty', value),
        receiveChannelGuild: (value) => this.configHandler.handleConfigCommand('receiveChannelGuild', value),
        receiveChannelTrade: (value) => this.configHandler.handleConfigCommand('receiveChannelTrade', value),
        receiveChannelTeam: (value) => this.configHandler.handleConfigCommand('receiveChannelTeam', value),
        receiveChannelGlobal: (value) => this.configHandler.handleConfigCommand('receiveChannelGlobal', value),
        interfaceLanguage: (value) => this.configHandler.handleConfigCommand('interfaceLanguage', value),
        useCache: (value) => this.configHandler.handleConfigCommand('useCache', value),
        cacheMaxSize: (value) => this.configHandler.handleConfigCommand('cacheMaxSize', value),
        cacheInterval: (value) => this.configHandler.handleConfigCommand('cacheInterval', value),
        cacheWriteThreshold: (value) => this.configHandler.handleConfigCommand('cacheWriteThreshold', value),
        cacheCleanupPercentage: (value) => this.configHandler.handleConfigCommand('cacheCleanupPercentage', value)
      },

      gui: {
        $none: () => this.showGui(),
        models: (direction, endpointName, page, action, ...rest) => this.handleGuiModelsCmd(direction, endpointName, page, action, rest)
      }
    });
  }



  /**
   * Add endpoint command
   * Usage: translate endpoint add <name> <url> <key>
   */
  addEndpointCmd(args) {
    if (args.length < 3) {
      this.mod.command.message(this.t('addEndpointUsage'));
      this.mod.command.message('translate endpoint add <name> <url> <key>');
      return;
    }

    const [name, url, ...keyParts] = args;
    const key = keyParts.join(' ');
    const result = this.translator.addEndpoint(name, url, key);

    this.mod.command.message(this.t(result.message, result.success ? result.name : name));
  }

  /**
   * Set endpoint models command
   * Usage: translate endpoint models <name> <model1,model2,...>
   */
  setEndpointModelsCmd(args) {
    if (args.length < 2) {
      this.mod.command.message(this.t('modelsEndpointUsage'));
      this.mod.command.message('translate endpoint models <name> <model1,model2,...>');
      return;
    }

    const [name, ...modelArgs] = args;
    const models = modelArgs.join(' ').split(',').map(m => m.trim());
    const result = this.translator.setEndpointModels(name, models);

    if (result.success) {
      const modelText = result.models.length > 0 ? result.models.join(', ') : this.t('noModels');
      this.mod.command.message(this.t(result.message, result.name, modelText));
    } else {
      this.mod.command.message(this.t(result.message, name));
    }
  }

  /**
   * Fetch endpoint models command
   * Usage: translate endpoint fetch-models <name>
   */
  async fetchEndpointModelsCmd(name) {
    if (!name) {
      this.mod.command.message(this.t('fetchModelsUsage'));
      this.mod.command.message('translate endpoint fetch-models <name>');
      return;
    }

    try {
      const result = await this.translator.fetchEndpointModels(name);
      if (result.success) {
        this.mod.command.message(this.t(result.message, result.name, result.count));
      } else {
        this.mod.command.message(this.t(result.message, name));
      }
    } catch (error) {
      this.mod.command.message(this.t('endpointModelsFetchFailed', name, error.message || this.t('unknownError')));
    }
  }

  /**
   * Delete endpoint command
   */
  deleteEndpointCmd(name) {
    if (!name) {
      this.mod.command.message(this.t('endpointNameRequired'));
      return;
    }

    const result = this.translator.removeEndpoint(name);
    this.mod.command.message(this.t(result.message, result.success ? result.name : name));
  }

  /**
   * List all endpoints
   */
  listEndpointsCmd() {
    const endpoints = this.translator.listEndpoints();
    const receiveConfig = this.translator.getReceiveConfig();
    const sendConfig = this.translator.getSendConfig();
    const fallbackConfig = this.translator.getFallbackConfig();

    this.mod.command.message(this.t('endpointList'));

    // Show Google Translate (Built-in)
    const isReceiveGoogle = receiveConfig.endpoint === 'google';
    const isSendGoogle = sendConfig.endpoint === 'google';
    const isFallbackGoogle = fallbackConfig.endpoint === 'google';
    this.mod.command.message(`  [google] ${this.t('googleTranslate')} (${this.t('builtin')})${isReceiveGoogle ? ' [R]' : ''}${isSendGoogle ? ' [S]' : ''}${isFallbackGoogle ? ' [F]' : ''}`);

    if (endpoints.length === 0) {
      this.mod.command.message(`  ${this.t('noEndpointsConfigured')}`);
    } else {
      for (const ep of endpoints) {
        const isReceive = receiveConfig.endpoint === ep.name;
        const isSend = sendConfig.endpoint === ep.name;
        const isFallback = fallbackConfig.endpoint === ep.name;
        const markers = `${isReceive ? ' [R]' : ''}${isSend ? ' [S]' : ''}${isFallback ? ' [F]' : ''}`;
        const models = ep.models.length > 0 ? ep.models.join(', ') : this.t('noModels');

        this.mod.command.message(`  [${ep.name}] ${ep.url}${markers}`);
        this.mod.command.message(`    ${this.t('models')}: ${models}`);
      }
    }

    this.mod.command.message('');
    this.mod.command.message(`${this.t('receiveConfig')}: ${receiveConfig.endpoint}${receiveConfig.model ? ':' + receiveConfig.model : ''}`);
    this.mod.command.message(`${this.t('sendConfig')}: ${sendConfig.endpoint}${sendConfig.model ? ':' + sendConfig.model : ''}`);
    this.mod.command.message(`${this.t('fallbackConfig')}: ${fallbackConfig.endpoint}${fallbackConfig.model ? ':' + fallbackConfig.model : ''}`);
  }

  /**
   * Set receive endpoint
   */
  setReceiveEndpointCmd(name, model = '') {
    if (!name) {
      this.mod.command.message(this.t('endpointNameRequired'));
      this.mod.command.message('translate endpoint receive <name> [model]');
      return;
    }

    const result = this.translator.setReceiveEndpoint(name, model);
    if (result.success) {
      if (result.model) {
        this.mod.command.message(this.t(result.message, result.endpoint, result.model));
      } else {
        this.mod.command.message(this.t('receiveEndpointSetSimple', result.endpoint));
      }
    } else {
      this.mod.command.message(this.t(result.message, name));
    }
  }

  /**
   * Set send endpoint
   */
  setSendEndpointCmd(name, model = '') {
    if (!name) {
      this.mod.command.message(this.t('endpointNameRequired'));
      this.mod.command.message('translate endpoint send <name> [model]');
      return;
    }

    const result = this.translator.setSendEndpoint(name, model);
    if (result.success) {
      if (result.model) {
        this.mod.command.message(this.t(result.message, result.endpoint, result.model));
      } else {
        this.mod.command.message(this.t('sendEndpointSetSimple', result.endpoint));
      }
    } else {
      this.mod.command.message(this.t(result.message, name));
    }
  }

  /**
   * Set fallback endpoint
   */
  setFallbackEndpointCmd(name, model = '') {
    if (!name) {
      this.mod.command.message(this.t('endpointNameRequired'));
      this.mod.command.message('translate endpoint fallback <name> [model]');
      return;
    }

    const result = this.translator.setFallbackEndpoint(name, model);
    if (result.success) {
      if (result.model) {
        this.mod.command.message(this.t(result.message, result.endpoint, result.model));
      } else {
        this.mod.command.message(this.t('fallbackEndpointSetSimple', result.endpoint));
      }
    } else {
      this.mod.command.message(this.t(result.message, name));
    }
  }



  showCommandList() {
    const messages = [
      this.t('commandList'),
      this.t('commandListItem', 'translate', this.t('openGuiDesc')),
      this.t('commandListItem', 'translate gui', this.t('openGuiSettingsDesc')),
      this.t('commandListItem', 'translate list', this.t('showCommandsDesc')),
      this.t('commandCategory', this.t('basicSettings')),
      this.t('commandListItem', 'translate config enabled [true|false]', this.t('toggleModuleDesc')),
      this.t('commandListItem', 'translate config sendMode [true|false]', this.t('toggleSendModeDesc')),
      this.t('commandCategory', this.t('languageSettings')),
      this.t('commandListItem', 'translate config sourceLang [' + this.t('languageCodePlaceholder') + ']', this.t('setSourceLangDesc')),
      this.t('commandListItem', 'translate config targetLang [' + this.t('languageCodePlaceholder') + ']', this.t('setTargetLangDesc')),
      this.t('commandListItem', 'translate config sendLang [' + this.t('languageCodePlaceholder') + ']', this.t('setSendLangDesc')),
      this.t('commandListItem', 'translate config interfaceLanguage [' + this.t('languageCodePlaceholder') + ']', this.t('setInterfaceLanguageDesc')),
      this.t('commandListItem', 'translate interface list', this.t('listInterfaceLanguagesDesc')),
      this.t('commandCategory', this.t('endpointManager')),
      this.t('commandListItem', 'translate endpoint list', this.t('listEndpointsDesc')),
      this.t('commandListItem', 'translate endpoint add <name> <url> <key>', this.t('addEndpointDesc')),
      this.t('commandListItem', 'translate endpoint fetch-models <name>', this.t('fetchModelsDesc')),
      this.t('commandListItem', 'translate endpoint models <name> <model1,model2,...>', this.t('setModelsDesc')),
      this.t('commandListItem', 'translate endpoint delete <name>', this.t('deleteEndpointDesc')),
      this.t('commandListItem', 'translate endpoint receive <name> [model]', this.t('setReceiveEndpointDesc')),
      this.t('commandListItem', 'translate endpoint send <name> [model]', this.t('setSendEndpointDesc')),
      this.t('commandListItem', 'translate endpoint fallback <name> [model]', this.t('setFallbackEndpointDesc')),
      this.t('commandCategory', this.t('cacheCommands')),
      this.t('commandListItem', 'translate cache save', this.t('saveCacheDesc')),
      this.t('commandListItem', 'translate cache search [' + this.t('keywordPlaceholder') + ']', this.t('searchCacheDesc')),
      this.t('commandListItem', 'translate cache remove lang/to/keyword [' + this.t('valuePlaceholder') + ']', this.t('removeCacheDesc')),
      this.t('commandCategory', this.t('cacheSettings')),
      this.t('commandListItem', 'translate config useCache [true|false]', this.t('toggleCacheDesc')),
      this.t('commandListItem', 'translate config cacheMaxSize [' + this.t('numberPlaceholder') + ']', this.t('setCacheMaxSizeDesc')),
      this.t('commandListItem', 'translate config cacheInterval [' + this.t('numberPlaceholder') + ']', this.t('setCacheIntervalDesc')),
      '\n' + this.t('configsInGuiNote')
    ];

    messages.forEach(msg => this.mod.command.message(msg));
  }

  getCacheRemoveCommands() {
    return {
      $default: () => this.mod.command.message(this.t('specifyCondition')),
      lang: (lang) => this.removeCacheByCondition('lang', lang),
      to: (lang) => this.removeCacheByCondition('to', lang),
      keyword: (keyword) => this.removeCacheByCondition('keyword', keyword)
    };
  }

  saveCache() {
    const result = this.translator.saveCache();
    if (result && result.then) {
      result.then(() => this.mod.command.message(this.t('cacheSaved')))
        .catch(err => this.mod.command.message(this.t('saveFailed', err.message || 'Unknown error')));
    } else {
      this.mod.command.message(this.t('cacheSaved'));
    }
  }

  searchCacheItems(keyword) {
    if (!keyword) {
      this.mod.command.message(this.t('provideKeyword'));
      return;
    }

    const results = this.translator.searchCache(keyword, 5);
    if (results.length === 0) {
      this.mod.command.message(this.t('noCacheFound', keyword));
      return;
    }

    this.mod.command.message(this.t('cacheFound', results.length, keyword));
    results.forEach((item, index) => {
      const contextStr = item.context ? `[${item.context}] ` : '';
      this.mod.command.message(`${index + 1}. ${contextStr}${item.from} → ${item.to}: "${item.text}" => "${item.result}" (${item.time})`);
    });
  }

  removeCacheByCondition(type, value) {
    if ((type === 'lang' || type === 'to') && (!value || !AVAILABLE_LANGUAGES.includes(value))) {
      this.mod.command.message(value ? this.t('invalidLanguage', value) : this.t('validLanguage'));
      return;
    }

    if (type === 'keyword' && !value) {
      this.mod.command.message(this.t('validKeyword'));
      return;
    }

    switch (type) {
      case 'lang':
        this.translator.removeCacheByLang(value);
        this.mod.command.message(this.t('cacheDeleted', value));
        break;
      case 'to':
        this.translator.removeCacheByTargetLang(value);
        this.mod.command.message(this.t('targetLangCacheDeleted', value));
        break;
      case 'keyword':
        this.translator.removeCacheByKeyword(value);
        this.mod.command.message(this.t('keywordCacheDeleted', value));
        break;
    }
  }

  async setInterfaceLanguage(lang) {
    if (!lang || !AVAILABLE_LANGUAGES.includes(lang)) {
      this.mod.command.message(lang ? this.t('invalidLanguage', lang) : this.t('validLanguage'));
      return;
    }

    const result = await this.translator.setInterfaceLanguage(lang);
    this.mod.command.message(result ? this.t('interfaceLanguageChanged', lang) : this.t('invalidLanguage', lang));
  }

  listInterfaceLanguages() {
    const currentLang = this.translator.getInterfaceLanguage();
    this.mod.command.message(this.t('currentInterfaceLanguage', currentLang));
    this.mod.command.message(this.t('availableInterfaceLanguages', AVAILABLE_LANGUAGES.join(', ')));
  }

  showGui() {
    this.gui.show('index');
  }

  getDirectionConfig(direction) {
    switch (direction) {
      case 'receive':
        return this.translator.getReceiveConfig();
      case 'send':
        return this.translator.getSendConfig();
      case 'fallback':
        return this.translator.getFallbackConfig();
      default:
        return null;
    }
  }

  getNormalizedDirection(direction) {
    const normalizedDirection = typeof direction === 'string' ? direction.trim().toLowerCase() : '';
    return ['receive', 'send', 'fallback'].includes(normalizedDirection) ? normalizedDirection : '';
  }

  async handleGuiModelsCmd(direction, endpointName, page, action, rest = []) {
    const normalizedDirection = this.getNormalizedDirection(direction);
    if (!normalizedDirection) {
      this.showGui();
      return;
    }

    const normalizedEndpoint = this.getNormalizedEndpointName(endpointName, normalizedDirection);
    if (!normalizedEndpoint) {
      this.showGui();
      return;
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);

    switch (action) {
      case 'fetch':
        await this.fetchRemoteModelsPage(normalizedDirection, normalizedEndpoint, pageNumber);
        return;
      case 'remote':
      case 'local':
        this.showModelPage(normalizedDirection, normalizedEndpoint, pageNumber, action);
        return;
      case 'add':
        await this.addModelFromGui(normalizedDirection, normalizedEndpoint, pageNumber, rest.join(' '));
        return;
      case 'remove':
        await this.removeModelFromGui(normalizedDirection, normalizedEndpoint, pageNumber, rest.join(' '));
        return;
      default:
        this.showModelPage(normalizedDirection, normalizedEndpoint, pageNumber, 'local');
        return;
    }
  }

  getNormalizedEndpointName(endpointName, direction) {
    const directName = typeof endpointName === 'string' ? endpointName.trim().toLowerCase() : '';
    if (directName === 'google' || this.translator.getEndpointManager().getEndpoint(directName)) {
      return directName;
    }

    const config = this.getDirectionConfig(direction);
    return config ? config.endpoint : '';
  }

  async fetchRemoteModelsPage(direction, endpointName, pageNumber = 1) {
    if (endpointName === 'google') {
      this.showModelPage(direction, endpointName, pageNumber, 'local');
      return;
    }

    try {
      const result = await this.translator.fetchEndpointModels(endpointName);
      if (result.success) {
        this.mod.command.message(this.t(result.message, result.name, result.count));
      } else {
        this.mod.command.message(this.t(result.message, endpointName));
      }
    } catch (error) {
      this.mod.command.message(this.t('endpointModelsFetchFailed', endpointName, error.message || this.t('unknownError')));
    }

    this.showModelPage(direction, endpointName, pageNumber, 'remote');
  }

  async addModelFromGui(direction, endpointName, pageNumber, modelName) {
    const result = this.translator.addEndpointModel(endpointName, modelName);
    if (result.success) {
      this.mod.command.message(this.t(result.message, result.name, result.model));
    } else {
      this.mod.command.message(this.t(result.message, modelName || endpointName));
    }

    this.showModelPage(direction, endpointName, pageNumber, 'remote');
  }

  async removeModelFromGui(direction, endpointName, pageNumber, modelName) {
    const result = this.translator.removeEndpointModel(endpointName, modelName);
    if (result.success) {
      this.mod.command.message(this.t(result.message, result.name, result.model));
    } else {
      this.mod.command.message(this.t(result.message, modelName || endpointName));
    }

    this.showModelPage(direction, endpointName, pageNumber, 'local');
  }

  showModelPage(direction, endpointName, pageNumber = 1, tab = 'local') {
    this.gui.show('models', pageNumber, { direction, endpointName, tab });
  }
}

module.exports = CommandHandler;
