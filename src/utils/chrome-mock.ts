import type { RedirectorMessage } from '../types/background';

/**
 * Mock de Chrome APIs para desarrollo local
 */

interface ChromeStorage {
    data: Record<string, unknown>;
}

interface MessageListener {
    (
        message: RedirectorMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
    ): void;
}

const storage: ChromeStorage = {
    data: {
        options: {
            enabled: true,
            openNewTab: false,
            notifyEvent: false,
            rules: [
                {
                    id: crypto.randomUUID(),
                    enabled: true,
                    regex: false,
                    src: 'https://example.com/',
                    dest: 'https://example.org/'
                }
            ]
        }
    }
};

const messageListeners = new Set<MessageListener>();

export const chromeMock = {
    storage: {
        sync: {
            get: (
                keys: string | string[] | null,
                callback?: (items: Record<string, unknown>) => void
            ): Promise<Record<string, unknown>> => {
                return new Promise(resolve => {
                    const result: Record<string, unknown> = {};
                    if (typeof keys === 'string') {
                        result[keys] = storage.data[keys];
                    } else if (Array.isArray(keys)) {
                        keys.forEach(key => {
                            result[key] = storage.data[key];
                        });
                    } else {
                        Object.assign(result, storage.data);
                    }

                    if (callback) {
                        setTimeout(() => callback(result), 0);
                    }
                    resolve(result);
                });
            },
            set: (items: Record<string, unknown>, callback?: () => void): Promise<void> => {
                return new Promise(resolve => {
                    Object.assign(storage.data, items);
                    console.log('[Chrome Mock] Storage set:', items);

                    if (callback) {
                        setTimeout(callback, 0);
                    }
                    resolve();
                });
            },
            clear: (callback?: () => void): Promise<void> => {
                return new Promise(resolve => {
                    storage.data = {};
                    console.log('[Chrome Mock] Storage cleared');

                    if (callback) {
                        setTimeout(callback, 0);
                    }
                    resolve();
                });
            }
        }
    },
    runtime: {
        sendMessage: (message: RedirectorMessage, callback?: (response: unknown) => void): Promise<unknown> => {
            return new Promise(resolve => {
                console.log('[Chrome Mock] Message sent:', message);

                // Simular el listener del background
                messageListeners.forEach(listener => {
                    listener(message, {} as chrome.runtime.MessageSender, response => {
                        if (callback) {
                            callback(response);
                        }
                        resolve(response);
                    });
                });

                if (callback) {
                    setTimeout(() => callback({ success: true }), 0);
                }
                resolve({ success: true });
            });
        },
        onMessage: {
            addListener: (listener: MessageListener) => {
                messageListeners.add(listener);
                console.log('[Chrome Mock] Message listener added');
            },
            removeListener: (listener: MessageListener) => {
                messageListeners.delete(listener);
                console.log('[Chrome Mock] Message listener removed');
            }
        },
        lastError: null as chrome.runtime.LastError | null
    },
    i18n: {
        getMessage: (key: string): string => {
            // Esto se maneja en i18n.ts
            return key;
        }
    }
};

/**
 * Verifica si estamos en el contexto de una extensión
 */
export const isExtensionContext = (): boolean => {
    return typeof chrome !== 'undefined' && chrome.storage !== undefined && chrome.runtime !== undefined;
};

/**
 * Obtiene el objeto chrome (real o mock)
 */
export const getChrome = (): typeof chrome => {
    if (isExtensionContext()) {
        return chrome;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return chromeMock as any;
};
