import { ModeToggle } from './components/mode-toggle';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {

    RotateCcw,
    XCircle,
    Trash2
} from 'lucide-react';
import { t } from './utils/i18n';
import { getChrome } from './utils/chrome-mock';
import type { Options as OptionsType, Rule, RedirectorMessage, RuleGroup } from './types/background';

import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from './components/ui/alert-dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from './components/ui/tooltip';

import { SettingsTab } from './components/tabs/SettingsTab';
import { GroupsTab } from './components/tabs/GroupsTab';
import { RulesTab } from './components/tabs/RulesTab';
import { MiniMode } from './components/tabs/MiniMode';
import { Footer } from './components/Footer';
import { Donation } from './components/Donation';

export interface ConfigState extends OptionsType {
    rules: Rule[];
    groups?: RuleGroup[];
}

export function Options({ mini = false }: { mini?: boolean }) {
    const chromeApi = getChrome();
    const inputFile = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [config, setConfig] = useState<ConfigState>({
        enabled: true,
        openNewTab: false,
        notifyEvent: false,
        rules: [],
        groups: []
    });

    /**
     * Exporta la configuración a un archivo JSON
     */
    const exportConfig = (): void => {
        setSaving(true);
        try {
            const configurationStringify = JSON.stringify(config, null, 2);
            const blob = new Blob([configurationStringify], {
                type: 'application/json'
            });
            const anchor = document.createElement('a');
            anchor.download = `redirector-config-${new Date().toISOString().split('T')[0]}.json`;
            anchor.href = window.URL.createObjectURL(blob);
            anchor.click();
            window.URL.revokeObjectURL(anchor.href);
            toast.success(t('app_export_success') || 'Configuración exportada correctamente');
        } catch (error) {
            console.error('Error exporting config:', error);
            toast.error(t('app_export_error') || 'Error al exportar la configuración');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Valida la configuración importada
     */
    const validateConfig = (cfg: unknown): cfg is ConfigState => {
        if (!cfg || typeof cfg !== 'object') return false;
        const config = cfg as Partial<ConfigState>;

        if (typeof config.enabled !== 'boolean') return false;
        if (typeof config.notifyEvent !== 'boolean') return false;
        if (typeof config.openNewTab !== 'boolean') return false;
        if (!Array.isArray(config.rules)) return false;

        return config.rules.every((rule: unknown) => {
            if (!rule || typeof rule !== 'object') return false;
            const r = rule as Partial<Rule>;
            return (
                typeof r.src === 'string' &&
                r.src.trim() !== '' &&
                typeof r.dest === 'string' &&
                r.dest.trim() !== '' &&
                typeof r.enabled === 'boolean' &&
                typeof r.regex === 'boolean'
            );
        });
    };

    /**
     * Importa la configuración desde un archivo JSON
     */
    const importConfig = async (): Promise<void> => {
        if (!inputFile.current?.files?.[0]) {
            toast.error(t('app_import_no_file') || 'Por favor selecciona un archivo');
            return;
        }

        setSaving(true);
        const file = inputFile.current.files[0];

        if (file.type !== 'application/json') {
            toast.error(t('app_import_error') || 'El archivo debe ser JSON');
            setSaving(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const content = e.target?.result as string;
                const newConfig = JSON.parse(content);

                if (!validateConfig(newConfig)) {
                    toast.error(t('app_import_error') || 'Configuración inválida');
                    setSaving(false);
                    return;
                }

                const safeConfig: ConfigState = {
                    enabled: newConfig.enabled,
                    openNewTab: newConfig.openNewTab,
                    notifyEvent: newConfig.notifyEvent,
                    rules: newConfig.rules.map((rule: Omit<Rule, 'id'>) => ({
                        ...rule,
                        id: crypto.randomUUID()
                    })),
                    groups: newConfig.groups?.map((group: Omit<RuleGroup, 'id'>) => ({
                        ...group,
                        id: crypto.randomUUID()
                    })) || []
                };

                setConfig(safeConfig);
                await chromeApi.storage.sync.set({ options: safeConfig });
                await chromeApi.runtime.sendMessage({
                    type: 'syncOptions',
                    options: safeConfig
                });

                toast.success(t('app_import_success') || 'Configuración importada correctamente');
            } catch (error) {
                console.error('Error importing config:', error);
                toast.error(t('app_import_error') || 'Error al importar la configuración');
            } finally {
                setSaving(false);
                if (inputFile.current) {
                    inputFile.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    /**
     * Carga las opciones desde el almacenamiento de Chrome
     */
    const getOptions = async (): Promise<void> => {
        try {
            const data = (await chromeApi.storage.sync.get('options')) as { options?: OptionsType };
            if (data.options) {
                setConfig({
                    enabled: data.options.enabled,
                    openNewTab: data.options.openNewTab,
                    notifyEvent: data.options.notifyEvent,
                    rules: data.options.rules || [],
                    groups: data.options.groups || []
                });
            }
        } catch (error) {
            console.error('Error loading options:', error);
            toast.error(t('app_load_error') || 'Error al cargar la configuración');
        }
    };

    useEffect(() => {
        const messageListener = (
            request: RedirectorMessage,
            _sender: chrome.runtime.MessageSender,
            sendResponse: (response?: unknown) => void
        ) => {
            if (request.type === 'reloadOptions') {
                getOptions();
                sendResponse({ success: true });
            }
        };

        getOptions();
        chromeApi.runtime.onMessage.addListener(messageListener);

        return () => {
            chromeApi.runtime.onMessage.removeListener(messageListener);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Handlers para cambios en la configuración
     */
    const handleEnabledChange = (checked: boolean): void => {
        setConfig({ ...config, enabled: checked });
    };

    const handleTabChange = (checked: boolean): void => {
        setConfig({ ...config, openNewTab: checked });
    };

    const handleNotifyChange = (checked: boolean): void => {
        setConfig({ ...config, notifyEvent: checked });
    };

    const addRule = (): void => {
        const newRule: Rule = {
            id: crypto.randomUUID(),
            enabled: true,
            regex: false,
            src: '',
            dest: ''
        };
        setConfig({
            ...config,
            rules: [...config.rules, newRule]
        });
        toast.success(t('app_rule_added') || 'Regla agregada');
    };

    const handleRuleSrc = (value: string, index: number): void => {
        setConfig(prev => {
            const newRules = [...prev.rules];
            newRules[index] = { ...newRules[index], src: value };
            return { ...prev, rules: newRules };
        });
    };

    const handleRuleDest = (value: string, index: number): void => {
        setConfig(prev => {
            const newRules = [...prev.rules];
            newRules[index] = { ...newRules[index], dest: value };
            return { ...prev, rules: newRules };
        });
    };

    const handleRuleRegex = (checked: boolean, index: number): void => {
        setConfig(prev => {
            const newRules = [...prev.rules];
            newRules[index] = { ...newRules[index], regex: checked };
            return { ...prev, rules: newRules };
        });
    };

    const handleRuleEnabled = (checked: boolean, index: number): void => {
        setConfig(prev => {
            const newRules = [...prev.rules];
            newRules[index] = { ...newRules[index], enabled: checked };
            return { ...prev, rules: newRules };
        });
    };

    const handleRuleDelete = (index: number): void => {
        setConfig(prev => ({
            ...prev,
            rules: prev.rules.filter((_, i) => i !== index)
        }));
        toast.success(t('app_rule_deleted') || 'Regla eliminada');
    };

    /**
     * Internal function to save configuration with options
     */
    const saveConfigInternal = async (configToSave: ConfigState, showToast: boolean = true): Promise<void> => {
        if (showToast) setSaving(true);
        try {
            // Filtrar reglas válidas (con src y dest no vacíos)
            const validRules = configToSave.rules.filter(rule => rule.src.trim() !== '' && rule.dest.trim() !== '');
            const newConfig = { ...configToSave, rules: validRules };

            setConfig(newConfig);
            await chromeApi.storage.sync.set({ options: newConfig });
            await chromeApi.runtime.sendMessage({
                type: 'syncOptions',
                options: newConfig
            });

            if (showToast) {
                toast.success(t('app_saved') || 'Configuración guardada correctamente');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            if (showToast) {
                toast.error(t('app_save_error') || 'Error al guardar la configuración');
            }
        } finally {
            if (showToast) setSaving(false);
        }
    };

    /**
     * Guarda la configuración actual (Public wrapper for manual save)
     */
    const saveData = async (): Promise<void> => {
        await saveConfigInternal(config, true);
    };

    const updateRule = (index: number, updates: Partial<Rule>, save: boolean = false): void => {
        // Calculate new state first
        const newHelper = () => {
             const newRules = [...config.rules];
             newRules[index] = { ...newRules[index], ...updates };
             return { ...config, rules: newRules };
        };

        const newConfig = newHelper();
        setConfig(newConfig);

        if (save) {
             saveConfigInternal(newConfig, false);
        }
    };

    const addGroup = (): void => {
        const newGroup: RuleGroup = {
            id: crypto.randomUUID(),
            name: t('app_new_group') || 'New Group',
            color: '#3b82f6',
            enabled: true,
            collapsed: false
        };
        setConfig({
            ...config,
            groups: [...(config.groups || []), newGroup]
        });
        toast.success(t('app_group_added') || 'Grupo agregado');
    };

    const deleteGroup = (id: string): void => {
        const newGroups = (config.groups || []).filter(g => g.id !== id);
        const newRules = config.rules.map(r => r.groupId === id ? { ...r, groupId: undefined } : r);
        setConfig({ ...config, groups: newGroups, rules: newRules });
        toast.success(t('app_group_deleted') || 'Grupo eliminado');
    };

    const updateGroup = (id: string, updates: Partial<RuleGroup>, save: boolean = false): void => {
        const newGroups = (config.groups || []).map(g => g.id === id ? { ...g, ...updates } : g);
        const newConfig = { ...config, groups: newGroups };
        setConfig(newConfig);
        
        if (save) {
            saveConfigInternal(newConfig, false);
        }
    };

    /**
     * Reinicia la configuración a los valores por defecto
     */
    const resetData = async (): Promise<void> => {
        setSaving(true);
        try {
            await chromeApi.runtime.sendMessage({ type: 'resetRules' });
            toast.success(t('app_config_reset') || 'Configuración reiniciada correctamente');
        } catch (error) {
            console.error('Error resetting config:', error);
            toast.error(t('app_reset_error') || 'Error al reiniciar la configuración');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Limpia todas las reglas
     */
    const clearRules = async (): Promise<void> => {
        setSaving(true);
        try {
            const newConfig = { ...config, rules: [] };
            setConfig(newConfig);

            await chromeApi.storage.sync.set({ options: newConfig });
            await chromeApi.runtime.sendMessage({
                type: 'syncOptions',
                options: newConfig
            });

            toast.success(t('app_clear_success') || 'Reglas eliminadas correctamente');
        } catch (error) {
            console.error('Error clearing rules:', error);
            toast.error(t('app_clear_error') || 'Error al eliminar las reglas');
        } finally {
            setSaving(false);
        }
    };

    if (mini) {
        return (
            <TooltipProvider>
                <div className="flex flex-col h-full bg-background">
                    <MiniMode
                        config={config}
                        updateGroup={updateGroup}
                        updateRule={updateRule}
                    />
                </div>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <div className={`flex flex-col min-h-screen bg-background ${mini ? 'pt-4' : ''}`}>
                {/* Header */}
                <header className="shrink-0 border-b">
                    <div className="container max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src="/img/icon-64.png" alt="Redirector" className="w-12 h-12" />
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold">{t('app_name') || 'Redirector'}</h1>
                                    <p className="text-sm text-muted-foreground">
                                        {t('app_subtitle') || 'URL Redirection Manager'}
                                    </p>
                                </div>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <ModeToggle />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('app_theme_toogle') || 'Toggle theme'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </header>
                <Donation className="shrink-0 px-4 mb-0 mt-4" />

                {/* Main Content */}
                <main className="flex-grow container max-w-7xl mx-auto px-4 py-8 space-y-8">
                    {/* Tabs Navigation */}
                    <Tabs defaultValue="settings" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto">
                            <TabsTrigger value="settings">{t('app_settings') || 'Configuración'}</TabsTrigger>
                            <TabsTrigger value="rules">
                                {t('app_rules') || 'Reglas'}
                                <Badge variant="secondary" className="ml-2">
                                    {config.rules.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="groups">
                                    {t('app_groups') || 'Grupos'}
                            </TabsTrigger>
                            <TabsTrigger value="advanced">{t('app_advanced') || 'Avanzado'}</TabsTrigger>
                        </TabsList>

                        {/* Settings Tab */}
                        <TabsContent value="settings">
                            <SettingsTab
                                config={config}
                                saving={saving}
                                inputFile={inputFile}
                                handleEnabledChange={handleEnabledChange}
                                handleTabChange={handleTabChange}
                                handleNotifyChange={handleNotifyChange}
                                importConfig={importConfig}
                                exportConfig={exportConfig}
                                saveData={saveData}
                            />
                        </TabsContent>

                        {/* Rules Tab */}
                        <TabsContent value="rules">
                            <RulesTab
                                config={config}
                                saving={saving}
                                setConfig={setConfig}
                                addRule={addRule}
                                handleRuleSrc={handleRuleSrc}
                                handleRuleDest={handleRuleDest}
                                handleRuleRegex={handleRuleRegex}
                                handleRuleEnabled={handleRuleEnabled}
                                handleRuleDelete={handleRuleDelete}
                                updateRule={updateRule}
                                updateGroup={updateGroup}
                                saveData={saveData}
                            />
                        </TabsContent>

                        {/* Groups Tab */}
                        <TabsContent value="groups">
                            <GroupsTab
                                config={config}
                                saving={saving}
                                addGroup={addGroup}
                                updateGroup={updateGroup}
                                deleteGroup={deleteGroup}
                                saveData={saveData}
                            />
                        </TabsContent>

                        {/* Advanced Tab */}
                        <TabsContent value="advanced" className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Reset Data */}
                                <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm border-destructive">
                                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                        <RotateCcw className="w-5 h-5 text-destructive" />
                                        {t('app_reset_data') || 'Restablecer configuración predeterminada'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {t('app_reset_data_desc') ||
                                            'Restaurar la configuración predeterminada de la extensión'}
                                    </p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={saving} className='w-full'>
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                {t('app_reset_btn') || 'Restablecer'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    {t('app_reset_confirm_title') || '¿Estás seguro?'}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('app_reset_confirm_desc') ||
                                                        'Esta acción restablecerá todas las configuraciones y reglas a sus valores predeterminados. Esta acción no se puede deshacer.'}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={saving}>
                                                    {t('app_cancel') || 'Cancelar'}
                                                </AlertDialogCancel>
                                                <AlertDialogAction onClick={resetData} disabled={saving}>
                                                    {t('app_reset_btn') || 'Restablecer'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                {/* Clear Rules */}
                                <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm border-destructive">
                                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                        <Trash2 className="w-5 h-5 text-destructive" />
                                        {t('app_clear_rules') || 'Limpiar reglas (esto no se puede deshacer)'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {t('app_clear_rules_desc') ||
                                            'Eliminar todas las reglas de redirección configuradas'}
                                    </p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={saving} className='w-full'>
                                                <XCircle className="w-4 h-4 mr-2" />
                                                {t('app_clear_rules_btn') || 'Limpiar reglas'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    {t('app_clear_confirm_title') || '¿Eliminar todas las reglas?'}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('app_clear_confirm_desc') ||
                                                        'Esta acción eliminará todas las reglas de redirección. La configuración general se mantendrá. Esta acción no se puede deshacer.'}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={saving}>
                                                    {t('app_cancel') || 'Cancelar'}
                                                </AlertDialogCancel>
                                                <AlertDialogAction onClick={clearRules} disabled={saving}>
                                                    {t('app_clear_rules_btn') || 'Limpiar reglas'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
                <Footer className="shrink-0" />
            </div>
        </TooltipProvider>
    );
}
