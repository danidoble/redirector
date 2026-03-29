import { Settings, Plus, Save, Trash2 } from 'lucide-react';
import { t } from '../../utils/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import type { ConfigState } from '../../Options';
import type { RuleGroup } from '../../types/background';

interface GroupsTabProps {
    config: ConfigState;
    saving: boolean;
    addGroup: () => void;
    updateGroup: (id: string, updates: Partial<RuleGroup>) => void;
    deleteGroup: (id: string) => void;
    saveData: () => Promise<void>;
}

export function GroupsTab({ config, saving, addGroup, updateGroup, deleteGroup, saveData }: GroupsTabProps) {
    return (
        <div className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                {t('app_groups') || 'Grupos de Reglas'}
                            </CardTitle>
                            <CardDescription>
                                {t('app_groups_desc') || 'Organize your rules into groups with colors'}
                            </CardDescription>
                        </div>
                        <Button onClick={addGroup} disabled={saving}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('app_add_group') || 'Agregar Grupo'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {!config.groups || config.groups.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg font-medium">{t('app_no_groups') || 'No groups found'}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {config.groups.map(group => (
                                <div
                                    key={group.id}
                                    className="flex items-center gap-4 border p-4 rounded-lg bg-card text-card-foreground shadow-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Label className="sr-only">Color</Label>
                                        <input
                                            type="color"
                                            value={group.color}
                                            onChange={e => updateGroup(group.id, { color: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                        />
                                    </div>
                                    <div className="flex-1 grid gap-2">
                                        <Label className="sr-only">Name</Label>
                                        <Input
                                            value={group.name}
                                            onChange={e => updateGroup(group.id, { name: e.target.value })}
                                            placeholder={t('app_group_name_placeholder') || 'Group Name'}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <Switch
                                                        checked={group.enabled}
                                                        onCheckedChange={c => updateGroup(group.id, { enabled: c })}
                                                    />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>
                                                    {group.enabled
                                                        ? t('tooltip_disable_group') || 'Disable Group'
                                                        : t('tooltip_enable_group') || 'Enable Group'}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => deleteGroup(group.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('tooltip_delete') || 'Delete'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button size="lg" disabled={saving} onClick={saveData} className="min-w-32">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? t('app_saving') || 'Saving...' : t('app_save_changes') || 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
