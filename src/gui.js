/* eslint-disable no-case-declarations */
"use strict";

// Hook settings
const HOOK_SETTINGS = Object.freeze({
    "LAST": { "order": 100010 },
    "LASTA": { "order": 100010, "filter": { "fake": false, "silenced": false, "modified": null } }
});

// Color definitions
const COLORS = {
    red: "#FF0000",          // Red - Disabled status
    green: "#00FF00",        // Green - Enabled status
    yellow: "#FFFF00",       // Yellow - Title
    blue: "#00BFFF",         // Blue - Button
    gray: "#AAAAAA",         // Gray - Description text
    white: "#FFFFFF",        // White - Normal text
    orange: "#FFA500",       // Orange - Warning
    purple: "#FFFFFF",       // White - Special info
    cyan: "#00FFFF"          // Cyan - Important data
};

// Common options
const COMMON_LANGS = ['en', 'zh', 'zh-TW', 'ko', 'ja', 'ru', 'es', 'pt', 'fr', 'de', 'it'];

// Supported languages for translation interface
const GUI_LANGS = ['en', 'zh', 'zh-TW', 'de', 'es', 'fr', 'ru'];
const MODELS_PER_PAGE = 50;
const MAIN_PAGE_SIZE = {
    section: "+24",
    body: "+20",
    small: "+18",
    engine: "+20",
    modelLabel: "+19",
    modelValue: "+22",
    action: "+17",
    hint: "+17"
};
const MODEL_PAGE_SIZE = {
    title: "+22",
    button: "+18",
    text: "+17",
    small: "+16"
};

// Receive channel switches (only mapped channels)
const RECEIVE_CHANNELS = [
    { key: 'say', labelKey: 'channelSay' },
    { key: 'party', labelKey: 'channelParty' },
    { key: 'guild', labelKey: 'channelGuild' },
    { key: 'trade', labelKey: 'channelTrade' },
    { key: 'team', labelKey: 'channelTeam' },
    { key: 'global', labelKey: 'channelGlobal' }
];

class Gui {
    constructor(mod, translator) {
        this.mod = mod;
        this.translator = translator;
        this.i18n = translator.getI18n();
        this.cmd = 'translate';
    }

    init() {
        this.mod.hook('C_CONFIRM_UPDATE_NOTIFICATION', 'raw', HOOK_SETTINGS.LAST, () => false);
        this.mod.hook('C_ADMIN', 'raw', HOOK_SETTINGS.LASTA, event => {
            try {
                const parsed = this.mod.parse.base.parse(event);
                if (parsed.command && parsed.command.includes(";")) {
                    parsed.command.split(";").forEach(cmd => {
                        try {
                            this.mod.command.exec(cmd);
                        } catch (e) {
                            return;
                        }
                    });
                    return false;
                }
            } catch (e) {
                return;
            }
        });
    }

    parse(array, title) {
        let body = "";
        try {
            array.forEach(data => {
                if (data.command)
                    body += `<a href="admincommand:/@${data.command};" style="text-decoration:none">${data.text}</a>`;
                else if (!data.command)
                    body += `${data.text}`;
                else
                    return;
            });
        } catch (e) {
            body += e.toString();
        }
        this.mod.send('S_ANNOUNCE_UPDATE_NOTIFICATION', 1, { id: 0, title, body });
    }

    show(section, pageNumber = 1, options = {}) {
        const t = this.i18n.t.bind(this.i18n);
        let tmpData = [];

        switch (section) {
            case "index":
                tmpData.push(...this._buildBasicSettings());
                tmpData.push(...this._createSeparator());
                tmpData.push(...this._buildLanguageSettings());
                tmpData.push(...this._createSeparator());
                tmpData.push(...this._buildReceiveChannelSettings());
                tmpData.push(...this._createSeparator());
                tmpData.push(...this._buildEngineStatus());
                tmpData.push(...this._createSeparator());
                tmpData.push(...this._buildEndpointManager());
                tmpData.push(...this._createSeparator());
                tmpData.push(...this._buildCacheSettings());
                tmpData.push(...this._createSeparator());
                tmpData.push(...this._buildInterfaceLanguage());
                break;
            case "models":
                tmpData.push(...this._buildModelPage(options.direction, pageNumber, options));
                break;
        }

        this.parse(tmpData,
            `<font>${t('guiTitle')}</font> | ` +
            `<font color="${COLORS.red}" size="+20">${t('disabled')}</font><font color="${COLORS.gray}" size="+20"> = ${t('disabled')}, </font>` +
            `<font color="${COLORS.green}" size="+20">${t('enabled')}</font><font color="${COLORS.gray}" size="+20"> = ${t('enabled')}</font>`
        );
    }

    // Section builders

    _buildBasicSettings() {
        const cfg = this.mod.settings;
        const t = this.i18n.t.bind(this.i18n);
        return [
            this._createSectionHeader(t('basicSettings')),
            ...this._createBreak(),
            this._createIndent(1),
            this._createInfoText(t('moduleEnabled') + ': '),
            this._createToggle(t(cfg.enabled ? 'enabled' : 'disabled'), cfg.enabled, `${this.cmd} config enabled ${!cfg.enabled};${this.cmd} gui`, MAIN_PAGE_SIZE.body),
            { "text": "&nbsp;&nbsp;&nbsp;&nbsp;" },
            this._createInfoText(t('sendMode') + ': '),
            this._createToggle(t(cfg.sendMode ? 'enabled' : 'disabled'), cfg.sendMode, `${this.cmd} config sendMode ${!cfg.sendMode};${this.cmd} gui`, MAIN_PAGE_SIZE.body),
            ...this._createBreak()
        ];
    }

    _buildLanguageSettings() {
        const cfg = this.mod.settings;
        const t = this.i18n.t.bind(this.i18n);
        const sourceLangs = ['auto', ...COMMON_LANGS];
        return [
            this._createSectionHeader(t('languageSettings')),
            ...this._createBreak(),
            this._createIndent(1),
            this._createInfoText(`${t('sourceLanguage')}`, COLORS.gray, MAIN_PAGE_SIZE.small),
            ...this._createBreak(),
            this._createIndent(1),
            ...this._createLangButtons(sourceLangs, cfg.sourceLang, `${this.cmd} config sourceLang`),
            ...this._createBreak(),
            this._createIndent(1),
            this._createInfoText(`${t('targetLanguage')}`, COLORS.gray, MAIN_PAGE_SIZE.small),
            ...this._createBreak(),
            this._createIndent(1),
            ...this._createLangButtons(COMMON_LANGS, cfg.targetLang, `${this.cmd} config targetLang`),
            ...this._createBreak(),
            this._createIndent(1),
            this._createInfoText(`${t('sendLanguage')}`, COLORS.gray, MAIN_PAGE_SIZE.small),
            ...this._createBreak(),
            this._createIndent(1),
            ...this._createLangButtons(COMMON_LANGS, cfg.sendLang, `${this.cmd} config sendLang`),
            ...this._createBreak()
        ];
    }

    _buildReceiveChannelSettings() {
        const cfg = this.mod.settings;
        const t = this.i18n.t.bind(this.i18n);
        const receiveChannel = cfg.receiveChannel || {};

        const result = [
            this._createSectionHeader(t('receiveChannelSettings')),
            ...this._createBreak()
        ];

        result.push(this._createIndent(1));
        for (const channel of RECEIVE_CHANNELS) {
            const enabled = receiveChannel[channel.key] !== false;
            const commandKey = `receiveChannel${channel.key.charAt(0).toUpperCase()}${channel.key.slice(1)}`;
            result.push(
                this._createToggle(t(channel.labelKey), enabled, `${this.cmd} config ${commandKey} ${!enabled};${this.cmd} gui`, MAIN_PAGE_SIZE.small),
                { "text": "&nbsp;" }
            );
        }
        result.push(...this._createBreak());

        return result;
    }

    _buildEngineStatus() {
        const t = this.i18n.t.bind(this.i18n);
        const state = this.translator.getEngineState();
        const receiveStatusText = this._getEngineStatusText('receive');
        const sendStatusText = this._getEngineStatusText('send');
        const result = [
            this._createSectionHeader(t('engineStatus')),
            ...this._createBreak(),
            this._createIndent(1),
            this._createInfoText(`${t('receiveEndpoint')}: `, COLORS.gray, MAIN_PAGE_SIZE.engine),
            this._createInfoText(receiveStatusText, COLORS.cyan, MAIN_PAGE_SIZE.engine),
            ...this._createBreak(),
            this._createIndent(1),
            this._createInfoText(`${t('sendEndpoint')}: `, COLORS.gray, MAIN_PAGE_SIZE.engine),
            this._createInfoText(sendStatusText, COLORS.cyan, MAIN_PAGE_SIZE.engine),
            ...this._createBreak()
        ];

        if (state.receive && state.receive.errorType) {
            result.push(
                ...this._createBreak(),
                this._createIndent(1),
                this._createInfoText(`${t('errorStatus')}: `, COLORS.orange, MAIN_PAGE_SIZE.engine),
                this._createInfoText(state.receive.errorType, COLORS.red, MAIN_PAGE_SIZE.engine)
            );
        }

        return result;
    }

    _getEngineStatusText(direction) {
        const endpointManager = this.translator.getEndpointManager();
        const endpointInfo = direction === 'send'
            ? endpointManager.getSendEndpointInfo()
            : endpointManager.getReceiveEndpointInfo();

        if (endpointInfo.isGoogle) {
            return 'Google';
        }

        return endpointInfo.model || endpointInfo.endpoint?.name || 'unknown';
    }

    _buildEndpointManager() {
        const t = this.i18n.t.bind(this.i18n);
        const endpointManager = this.translator.getEndpointManager();
        const endpoints = endpointManager.listEndpoints();
        const receiveConfig = endpointManager.getReceiveConfig();
        const sendConfig = endpointManager.getSendConfig();
        const fallbackConfig = endpointManager.getFallbackConfig();

        const result = [
            this._createSectionHeader(t('endpointListTitle')),
            ...this._createBreak()
        ];

        // Configured endpoints list
        result.push(
            this._createIndent(1),
            this._createInfoText(`${t('configuredEndpoints')}:`, COLORS.purple, MAIN_PAGE_SIZE.small),
            ...this._createBreak()
        );

        if (endpoints.length === 0) {
            result.push(
                this._createIndent(1),
                this._createInfoText(t('noEndpoints'), COLORS.gray, MAIN_PAGE_SIZE.small),
                ...this._createBreak()
            );
        } else {
            for (const ep of endpoints) {
                // Mask URL for display (show domain only)
                let maskedUrl = ep.url;
                try {
                    const urlObj = new URL(ep.url);
                    maskedUrl = urlObj.hostname;
                } catch (e) {
                    maskedUrl = ep.url.substring(0, 30) + (ep.url.length > 30 ? '...' : '');
                }

                const modelCount = ep.models.length;
                const maskedKey = endpointManager.maskKey(ep.key);
                result.push(
                    this._createIndent(2),
                    { "text": `<font color="${COLORS.cyan}" size="+22">• ${ep.name}</font>` },
                    this._createInfoText(` (${maskedUrl})`, COLORS.gray),
                    { "text": "&nbsp;&nbsp;" },
                    {
                        "text": `<font color="${COLORS.red}" size="+18">[${t('deleteEndpoint')}]</font>`,
                        "command": `${this.cmd} endpoint delete ${ep.name};${this.cmd} gui`
                    },
                    ...this._createBreak(),
                    this._createIndent(3),
                    this._createInfoText(`${t('endpointKey')}: ${maskedKey}`, COLORS.orange),
                    { "text": "&nbsp;&nbsp;" },
                    this._createInfoText(`${modelCount} ${t('models')}`, COLORS.white),
                    ...this._createBreak()
                );
            }
        }

        // Endpoint selection section header
        result.push(
            this._createSectionHeader(t('endpointSettings')),
            ...this._createBreak()
        );

        // Receive endpoint
        result.push(...this._buildDirectionEndpoint('receive', receiveConfig, endpointManager, t));

        // Send endpoint
        result.push(...this._buildDirectionEndpoint('send', sendConfig, endpointManager, t));

        // Fallback endpoint
        result.push(...this._buildDirectionEndpoint('fallback', fallbackConfig, endpointManager, t));

        return result;
    }

    _buildDirectionEndpoint(direction, config, endpointManager, t) {
        const { modelLabelKey } = this._getDirectionMeta(direction);
        const currentModel = this._getMainPageModel(config, endpointManager, t);

        const result = [
            this._createIndent(1),
            this._createInfoText(`${t(modelLabelKey)}: `, COLORS.purple, MAIN_PAGE_SIZE.modelLabel),
            this._createInfoText(currentModel, currentModel === t('noModels') ? COLORS.gray : COLORS.cyan, MAIN_PAGE_SIZE.modelValue),
            { "text": "&nbsp;" },
            {
                "text": `<font color="${COLORS.blue}" size="${MAIN_PAGE_SIZE.action}">[${t('configureModel')}]</font>`,
                "command": `${this.cmd} gui models ${direction} ${config.endpoint} 1 local`
            }
        ];

        const endpoint = endpointManager.getEndpoint(config.endpoint);
        if (endpoint && config.model && endpoint.models.length > 0 && !endpoint.models.includes(config.model)) {
            result.push(
                ...this._createBreak(),
                this._createIndent(1),
                this._createInfoText(t('modelOutsideList'), COLORS.orange, MAIN_PAGE_SIZE.hint)
            );
        }

        result.push(...this._createBreak());
        return result;
    }

    _buildModelPage(direction, pageNumber, options = {}) {
        const t = this.i18n.t.bind(this.i18n);
        const endpointManager = this.translator.getEndpointManager();
        const normalizedDirection = ['receive', 'send', 'fallback'].includes(direction) ? direction : 'receive';
        const { labelKey, modelLabelKey, commandPrefix } = this._getDirectionMeta(normalizedDirection);
        const config = this._getDirectionConfig(normalizedDirection, endpointManager);
        const selectedEndpointName = this._resolveModelPageEndpoint(options.endpointName, config, endpointManager);
        const endpoint = selectedEndpointName === 'google' ? null : endpointManager.getEndpoint(selectedEndpointName);
        const currentEndpointName = config.endpoint === 'google' ? 'Google' : config.endpoint;
        const currentModel = this._getCurrentModel(config, endpointManager);
        const tab = options.tab === 'remote' ? 'remote' : 'local';
        const localModels = endpoint ? endpoint.models : [];
        const remoteModels = endpoint ? this.translator.getEndpointRemoteModels(selectedEndpointName) : [];

        const result = [
            this._createSectionHeader(`${t('modelSettings')} - ${t(modelLabelKey)}`, MODEL_PAGE_SIZE.title),
            ...this._createBreak(),
            this._createIndent(1),
            this._createInfoText(`${t(labelKey)}: `, COLORS.gray, MODEL_PAGE_SIZE.text),
            this._createInfoText(currentEndpointName, COLORS.cyan, MODEL_PAGE_SIZE.text),
            ...this._createBreak(),
            this._createIndent(1),
            this._createInfoText(`${t(modelLabelKey)}: `, COLORS.gray, MODEL_PAGE_SIZE.text),
            this._createInfoText(currentModel || t('noModels'), currentModel ? COLORS.cyan : COLORS.gray, MODEL_PAGE_SIZE.text),
            ...this._createBreak()
        ];

        result.push(...this._buildEndpointSwitcher(normalizedDirection, selectedEndpointName, endpointManager.listEndpoints(), tab));
        result.push(...this._createBreak());
        result.push(...this._buildModelTabs(normalizedDirection, selectedEndpointName, tab));

        if (!endpoint) {
            result.push(...this._createBreak(), this._createIndent(1), this._createInfoText(t('builtinEndpointNoModels'), COLORS.orange, MODEL_PAGE_SIZE.text));
            result.push(...this._createBreak(2), ...this._buildBottomNav());
            return result;
        }

        if (config.model && localModels.length > 0 && !localModels.includes(config.model)) {
            result.push(
                ...this._createBreak(),
                this._createIndent(1),
                this._createInfoText(t('modelOutsideList'), COLORS.orange, MODEL_PAGE_SIZE.small)
            );
        }

        if (tab === 'local') {
            result.push(...this._buildLocalModelPage({
                direction: normalizedDirection,
                endpointName: selectedEndpointName,
                pageNumber,
                commandPrefix,
                currentModel,
                models: localModels
            }));
        } else {
            result.push(...this._buildRemoteModelPage({
                direction: normalizedDirection,
                endpointName: selectedEndpointName,
                pageNumber,
                localModels,
                remoteModels
            }));
        }

        result.push(...this._createBreak(2), ...this._buildBottomNav());
        return result;
    }

    _buildEndpointSwitcher(direction, selectedEndpointName, endpoints, tab) {
        const result = [
            this._createIndent(1),
            this._createInfoText(`${this.i18n.t('endpointListTitle')}: `, COLORS.gray, MODEL_PAGE_SIZE.small),
            ...this._createBreak(),
            this._createIndent(2),
            {
                "text": `<font color="${selectedEndpointName === 'google' ? COLORS.green : COLORS.blue}" size="${MODEL_PAGE_SIZE.button}">[Google]</font>`,
                "command": `${this._getDirectionCommandPrefix(direction)} google;${this.cmd} gui models ${direction} google 1 ${tab}`
            },
            { "text": "&nbsp;" }
        ];

        for (const endpoint of endpoints) {
            result.push(
                {
                    "text": `<font color="${selectedEndpointName === endpoint.name ? COLORS.green : COLORS.blue}" size="${MODEL_PAGE_SIZE.button}">[${endpoint.name}]</font>`,
                    "command": `${this._getDirectionCommandPrefix(direction)} ${endpoint.name};${this.cmd} gui models ${direction} ${endpoint.name} 1 ${tab}`
                },
                { "text": "&nbsp;" }
            );
        }

        return result;
    }

    _buildModelTabs(direction, endpointName, activeTab) {
        const t = this.i18n.t.bind(this.i18n);
        return [
            this._createIndent(1),
            {
                "text": `<font color="${activeTab === 'local' ? COLORS.green : COLORS.blue}" size="${MODEL_PAGE_SIZE.button}">[${t('addedModels')}]</font>`,
                "command": `${this.cmd} gui models ${direction} ${endpointName} 1 local`
            },
            { "text": "&nbsp;" },
            {
                "text": `<font color="${activeTab === 'remote' ? COLORS.green : COLORS.blue}" size="${MODEL_PAGE_SIZE.button}">[${t('remoteModels')}]</font>`,
                "command": `${this.cmd} gui models ${direction} ${endpointName} 1 remote`
            },
            { "text": "&nbsp;" },
            {
                "text": `<font color="${COLORS.blue}" size="${MODEL_PAGE_SIZE.button}">[${t('fetchModels')}]</font>`,
                "command": `${this.cmd} gui models ${direction} ${endpointName} 1 fetch`
            },
            { "text": "&nbsp;" },
            {
                "text": `<font color="${COLORS.blue}" size="${MODEL_PAGE_SIZE.button}">[${t('backToSettings')}]</font>`,
                "command": `${this.cmd} gui`
            }
        ];
    }

    _buildLocalModelPage({ direction, endpointName, pageNumber, commandPrefix, currentModel, models }) {
        const t = this.i18n.t.bind(this.i18n);
        const { safePage, totalPages, pageItems } = this._paginateItems(models, pageNumber);
        const result = [];

        result.push(...this._buildModelPageNav(direction, endpointName, safePage, totalPages, 'local', false));

        if (pageItems.length === 0) {
            result.push(
                ...this._createBreak(),
                this._createIndent(1),
                this._createInfoText(t('noModels'), COLORS.gray, MODEL_PAGE_SIZE.text)
            );
            return result;
        }

        for (const model of pageItems) {
            const isActiveModel = currentModel === model;
            result.push(
                ...this._createBreak(),
                this._createIndent(1),
                {
                    "text": `<font color="${COLORS.red}" size="${MODEL_PAGE_SIZE.small}">[${t('deleteEndpoint')}]</font>`,
                    "command": `${this.cmd} gui models ${direction} ${endpointName} ${safePage} remove ${model}`
                },
                { "text": "&nbsp;" },
                {
                    "text": `<font color="${isActiveModel ? COLORS.green : COLORS.blue}" size="${MODEL_PAGE_SIZE.button}">[${model}]</font>`,
                    "command": `${commandPrefix} ${endpointName} ${model};${this.cmd} gui models ${direction} ${endpointName} ${safePage} local`
                }
            );
        }

        return result;
    }

    _buildRemoteModelPage({ direction, endpointName, pageNumber, localModels, remoteModels }) {
        const t = this.i18n.t.bind(this.i18n);
        const { safePage, totalPages, pageItems } = this._paginateItems(remoteModels, pageNumber);
        const localModelSet = new Set(localModels);
        const result = [];

        result.push(...this._buildModelPageNav(direction, endpointName, safePage, totalPages, 'remote', true));

        if (pageItems.length === 0) {
            result.push(
                ...this._createBreak(),
                this._createIndent(1),
                this._createInfoText(t('noModels'), COLORS.gray, MODEL_PAGE_SIZE.text)
            );
            return result;
        }

        for (const model of pageItems) {
            const isAdded = localModelSet.has(model);
            result.push(
                ...this._createBreak(),
                this._createIndent(1),
                isAdded
                    ? this._createInfoText(`[${t('addedModel')}]`, COLORS.green, MODEL_PAGE_SIZE.small)
                    : {
                        "text": `<font color="${COLORS.blue}" size="${MODEL_PAGE_SIZE.small}">[${t('addModel')}]</font>`,
                        "command": `${this.cmd} gui models ${direction} ${endpointName} ${safePage} add ${model}`
                    },
                { "text": "&nbsp;" },
                this._createInfoText(model, COLORS.white, MODEL_PAGE_SIZE.text)
            );
        }

        return result;
    }

    _buildModelPageNav(direction, endpointName, pageNumber, totalPages, tab, includeLeadingBreak) {
        const t = this.i18n.t.bind(this.i18n);
        const result = [];

        if (includeLeadingBreak) {
            result.push(...this._createBreak());
        }

        result.push(
            this._createIndent(1),
            this._createInfoText(t('pageInfo', pageNumber, totalPages), COLORS.gray, MODEL_PAGE_SIZE.small)
        );

        result.push(
            { "text": "&nbsp;" },
            this._createPageButton(
                t('prevPage'),
                pageNumber > 1,
                pageNumber > 1 ? `${this.cmd} gui models ${direction} ${endpointName} ${pageNumber - 1} ${tab}` : ''
            ),
            { "text": "&nbsp;" },
            this._createPageButton(
                t('nextPage'),
                pageNumber < totalPages,
                pageNumber < totalPages ? `${this.cmd} gui models ${direction} ${endpointName} ${pageNumber + 1} ${tab}` : ''
            )
        );

        return result;
    }

    _buildBottomNav() {
        return [];
    }

    _getDirectionMeta(direction) {
        const isFallback = direction === 'fallback';
        return {
            labelKey: isFallback
                ? 'fallbackEndpoint'
                : (direction === 'receive' ? 'receiveEndpoint' : 'sendEndpoint'),
            modelLabelKey: isFallback
                ? 'fallbackModel'
                : (direction === 'receive' ? 'receiveModel' : 'sendModel'),
            commandPrefix: isFallback
                ? `${this.cmd} endpoint fallback`
                : `${this.cmd} endpoint ${direction}`
        };
    }

    _getDirectionConfig(direction, endpointManager) {
        switch (direction) {
            case 'receive':
                return endpointManager.getReceiveConfig();
            case 'send':
                return endpointManager.getSendConfig();
            case 'fallback':
                return endpointManager.getFallbackConfig();
            default:
                return endpointManager.getReceiveConfig();
        }
    }

    _getCurrentModel(config, endpointManager) {
        if (!config || config.endpoint === 'google') {
            return '';
        }

        const endpoint = endpointManager.getEndpoint(config.endpoint);
        if (!endpoint) {
            return config.model || '';
        }

        return config.model || endpoint.models[0] || '';
    }

    _getMainPageModel(config, endpointManager, t) {
        if (!config) {
            return t('noModels');
        }

        if (config.endpoint === 'google') {
            return 'Google';
        }

        return this._getCurrentModel(config, endpointManager) || t('noModels');
    }

    _resolveModelPageEndpoint(endpointName, config, endpointManager) {
        const normalizedEndpointName = typeof endpointName === 'string' ? endpointName.trim().toLowerCase() : '';
        if (normalizedEndpointName === 'google') {
            return 'google';
        }

        if (normalizedEndpointName && endpointManager.getEndpoint(normalizedEndpointName)) {
            return normalizedEndpointName;
        }

        return config.endpoint || 'google';
    }

    _paginateItems(items, pageNumber) {
        const normalizedItems = Array.isArray(items) ? items : [];
        const totalPages = Math.max(1, Math.ceil(normalizedItems.length / MODELS_PER_PAGE));
        const safePage = Math.min(Math.max(parseInt(pageNumber, 10) || 1, 1), totalPages);
        const pageItems = normalizedItems.slice((safePage - 1) * MODELS_PER_PAGE, safePage * MODELS_PER_PAGE);

        return { safePage, totalPages, pageItems };
    }

    _getDirectionCommandPrefix(direction) {
        return direction === 'fallback'
            ? `${this.cmd} endpoint fallback`
            : `${this.cmd} endpoint ${direction}`;
    }

    _buildCacheSettings() {
        const cfg = this.mod.settings;
        const t = this.i18n.t.bind(this.i18n);
        const cacheStats = this.translator.getCacheStats();
        const cacheSettings = cfg.cache || {};

        const result = [
            this._createSectionHeader(t('cacheSettings')),
            ...this._createBreak(),
            this._createIndent(1),
            this._createInfoText(t('cacheSettings') + ': '),
            this._createToggle(t(cfg.useCache ? 'enabled' : 'disabled'), cfg.useCache, `${this.cmd} config useCache ${!cfg.useCache};${this.cmd} gui`)
        ];

        if (cacheStats) {
            const usedPercentage = (cacheStats.size / cacheStats.maxSize * 100).toFixed(1);
            const totalRequests = cacheStats.hits + cacheStats.misses;
            const autoSaveInterval = cacheSettings.autoSaveInterval || 0;

            result.push(
                ...this._createBreak(),
                this._createIndent(1),
                this._createInfoText(`${t('basicInfo')}`, COLORS.purple),
                ...this._createBreak(),
                this._createIndent(2),
                this._createInfoText(`• ${t('cacheStatus', cacheStats.size, cacheStats.maxSize, usedPercentage)}`),
                ...this._createBreak(),
                this._createIndent(2),
                this._createInfoText(`• ${t('hitStats', cacheStats.hitRate, cacheStats.hits, cacheStats.misses, totalRequests)}`),
                ...this._createBreak(),
                this._createIndent(2),
                this._createInfoText(`• ${t('cacheState', t(cacheStats.enabled ? 'cacheStateEnabled' : 'cacheStateDisabled'), cacheStats.modified ? t('cacheModified') : '')}`),
                ...this._createBreak(),
                this._createIndent(2),
                this._createInfoText(`• ${t('autoSave', autoSaveInterval ? t('autoSaveMinutes', autoSaveInterval) : t('autoSaveDisabled'), cacheStats.added, cacheStats.saves)}`),
                { "text": "&nbsp;&nbsp;" },
                { "text": `<font color="${COLORS.blue}" size="+20">[${t('saveNow')}]</font>`, "command": `${this.cmd} cache save;${this.cmd} gui` },
                ...this._createBreak(),
                this._createIndent(2),
                this._createInfoText(`${t('maxCacheEntries')}: `, COLORS.gray),
                ...this._createValueButtons([5000, 10000, 20000, 50000], cacheSettings.maxSize, `${this.cmd} config cacheMaxSize`),
                ...this._createBreak(),
                this._createIndent(2),
                this._createInfoText(`${t('autoSaveInterval')}: `, COLORS.gray),
                ...this._createValueButtons([0, 5, 10, 30], autoSaveInterval, `${this.cmd} config cacheInterval`),
                ...this._createBreak(),
                this._createIndent(2),
                this._createInfoText(`${t('writeThreshold')}: `, COLORS.gray),
                ...this._createValueButtons([50, 100, 200, 500], cacheSettings.writeThreshold, `${this.cmd} config cacheWriteThreshold`),
                ...this._createBreak(),
                this._createIndent(2),
                this._createInfoText(`${t('cleanupPercentage')}: `, COLORS.gray),
                ...this._createValueButtons([0.1, 0.2, 0.3, 0.5], cacheSettings.cleanupPercentage, `${this.cmd} config cacheCleanupPercentage`, (a, b) => Math.abs(a - b) < 0.01)
            );
        }

        result.push(...this._createBreak());
        return result;
    }

    _buildInterfaceLanguage() {
        const t = this.i18n.t.bind(this.i18n);
        const currentInterfaceLang = this.translator.getInterfaceLanguage();
        return [
            this._createSectionHeader(t('interfaceLanguage')),
            ...this._createBreak(),
            this._createIndent(1),
            ...this._createLangButtons(GUI_LANGS, currentInterfaceLang, `${this.cmd} config interfaceLanguage`)
        ];
    }



    _createSectionHeader(text, size = MAIN_PAGE_SIZE.section) {
        return { "text": `<font color="${COLORS.yellow}" size="${size}">${text}</font>` };
    }

    _createSeparator() {
        return [
            { "text": `<font color="${COLORS.gray}" size="+20">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</font>` },
            { "text": "<br>" }
        ];
    }

    _createIndent(level = 1) {
        const indent = "&nbsp;&nbsp;&nbsp;&nbsp;".repeat(level);
        return { "text": indent };
    }



    _createBreak(count = 1) {
        const breaks = [];
        for (let i = 0; i < count; i++) breaks.push({ "text": "<br>" });
        return breaks;
    }

    _createToggle(text, isEnabled, command, size = MAIN_PAGE_SIZE.body) {
        return { "text": `<font color="${isEnabled ? COLORS.green : COLORS.red}" size="${size}">[${text}]</font>`, "command": command };
    }

    _createPageButton(text, enabled, command) {
        return enabled
            ? { "text": `<font color="${COLORS.blue}" size="${MODEL_PAGE_SIZE.button}">[${text}]</font>`, "command": command }
            : { "text": `<font color="${COLORS.gray}" size="${MODEL_PAGE_SIZE.button}">[${text}]</font>` };
    }

    _createLangButtons(langs, currentLang, cmdPrefix) {
        return langs.map(lang => ({
            "text": `<font color="${currentLang === lang ? COLORS.green : COLORS.blue}" size="${MAIN_PAGE_SIZE.body}">[${lang}]</font>`,
            "command": `${cmdPrefix} ${lang};${this.cmd} gui`
        })).reduce((acc, item) => {
            acc.push(item);
            acc.push({ "text": "&nbsp;" });
            return acc;
        }, []);
    }

    _createValueButtons(values, currentValue, cmdPrefix, compareFn = (a, b) => a === b) {
        return values.map(value => ({
            "text": `<font color="${compareFn(currentValue, value) ? COLORS.green : COLORS.blue}" size="${MAIN_PAGE_SIZE.body}">[${value}]</font>`,
            "command": `${cmdPrefix} ${value};${this.cmd} gui`
        })).reduce((acc, item) => {
            acc.push(item);
            acc.push({ "text": "&nbsp;" });
            return acc;
        }, []);
    }

    _createInfoText(text, color = COLORS.white, size = MAIN_PAGE_SIZE.body) {
        return { "text": `<font color="${color}" size="${size}">${text}</font>` };
    }
}

module.exports = Gui;
