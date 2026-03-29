import type { Rule } from '../types/background';

/**
 * Checks if a specific rule matches the given URL and returns the destination URL if matched.
 * Returns null if no match.
 */
export const matchRule = (rule: Rule, url: string): string | null => {
    if (!rule.enabled) return null;

    const { src, dest, regex, mode, shouldDecode } = rule;
    const currentMode = mode || (regex ? 'regex' : 'static');

    if (currentMode === 'static') {
        return url === src ? dest : null;
    }

    const performReplacement = (pattern: RegExp, destination: string): string | null => {
        if (pattern.test(url)) {
            if (shouldDecode) {
                const newUrl = url.replace(pattern, (...args) => {
                    return destination.replace(/\$(\d+)/g, (m, nStr) => {
                        const n = parseInt(nStr, 10);
                        const val = args[n];
                        return val !== undefined ? decodeURIComponent(val) : m;
                    });
                });
                if (url !== newUrl) return newUrl;
            } else {
                const newUrl = url.replace(pattern, destination);
                if (url !== newUrl) return newUrl;
            }
        }
        return null;
    };

    try {
        if (currentMode === 'regex') {
            return performReplacement(new RegExp(src), dest);
        } else if (currentMode === 'wildcard') {
            const regexStr = '^' + src.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '(.*)') + '$';
            return performReplacement(new RegExp(regexStr), dest);
        } else if (currentMode === 'url-pattern') {
            const preProcessedSrc = src.replace(/:([a-zA-Z0-9_]+)/g, '(?<$1>[^/&?#]+)');
            const pattern = new RegExp(preProcessedSrc);

            if (pattern.test(url)) {
                const match = url.match(pattern);
                if (match && match.groups) {
                    let newDest = dest;

                    // Replace {{id}} or {{search.groups.id}} with value
                    for (const [key, value] of Object.entries(match.groups)) {
                        newDest = newDest.replace(new RegExp(`{{${key}}}|{{search\\.groups\\.${key}}}`, 'g'), value);
                    }

                    // Replace standard named groups with '$<name>' for the final replace call
                    newDest = newDest.replace(/{{(?:search\.groups\.)?([a-zA-Z0-9_]+)}}/g, '$<$1>');

                    if (shouldDecode) {
                        const finalUrl = url.replace(pattern, (...args) => {
                            const groups =
                                args.length > 2 && typeof args[args.length - 1] === 'object'
                                    ? args[args.length - 1]
                                    : {};

                            return newDest.replace(/\$<([a-zA-Z0-9_]+)>|\$(\d+)/g, (m, name, nStr) => {
                                if (name) {
                                    const val = (groups as Record<string, string>)[name];
                                    return val !== undefined ? decodeURIComponent(val) : m;
                                }
                                if (nStr) {
                                    const n = parseInt(nStr, 10);
                                    const val = args[n];
                                    return val !== undefined ? decodeURIComponent(val) : m;
                                }
                                return m;
                            });
                        });
                        if (url !== finalUrl) return finalUrl;
                    } else {
                        const finalUrl = url.replace(pattern, newDest);
                        if (url !== finalUrl) return finalUrl;
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error matching rule (${currentMode}): ${src}`, error);
    }

    return null;
};
