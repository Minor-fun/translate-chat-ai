'use strict';

const DefaultSettings = {
  enabled: false,
  sourceLang: 'auto',
  targetLang: 'en',
  sendMode: false,
  sendLang: 'en',
  useCache: false,
  interfaceLanguage: 'en',

  receiveChannel: {
    say: true,
    party: true,
    guild: true,
    trade: true,
    team: true,
    global: true
  },

  endpoints: {

  },

  receive: {
    endpoint: 'google',
    model: ''
  },

  send: {
    endpoint: 'google',
    model: ''
  },

  fallback: {
    endpoint: 'google',
    model: ''
  },

  cache: {
    enabled: false,
    maxSize: 20000,
    autoSaveInterval: 10,
    cachePath: '../data/translation-cache.json',
    writeThreshold: 100,
    cleanupPercentage: 0.2
  }
};

module.exports = function MigrateSettings() {
  return JSON.parse(JSON.stringify(DefaultSettings));
};
