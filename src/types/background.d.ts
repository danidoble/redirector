export interface Rule {
    id: string | null;
    enabled: boolean;
    regex: boolean;
    src: string;
    dest: string;
}

export interface Options {
    enabled: boolean;
    openNewTab: boolean;
    notifyEvent: boolean;
    rules: Rule[];
}

export interface Settings {
    options: Options;
}

export interface Config extends Options {
    lastTabId: number;
}

export interface SyncOptionsMessage {
    type: 'syncOptions';
    options: Options;
}

export interface ResetRulesMessage {
    type: 'resetRules';
}

export interface ReloadOptionsMessage {
    type: 'reloadOptions';
}

export type RedirectorMessage = SyncOptionsMessage | ResetRulesMessage | ReloadOptionsMessage;

export interface StorageData {
    options?: Options;
}
