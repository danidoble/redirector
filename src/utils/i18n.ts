// Importamos el JSON de español para usarlo cuando estemos en localhost
import esMessages from '../../public/_locales/es/messages.json';
import { isExtensionContext } from './chrome-mock';

/**
 * Wrapper para chrome.i18n.getMessage
 * Si chrome.i18n no existe (entorno local), usa el JSON importado.
 */
export const t = (key: string): string => {
    // 1. Detectar si estamos en producción (dentro de la extensión)
    if (isExtensionContext() && chrome.i18n) {
        return chrome.i18n.getMessage(key);
    }

    // 2. Fallback para desarrollo (localhost)
    // Accedemos a la propiedad .message del JSON
    return (esMessages as Record<string, { message: string }>)[key]?.message || key;
};
