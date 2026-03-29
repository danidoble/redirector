import type { Rule, Options, Settings, Config, RedirectorMessage, StorageData } from './types/background';
import { matchRule } from './utils/matcher';

const defaultSettings: Settings = {
    options: {
        enabled: true,
        openNewTab: false,
        notifyEvent: false,
        rules: [
            {
                id: null,
                enabled: false,
                name: 'Local Dev (HTTPS)',
                mode: 'regex',
                regex: true,
                src: '^https?://(?!localhost|bar.test)([^/]+)(.*)$',
                dest: 'https://localhost/',
                groupId: 'default'
            },
            {
                id: null,
                enabled: false,
                name: 'Local Dev (HTTP)',
                mode: 'regex',
                regex: true,
                src: '^https?://(?!localhost|foo.test)([^/]+)(.*)$',
                dest: 'http://localhost/',
                groupId: 'default'
            },
            {
                id: null,
                enabled: true,
                name: 'Example Redirect',
                mode: 'static',
                regex: false,
                src: 'https://example.com/',
                dest: 'https://example.org/',
                groupId: 'default'
            },
            {
                id: null,
                enabled: false,
                name: 'Google Redirect',
                mode: 'regex',
                regex: true,
                src: 'https?://example.org/',
                dest: 'https://google.com/',
                groupId: 'default'
            }
        ],
        groups: [
            {
                id: 'default',
                name: 'Default',
                color: '#3b82f6', // blue-500
                enabled: true,
                collapsed: false
            }
        ]
    }
};

const config: Config = {
    enabled: true,
    openNewTab: false,
    notifyEvent: true,
    rules: [],
    groups: []
};

// session-storage helpers (survive worker restarts)

const addProcessedTab = (tabId: number) => chrome.storage.session.set({ [`pt_${tabId}`]: true });

const hasProcessedTab = async (tabId: number): Promise<boolean> => {
    const r = await chrome.storage.session.get(`pt_${tabId}`);
    return !!r[`pt_${tabId}`];
};

const removeProcessedTab = (tabId: number) => chrome.storage.session.remove(`pt_${tabId}`);

/**
 * Asign unique IDs to rules that don't have one
 */
const assignRuleIds = (rules: Rule[]): void => {
    rules.forEach(rule => {
        if (!rule.id) {
            rule.id = crypto.randomUUID();
        }
    });
};

/**
 * Manage initial extension installation
 */
const handleInstall = async (): Promise<void> => {
    assignRuleIds(defaultSettings.options.rules);
    await chrome.storage.sync.set(defaultSettings);
    Object.assign(config, defaultSettings.options);
    await chrome.runtime.openOptionsPage();
};

/**
 * Manage extension update
 */
const handleUpdate = async (): Promise<void> => {
    const data = (await chrome.storage.sync.get('options')) as StorageData;

    // First install or deleted storage
    if (!data.options) {
        assignRuleIds(defaultSettings.options.rules);
        await chrome.storage.sync.set(defaultSettings);
        return;
    }

    // Migration: If groups are missing or empty, inject the default group AND move rules to it
    if (!data.options.groups || data.options.groups.length === 0) {
        // Create a merged object
        const migratedOptions: Options = {
            ...data.options,
            groups: defaultSettings.options.groups
        };

        const migratedSettings: Settings = {
            options: migratedOptions
        };

        // If there are existing rules, safeguard them and assign them to default group
        if (data.options.rules && data.options.rules.length > 0) {
            migratedSettings.options.rules = data.options.rules.map(r => ({
                ...r,
                id: r.id || crypto.randomUUID(), // Ensure ID exists
                name: r.name || 'My Rule',
                groupId: 'default' // Assign to default group
            }));
        }

        await chrome.storage.sync.set(migratedSettings);
        console.log('Migrated settings: Added default group and moved rules to it');
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

        // Migrate existing rules to include 'mode' and 'name' if missing
        const migratedExistingRules = existingRules.map(r => {
            const updates: Partial<Rule> = {};
            if (!r.mode) {
                updates.mode = r.regex ? 'regex' : 'static';
            }
            if (!r.name) {
                updates.name = 'My Rule';
            }
            return { ...r, ...updates };
        });

        // Migrate new rules (should be correct already, but safe guard)
        const migratedNewRules = newRules.map(r => {
            const updates: Partial<Rule> = {};
            if (!r.mode) {
                updates.mode = r.regex ? 'regex' : 'static';
            }
            if (!r.name) {
                updates.name = 'My Rule';
            }
            return { ...r, ...updates };
        });

        const mergedData: Settings = {
            ...syncData,
            options: {
                ...syncData.options!,
                rules: [...migratedExistingRules, ...migratedNewRules]
            }
        };

        assignRuleIds(mergedData.options.rules);

        await chrome.storage.sync.clear();
        await chrome.storage.sync.set(mergedData);
    }
};

const onInstalled = async (details: chrome.runtime.InstalledDetails): Promise<void> => {
    if (details.reason === 'install') {
        await handleInstall();
        return;
    }

    if (details.reason === 'update') {
        await handleUpdate();
    }
};

chrome.runtime.onInstalled.addListener(onInstalled);

/**
 * Manage redirection when a tab is updated
 */
const handleTabUpdate = async (url: string, tabId: number): Promise<void> => {
    if (!config.openNewTab) {
        // Persist lastTabId in session storage so it survives a worker restart
        await chrome.storage.session.set({ lastTabId: tabId });
        await chrome.tabs.update(tabId, { url });
    } else {
        await chrome.tabs.create({ url });
        notify();
    }
};

const onTabUpdated: Parameters<typeof chrome.tabs.onUpdated.addListener>[0] = async (tabId, change, tab) => {
    // Guard against cold-start: ensure rules are loaded before processing
    if (!config.rules?.length) await loadOptions();

    if (!config.enabled) return;
    const url = tab.url || change.url;
    if (!url) return;
    // if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
    //     return;
    // }

    if (change.status === 'loading') {
        // Use session storage instead of in-memory Set so state survives worker restarts
        if (await hasProcessedTab(tabId)) return;

        const newUrl = matchUrl(url);
        if (!newUrl) return;
        if (newUrl === url) return;

        await addProcessedTab(tabId);

        await handleTabUpdate(newUrl, tabId);
    }

    if (change.status === 'complete') {
        // Clean up session storage entry for this tab
        await removeProcessedTab(tabId);

        const { lastTabId } = await chrome.storage.session.get('lastTabId');
        if (tabId === lastTabId) {
            notify();
            await chrome.storage.session.remove('lastTabId');
        }
    }
};

chrome.tabs.onUpdated.addListener(onTabUpdated);

/**
 * Sync options with local configuration
 */
const syncOptions = (options: Options): void => {
    Object.assign(config, {
        enabled: options.enabled,
        openNewTab: options.openNewTab,
        notifyEvent: options.notifyEvent,
        rules: options.rules,
        groups: options.groups || []
    });
};

/**
 * Reset rules to default values
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

const onMessage = (
    message: RedirectorMessage,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response?: unknown) => void
): void => {
    console.debug({ message, _sender, _sendResponse });

    if (message.type === 'syncOptions') {
        syncOptions(message.options);
        return;
    }

    if (message.type === 'resetRules') {
        resetRules().catch(error => console.error('Error resetting rules:', error));
    }
};

chrome.runtime.onMessage.addListener(onMessage);

/**
 * Loads options from storage
 */
const loadOptions = async (): Promise<void> => {
    const data = (await chrome.storage.sync.get('options')) as StorageData;

    if (data.options) {
        Object.assign(config, {
            openNewTab: data.options.openNewTab,
            notifyEvent: data.options.notifyEvent,
            rules: data.options.rules,
            groups: data.options.groups || []
        });
    }
};

/**
 * Verifies if a URL matches any rule and returns the destination URL
 */
const matchUrl = (url: string): string | false => {
    if (!config.rules?.length || !url) return false;

    for (const rule of config.rules) {
        if (!rule.enabled) continue;

        if (rule.groupId && config.groups) {
            const group = config.groups.find(g => g.id === rule.groupId);
            if (group && !group.enabled) continue;
        }

        const result = matchRule(rule, url);
        if (result) return result;
    }

    return false;
};

/**
 * Shows a notification to the user
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
