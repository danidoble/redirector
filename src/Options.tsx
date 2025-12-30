import { ModeToggle } from './components/mode-toggle';
import { useEffect, useRef, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import { toast } from 'sonner';
import {
    GripVertical,
    Trash2,
    Plus,
    Save,
    Download,
    Upload,
    RotateCcw,
    XCircle,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { t } from './utils/i18n';
import { getChrome } from './utils/chrome-mock';
import type { Options as OptionsType, Rule, RedirectorMessage } from './types/background';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
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

interface ConfigState extends OptionsType {
    rules: Rule[];
}

export function Options({ mini = false }: { mini?: boolean }) {
    const chromeApi = getChrome();
    const inputFile = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [config, setConfig] = useState<ConfigState>({
        enabled: true,
        openNewTab: false,
        notifyEvent: false,
        rules: []
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
                    }))
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
                    rules: data.options.rules || []
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
     * Guarda la configuración actual
     */
    const saveData = async (): Promise<void> => {
        setSaving(true);
        try {
            // Filtrar reglas válidas (con src y dest no vacíos)
            const validRules = config.rules.filter(rule => rule.src.trim() !== '' && rule.dest.trim() !== '');

            const newConfig = { ...config, rules: validRules };
            setConfig(newConfig);

            await chromeApi.storage.sync.set({ options: newConfig });
            await chromeApi.runtime.sendMessage({
                type: 'syncOptions',
                options: newConfig
            });

            toast.success(t('app_saved') || 'Configuración guardada correctamente');
        } catch (error) {
            console.error('Error saving config:', error);
            toast.error(t('app_save_error') || 'Error al guardar la configuración');
        } finally {
            setSaving(false);
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

    return (
        <div className={`min-h-screen bg-background ${mini ? 'pt-4' : ''}`}>
            {/* Header */}
            <header className="border-b">
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
                        <ModeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Tabs Navigation */}
                <Tabs defaultValue="settings" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                        <TabsTrigger value="settings">{t('app_settings') || 'Configuración'}</TabsTrigger>
                        <TabsTrigger value="rules">
                            {t('app_rules') || 'Reglas'}
                            <Badge variant="secondary" className="ml-2">
                                {config.rules.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="advanced">{t('app_advanced') || 'Avanzado'}</TabsTrigger>
                    </TabsList>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    {t('app_general_settings') || 'Configuración General'}
                                </CardTitle>
                                <CardDescription>
                                    {t('app_general_settings_desc') || 'Configura el comportamiento de la extensión'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Extension Enabled */}
                                <div className="flex items-center justify-between space-x-4">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="enabled" className="text-base font-medium">
                                            {t('app_extension_status') || 'Estado de la Extensión'}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {config.enabled
                                                ? t('app_extension_enabled_desc') ||
                                                  'La extensión está activa y redirigiendo URLs'
                                                : t('app_extension_disabled_desc') || 'La extensión está desactivada'}
                                        </p>
                                    </div>
                                    <Switch
                                        id="enabled"
                                        checked={config.enabled}
                                        onCheckedChange={handleEnabledChange}
                                    />
                                </div>

                                <Separator />

                                {/* Open in New Tab */}
                                <div className="flex items-center justify-between space-x-4">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="newTab" className="text-base font-medium">
                                            {t('app_redirect_behavior') || 'Comportamiento de Redirección'}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {config.openNewTab
                                                ? t('app_redirect_new_tab') || 'Abrir redireciones en nueva pestaña'
                                                : t('app_redirect_inline') || 'Redireccionar en la misma pestaña'}
                                        </p>
                                    </div>
                                    <Switch id="newTab" checked={config.openNewTab} onCheckedChange={handleTabChange} />
                                </div>

                                <Separator />

                                {/* Notifications */}
                                <div className="flex items-center justify-between space-x-4">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="notifications" className="text-base font-medium">
                                            {t('app_notify_event') || 'Notificaciones'}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {t('app_notify_event_desc') ||
                                                'Mostrar notificación cuando se redirija una URL'}
                                        </p>
                                    </div>
                                    <Switch
                                        id="notifications"
                                        checked={config.notifyEvent}
                                        onCheckedChange={handleNotifyChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Import/Export Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    {t('app_import_export') || 'Importar / Exportar'}
                                </CardTitle>
                                <CardDescription>
                                    {t('app_import_export_desc') || 'Guarda o carga tu configuración'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Import */}
                                    <div className="space-y-2">
                                        <Label htmlFor="import-file">
                                            {t('app_import_data') || 'Importar Configuración'}
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="import-file"
                                                type="file"
                                                accept="application/json"
                                                ref={inputFile}
                                                className="flex-1"
                                            />
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                disabled={saving}
                                                onClick={importConfig}
                                            >
                                                <Upload className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Export */}
                                    <div className="space-y-2">
                                        <Label>{t('app_export_data') || 'Exportar Configuración'}</Label>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            disabled={saving}
                                            onClick={exportConfig}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            {t('app_export_btn') || 'Exportar'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <Button size="lg" disabled={saving} onClick={saveData} className="min-w-32">
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? t('app_saving') || 'Guardando...' : t('app_save_data') || 'Guardar Cambios'}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Rules Tab */}
                    <TabsContent value="rules" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5" />
                                            {t('app_rules') || 'Reglas de Redirección'}
                                        </CardTitle>
                                        <CardDescription>
                                            {t('app_rules_desc') || 'Gestiona las reglas de redirección de URLs'}
                                        </CardDescription>
                                    </div>
                                    <Button onClick={addRule} disabled={saving}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        {t('app_add_rule') || 'Agregar Regla'}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {config.rules.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">
                                            {t('app_no_rules') || 'No hay reglas configuradas'}
                                        </p>
                                        <p className="text-sm mt-2">
                                            {t('app_no_rules_desc') || 'Haz clic en "Agregar Regla" para comenzar'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <ReactSortable
                                            handle=".drag-handle"
                                            list={config.rules.map(r => ({ ...r, id: r.id || crypto.randomUUID() }))}
                                            setList={newRules => setConfig({ ...config, rules: newRules as Rule[] })}
                                            className="space-y-3"
                                            tag="div"
                                        >
                                            {config.rules.map((rule, index) => (
                                                <Card key={rule.id || index} className="overflow-hidden py-2 sm:py-6">
                                                    <CardContent className="p-4">
                                                        <div className="grid gap-4">
                                                            <div className="flex flex-col sm:flex-row items-start gap-3">
                                                              <div className='sm:hidden inline-flex items-center gap-2 justify-between w-full'>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="drag-handle cursor-grab mt-1 shrink-0"
                                                                >
                                                                    <GripVertical className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => handleRuleDelete(index)}
                                                                    className="shrink-0"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                              </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="drag-handle cursor-grab mt-1 shrink-0 hidden sm:inline-flex"
                                                                >
                                                                    <GripVertical className="w-4 h-4" />
                                                                </Button>

                                                                <div className="sm:flex-1 w-full grid gap-4">
                                                                    <div className="grid gap-2">
                                                                        <Label
                                                                            htmlFor={`src-${index}`}
                                                                            className="text-sm font-medium"
                                                                        >
                                                                            {t('app_rule_header_source') ||
                                                                                'URL Origen'}{' '}
                                                                            <span className="text-destructive">*</span>
                                                                        </Label>
                                                                        <Textarea
                                                                            id={`src-${index}`}
                                                                            placeholder="https://example.com/ or ^https?://(.+)\.example\.com/(.*)$"
                                                                            value={rule.src || ''}
                                                                            onChange={e =>
                                                                                handleRuleSrc(e.target.value, index)
                                                                            }
                                                                            className="font-mono text-sm min-h-20 resize-y"
                                                                            rows={2}
                                                                        />
                                                                    </div>

                                                                    <div className="grid gap-2">
                                                                        <Label
                                                                            htmlFor={`dest-${index}`}
                                                                            className="text-sm font-medium"
                                                                        >
                                                                            {t('app_rule_header_destination') ||
                                                                                'URL Destino'}{' '}
                                                                            <span className="text-destructive">*</span>
                                                                        </Label>
                                                                        <Textarea
                                                                            id={`dest-${index}`}
                                                                            placeholder="https://redirect.com/ or https://new.example.com/$1/$2"
                                                                            value={rule.dest || ''}
                                                                            onChange={e =>
                                                                                handleRuleDest(e.target.value, index)
                                                                            }
                                                                            className="font-mono text-sm min-h-20 resize-y"
                                                                            rows={2}
                                                                        />
                                                                    </div>

                                                                    <div className="flex flex-wrap gap-4">
                                                                        <div className="flex items-center space-x-2">
                                                                            <Switch
                                                                                id={`regex-${index}`}
                                                                                checked={rule.regex}
                                                                                onCheckedChange={checked =>
                                                                                    handleRuleRegex(checked, index)
                                                                                }
                                                                            />
                                                                            <Label
                                                                                htmlFor={`regex-${index}`}
                                                                                className="text-sm cursor-pointer"
                                                                            >
                                                                                {t('app_rule_header_regex') || 'RegEx'}
                                                                            </Label>
                                                                        </div>

                                                                        <div className="flex items-center space-x-2">
                                                                            <Switch
                                                                                id={`enabled-${index}`}
                                                                                checked={rule.enabled}
                                                                                onCheckedChange={checked =>
                                                                                    handleRuleEnabled(checked, index)
                                                                                }
                                                                            />
                                                                            <Label
                                                                                htmlFor={`enabled-${index}`}
                                                                                className="text-sm cursor-pointer"
                                                                            >
                                                                                {t('app_rule_header_enable') ||
                                                                                    'Habilitada'}
                                                                            </Label>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => handleRuleDelete(index)}
                                                                    className="shrink-0 hidden sm:inline-flex"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </ReactSortable>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <Button size="lg" disabled={saving} onClick={saveData} className="min-w-32">
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? t('app_saving') || 'Guardando...' : t('app_save_data') || 'Guardar Cambios'}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Advanced Tab */}
                    <TabsContent value="advanced" className="space-y-6 mt-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Reset Configuration */}
                            <Card className="border-destructive/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-destructive">
                                        <RotateCcw className="w-5 h-5" />
                                        {t('app_reset_data') || 'Restablecer Configuración'}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('app_reset_data_desc') ||
                                            'Restaurar la configuración predeterminada de la extensión'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full" disabled={saving}>
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                {t('app_reset_btn') || 'Restablecer Todo'}
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
                                                <AlertDialogCancel>{t('app_cancel') || 'Cancelar'}</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={resetData}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {t('app_reset_btn') || 'Restablecer'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card>

                            {/* Clear Rules */}
                            <Card className="border-destructive/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-destructive">
                                        <XCircle className="w-5 h-5" />
                                        {t('app_clear_rules') || 'Limpiar Reglas'}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('app_clear_rules_desc') ||
                                            'Eliminar todas las reglas de redirección configuradas'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full" disabled={saving}>
                                                <XCircle className="w-4 h-4 mr-2" />
                                                {t('app_clear_rules_btn') || 'Limpiar Todas las Reglas'}
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
                                                <AlertDialogCancel>{t('app_cancel') || 'Cancelar'}</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={clearRules}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {t('app_clear_rules_btn') || 'Limpiar Reglas'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Footer */}
            <footer className="border-t mt-12">
                <div className="container max-w-7xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    Created by <a href="https://github.com/danidoble" target='_blank'>danidoble</a>. © {new Date().getFullYear()}
                </div>
            </footer>
        </div>
    );
}
