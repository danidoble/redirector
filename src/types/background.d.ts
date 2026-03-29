export type RuleMode = 'static' | 'regex' | 'wildcard' | 'url-pattern';

export interface Rule {
    id: string | null;
    enabled: boolean;
    mode: RuleMode; // Replaces 'regex'
    regex?: boolean; // Deprecated, kept for backward compat during migration
    src: string;
    dest: string;
    name?: string;
    groupId?: string;
    color?: string;
    shouldDecode?: boolean;
    collapsed?: boolean;
    testUrl?: string; // For testing in UI
}

export interface RuleGroup {
    id: string;
    name: string;
    color: string;
    enabled: boolean;
    collapsed?: boolean;
}

export interface Options {
    enabled: boolean;
    openNewTab: boolean;
    notifyEvent: boolean;
    rules: Rule[];
    groups?: RuleGroup[];
}

export interface Settings {
    options: Options;
}

export interface Config extends Options {}

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
