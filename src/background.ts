import type { Rule, Options, Settings, Config, RedirectorMessage, StorageData } from './types/background';

const defaultSettings: Settings = {
    options: {
        enabled: true,
        openNewTab: false,
        notifyEvent: false,
        rules: [
            {
                id: null,
                enabled: false,
                regex: true,
                src: '^https?://(?!localhost|bar.test)([^/]+)(.*)$',
                dest: 'https://localhost/'
            },
            {
                id: null,
                enabled: false,
                regex: true,
                src: '^https?://(?!localhost|foo.test)([^/]+)(.*)$',
                dest: 'http://localhost/'
            },
            {
                id: null,
                enabled: true,
                regex: false,
                src: 'https://example.com/',
                dest: 'https://example.org/'
            },
            {
                id: null,
                enabled: false,
                regex: true,
                src: 'https?://example.org/',
                dest: 'https://google.com/'
            }
        ]
    }
};

const config: Config = {
    enabled: true,
    openNewTab: false,
    notifyEvent: true,
    rules: [],
    lastTabId: 0
};

/**
 * Asigna IDs únicos a las reglas que no tienen uno
 */
const assignRuleIds = (rules: Rule[]): void => {
    rules.forEach(rule => {
        if (!rule.id) {
            rule.id = crypto.randomUUID();
        }
    });
};

/**
 * Maneja la instalación inicial de la extensión
 */
const handleInstall = async (): Promise<void> => {
    assignRuleIds(defaultSettings.options.rules);
    await chrome.storage.sync.set(defaultSettings);
    Object.assign(config, defaultSettings.options);
    await chrome.runtime.openOptionsPage();
};

/**
 * Maneja la actualización de la extensión
 */
const handleUpdate = async (): Promise<void> => {
    const data = (await chrome.storage.sync.get('options')) as StorageData;

    if (!data.options) {
        assignRuleIds(defaultSettings.options.rules);
        await chrome.storage.sync.set(defaultSettings);
        return;
    }

    if (data.options?.rules?.length > 0) {
        const syncData = (await chrome.storage.sync.get('options')) as StorageData;
        const existingRules: Rule[] = syncData.options?.rules || [];
        const newRules = data.options.rules.filter(
            (newRule: Rule) =>
                !existingRules.some(
                    existingRule => existingRule.src === newRule.src && existingRule.dest === newRule.dest
                )
        );

        const mergedData: Settings = {
            ...syncData,
            options: {
                ...syncData.options!,
                rules: [...existingRules, ...newRules]
            }
        };

        assignRuleIds(mergedData.options.rules);

        await chrome.storage.sync.clear();
        await chrome.storage.sync.set(mergedData);
    }
};

chrome.runtime.onInstalled.addListener(async details => {
    if (details.reason === 'install') {
        await handleInstall();
        return;
    }

    if (details.reason === 'update') {
        await handleUpdate();
    }
});

/**
 * Maneja la redirección cuando una pestaña se actualiza
 */
const handleTabUpdate = async (url: string, tabId: number): Promise<void> => {
    const newUrl = matchUrl(url);
    if (!newUrl) return;

    if (!config.openNewTab) {
        config.lastTabId = tabId;
        await chrome.tabs.update(tabId, { url: newUrl });
    } else {
        await chrome.tabs.create({ url: newUrl });
        notify();
    }
};

chrome.tabs.onUpdated.addListener(async (tabId, change, tab) => {
    if (!config.enabled) return;

    const url = tab.url || change.url;
    if (change.status === 'loading' && url) {
        await handleTabUpdate(url, tabId);
    }

    if (change.status === 'complete' && tabId === config.lastTabId) {
        notify();
        config.lastTabId = 0;
    }
});

/**
 * Sincroniza las opciones con la configuración local
 */
const syncOptions = (options: Options): void => {
    Object.assign(config, {
        enabled: options.enabled,
        openNewTab: options.openNewTab,
        notifyEvent: options.notifyEvent,
        rules: options.rules
    });
};

/**
 * Reinicia las reglas a los valores por defecto
 */
const resetRules = async (): Promise<void> => {
    Object.assign(config, defaultSettings.options);
    assignRuleIds(defaultSettings.options.rules);

    await chrome.storage.sync.set(defaultSettings);

    try {
        await chrome.runtime.sendMessage({ type: 'reloadOptions' });
    } catch (error) {
        console.debug('Error sending reload message:', error);
    }
};

chrome.runtime.onMessage.addListener((message: RedirectorMessage, _sender, _sendResponse) => {
    console.debug({ message, _sender, _sendResponse });

    if (message.type === 'syncOptions') {
        syncOptions(message.options);
        return;
    }

    if (message.type === 'resetRules') {
        resetRules().catch(error => console.error('Error resetting rules:', error));
    }
});

/**
 * Carga las opciones desde el almacenamiento
 */
const loadOptions = async (): Promise<void> => {
    const data = (await chrome.storage.sync.get('options')) as StorageData;

    if (data.options) {
        Object.assign(config, {
            openNewTab: data.options.openNewTab,
            notifyEvent: data.options.notifyEvent,
            rules: data.options.rules
        });
    }
};

/**
 * Verifica si una URL coincide con alguna regla y retorna la URL de destino
 */
const matchUrl = (url: string): string | false => {
    if (!config.rules?.length || !url) return false;

    for (const rule of config.rules) {
        if (!rule.enabled) continue;

        const { src, dest, regex } = rule;

        if (!regex) {
            if (url === src) {
                return dest;
            }
            continue;
        }

        try {
            const pattern = new RegExp(src);
            if (pattern.test(url)) {
                const newUrl = url.replace(pattern, dest);
                if (url !== newUrl) {
                    return newUrl;
                }
            }
        } catch (error) {
            console.error(`Error en la expresión regular de la regla: ${src}`, error);
        }
    }

    return false;
};

/**
 * Muestra una notificación al usuario
 */
const notify = (): void => {
    if (!config.notifyEvent) return;

    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('img/icon-48.png'),
        title: chrome.i18n.getMessage('app_name'),
        message: chrome.i18n.getMessage('notification_event')
    });
};

// Inicializar opciones
loadOptions().catch(error => console.error('Error loading options:', error));
