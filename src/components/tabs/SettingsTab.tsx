
import {
    CheckCircle2,
    Download,
    Upload,
    Save
} from 'lucide-react';
import { t } from '../../utils/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '../../components/ui/tooltip';
import type { ConfigState } from '../../Options';
import type { RefObject } from 'react';

interface SettingsTabProps {
    config: ConfigState;
    saving: boolean;
    inputFile: RefObject<HTMLInputElement | null>;
    handleEnabledChange: (checked: boolean) => void;
    handleTabChange: (checked: boolean) => void;
    handleNotifyChange: (checked: boolean) => void;
    importConfig: () => void;
    exportConfig: () => void;
    saveData: () => Promise<void>;
}

export function SettingsTab({
    config,
    saving,
    inputFile,
    handleEnabledChange,
    handleTabChange,
    handleNotifyChange,
    importConfig,
    exportConfig,
    saveData
}: SettingsTabProps) {
    return (
        <div className="space-y-6 mt-6">
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
                                    className="flex-1 cursor-pointer"
                                />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            disabled={saving}
                                            onClick={importConfig}
                                        >
                                            <Upload className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('app_import_btn') || 'Import'}</p>
                                    </TooltipContent>
                                </Tooltip>
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
                    {saving ? t('app_saving') || 'Saving...' : t('app_save_changes') || 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
