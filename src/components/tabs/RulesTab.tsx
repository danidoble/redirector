import { AlertCircle, Plus, Save, Search, GripVertical, Trash2, ChevronDown, ChevronRight, Layers, List } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ReactSortable } from 'react-sortablejs';
import { useState } from 'react';
import { t } from '../../utils/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '../../components/ui/tooltip';
import type { ConfigState } from '../../Options';
import type { Rule, RuleGroup } from '../../types/background';

interface RulesTabProps {
    config: ConfigState;
    saving: boolean;
    setConfig: (config: ConfigState) => void;
    addRule: () => void;
    handleRuleSrc: (value: string, index: number) => void;
    handleRuleDest: (value: string, index: number) => void;
    handleRuleRegex: (checked: boolean, index: number) => void;
    handleRuleEnabled: (checked: boolean, index: number) => void;
    handleRuleDelete: (index: number) => void;
    updateRule: (index: number, updates: Partial<Rule>, save?: boolean) => void;
    updateGroup: (id: string, updates: Partial<RuleGroup>, save?: boolean) => void;
    saveData: () => Promise<void>;
}

export function RulesTab({
    config,
    saving,
    setConfig,
    addRule,
    handleRuleSrc,
    handleRuleDest,
    handleRuleRegex,
    handleRuleEnabled,
    handleRuleDelete,
    updateRule,
    updateGroup,
    saveData
}: RulesTabProps) {
    const [searchText, setSearchText] = useState<string>('');
    const [isGrouped, setIsGrouped] = useState<boolean>(true);

    const renderRuleList = (rules: Rule[], groupName?: string, groupId?: string, groupColor?: string, isCollapsed?: boolean) => {
        if (rules.length === 0 && !groupId) return null;

        return (
            <div className={groupId ? "mb-4" : ""}>
                {groupId && (
                    <div 
                        className="flex items-center gap-2 mb-2 cursor-pointer select-none hover:bg-muted/50 p-2 rounded-md transition-colors"
                        onClick={() => updateGroup(groupId, { collapsed: !isCollapsed }, true)}
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: groupColor }}></div>
                        <span className="font-semibold text-lg">{groupName}</span>
                        <Badge variant="secondary" className="ml-auto">{rules.length}</Badge>
                    </div>
                )}
                
                {(!isCollapsed || !groupId) && (
                    <ReactSortable
                        handle=".drag-handle"
                        list={rules.map(r => ({ ...r, id: r.id || crypto.randomUUID() }))}
                        setList={newGroupRules => {
                            if (!searchText) {
                                // Reconstruct the full list based on displayed groups to ensure correct order
                                if (groupId) {
                                    const groups = config.groups || [];
                                    // Rebuild list: for each group, if it's the current one, use new rules, otherwise use existing.
                                    const rebuiltList = groups.flatMap(g => 
                                        g.id === groupId ? (newGroupRules as Rule[]) : config.rules.filter(r => r.groupId === g.id)
                                    );
                                    
                                    // Append ungrouped rules
                                    const ungrouped = config.rules.filter(r => !r.groupId);
                                    
                                    setConfig({ ...config, rules: [...rebuiltList, ...ungrouped] });
                                } else {
                                    // Updating ungrouped section
                                    const groups = config.groups || [];
                                    const groupedRules = groups.flatMap(g => config.rules.filter(r => r.groupId === g.id));
                                    const newUngrouped = newGroupRules as Rule[];
                                    setConfig({ ...config, rules: [...groupedRules, ...newUngrouped] });
                                }
                            }
                        }}
                        group={{ name: groupId ? `group-${groupId}` : 'ungrouped', put: false }}
                        className={groupId ? "space-y-3 pl-4 border-l ml-2" : "space-y-3"}
                    >
                        {rules.map((rule) => {
                            const index = config.rules.findIndex(r => r.id === rule.id); // Get global index
                            return (
                                <CardRule
                                    key={rule.id}
                                    rule={rule}
                                    index={index}
                                    config={config}
                                    updateRule={updateRule}
                                    handleRuleDelete={handleRuleDelete}
                                    handleRuleRegex={handleRuleRegex}
                                    handleRuleSrc={handleRuleSrc}
                                    handleRuleDest={handleRuleDest}
                                    handleRuleEnabled={handleRuleEnabled}
                                    // isGrouped={isGrouped}
                                    groupColor={groupColor}
                                />
                            );
                        })}
                    </ReactSortable>
                )}
            </div>
        );
    };

    const filteredRules = config.rules.map((r, index) => ({ ...r, originalIndex: index, id: r.id || crypto.randomUUID() }))
        .filter(r => {
            if (!searchText) return true;
            const search = searchText.toLowerCase();
            const groupName = config.groups?.find(g => g.id === r.groupId)?.name.toLowerCase() || '';
            return (
                r.name?.toLowerCase().includes(search) ||
                r.src.toLowerCase().includes(search) ||
                r.dest.toLowerCase().includes(search) ||
                groupName.includes(search)
            );
        });

    return (
        <div className="space-y-6 mt-6">
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
                        <div className="flex gap-2">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => setIsGrouped(!isGrouped)}>
                                        {isGrouped ? <List className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isGrouped ? (t('app_view_list') || 'List View') : (t('app_view_grouped') || 'Grouped View')}</p>
                                </TooltipContent>
                            </Tooltip>
                            
                            <Button onClick={addRule} disabled={saving}>
                                <Plus className="w-4 h-4 mr-2" />
                                {t('app_add_rule') || 'Agregar Regla'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="mb-4 relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('app_search_placeholder') || 'Search rules...'}
                            className="pl-9"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                    </div>
                    {config.rules.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t('app_no_rules') || 'No hay reglas configuradas'}</p>
                            <p className="text-sm mt-2">
                                {t('app_no_rules_desc') || 'Haz clic en "Agregar Regla" para comenzar'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRules.length === 0 && searchText ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No rules match your search.
                                </div>
                            ) : (
                                <>
                                    {isGrouped && !searchText ? (
                                        <>
                                            {config.groups?.map(group => {
                                                const groupRules = filteredRules.filter(r => r.groupId === group.id);
                                                if (groupRules.length === 0) return null;
                                                return (
                                                    <div key={group.id}>
                                                        {renderRuleList(groupRules, group.name, group.id, group.color, group.collapsed)}
                                                    </div>
                                                );
                                            })}
                                            {/* Ungrouped Rules */}
                                            {renderRuleList(filteredRules.filter(r => !r.groupId), "Ungrouped", undefined, undefined, false)}
                                        </>
                                    ) : (
                                        // List View (Original)
                                        <ReactSortable
                                            handle=".drag-handle"
                                            list={config.rules.map(r => ({ ...r, id: r.id || crypto.randomUUID() }))}
                                            setList={newRules => {
                                                if (!searchText) {
                                                    setConfig({ ...config, rules: newRules as Rule[] });
                                                }
                                            }}
                                            className="space-y-3"
                                        >
                                            {filteredRules.map(rule => {
                                                const index = config.rules.findIndex(r => r.id === rule.id);
                                                const group = config.groups?.find(g => g.id === rule.groupId);
                                                return (
                                                    <CardRule
                                                        key={rule.id || index}
                                                        rule={rule}
                                                        index={index}
                                                        config={config}
                                                        updateRule={updateRule}
                                                        handleRuleDelete={handleRuleDelete}
                                                        handleRuleRegex={handleRuleRegex}
                                                        handleRuleSrc={handleRuleSrc}
                                                        handleRuleDest={handleRuleDest}
                                                        handleRuleEnabled={handleRuleEnabled}
                                                        groupColor={group?.color}
                                                    />
                                                );
                                            })}
                                        </ReactSortable>
                                    )}
                                </>
                            )}
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
        </div>
    );
}

function CardRule({
    rule,
    config,
    index,
    handleRuleDelete,
    handleRuleRegex,
    handleRuleSrc,
    handleRuleDest,
    updateRule,
    handleRuleEnabled,
    groupColor
}: {
    rule: Rule;
    config: ConfigState;
    index: number;
    handleRuleDelete: (index: number) => void;
    handleRuleRegex: (checked: boolean, index: number) => void;
    handleRuleSrc: (src: string, index: number) => void;
    handleRuleDest: (dest: string, index: number) => void;
    updateRule: (index: number, updates: Partial<Rule>, save?: boolean) => void;
    handleRuleEnabled: (checked: boolean, index: number) => void;
    groupColor?: string;
}) {
    // Determine effective color: Use group color if assigned (regardless of view), otherwise rule color
    // const effectiveColor = (rule.groupId && groupColor) ? groupColor : (rule.color || '#3b82f6');

    return (
        <Card key={rule.id || index} className="overflow-hidden py-2 sm:py-6" style={rule.groupId && groupColor ? { borderLeftColor: groupColor, borderLeftWidth: '4px' } : undefined}>
            <CardContent className="p-4">
                <div className="grid gap-4">
                    <div className="flex items-start gap-4">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="drag-handle cursor-move mt-2 text-muted-foreground hover:text-foreground">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('app_rule_header_sort') || 'Sort'}</p>
                            </TooltipContent>
                        </Tooltip>
                        
                        {/* Collapse Toggle */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div 
                                    className="mt-2 text-muted-foreground hover:text-foreground cursor-pointer" 
                                    onClick={() => updateRule(index, { collapsed: !rule.collapsed }, true)}
                                >
                                    {rule.collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{rule.collapsed ? (t('tooltip_expand') || 'Expand') : (t('tooltip_collapse') || 'Collapse')}</p>
                            </TooltipContent>
                        </Tooltip>

                        <div className="flex-1 grid gap-4">
                            {/* Header row (Always visible, simpler if collapsed) */}
                            <div className="grid sm:flex sm:flex-row items-center gap-4">
                                {/* <div className="flex flex-col gap-2">
                                    <Label className={`whitespace-nowrap ${rule.collapsed ? 'sr-only' : ''}`}>{t('app_rule_color') || 'Color'}</Label>
                                    <input
                                        type="color"
                                        disabled={!!(rule.groupId)}
                                        value={effectiveColor}
                                        onChange={e =>
                                            updateRule(index, {
                                                color: e.target.value
                                            })
                                        }
                                        className={`h-9 w-9 rounded border p-0 ${rule.groupId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        title={rule.groupId ? 'Inherited from group' : 'Choose color'}
                                    />
                                </div> */}
                                <div className="flex-1 grid gap-2">
                                    <div className="flex flex-col gap-2">
                                        <Label className={`whitespace-nowrap ${rule.collapsed ? 'sr-only' : ''}`}>
                                            {t('app_rule_name') || 'Nombre (Opcional)'}
                                        </Label>
                                        {rule.collapsed ? (
                                             <div className="font-medium h-9 flex items-center px-3 border rounded-md bg-muted/20 truncate">
                                                 {rule.name || rule.src || "Untitled Rule"}
                                             </div>
                                        ) : (
                                            <Input
                                                value={rule.name || ''}
                                                onChange={e =>
                                                    updateRule(index, {
                                                        name: e.target.value
                                                    })
                                                }
                                                placeholder={t('app_rule_name_placeholder') || 'Rule Name'}
                                            />
                                        )}
                                    </div>
                                </div>
                                
                                <div className={`grid gap-2 ${rule.collapsed ? 'hidden sm:grid' : ''}`}>
                                     <Label className={`whitespace-nowrap ${rule.collapsed ? 'sr-only' : ''}`}>{t('app_rule_group') || 'Grupo'}</Label>
                                     {rule.collapsed ? (
                                         <div className="h-9 flex items-center px-3 border rounded-md bg-muted/20 text-sm">
                                             {config.groups?.find(g => g.id === rule.groupId)?.name || t('app_group_none') || "None"}
                                         </div>
                                     ) : (
                                    <Select
                                        value={rule.groupId || 'none'}
                                        onValueChange={v =>
                                            updateRule(index, {
                                                groupId: v === 'none' ? undefined : v
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder={t('app_select_group') || 'Select group'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('app_group_none') || 'None'}</SelectItem>
                                            {config.groups?.map(g => (
                                                <SelectItem key={g.id} value={g.id}>
                                                    {g.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     )}
                                </div>
                                
                                {/* Enable Switch (Always visible) */}
                                {rule.collapsed && (
                                <div className="flex items-center space-x-2 pt-6 sm:pt-0">
                                     <Tooltip>
                                         <TooltipTrigger asChild>
                                             <div>
                                                 <Switch
                                                    id={`enabled-${index}`}
                                                    checked={rule.enabled}
                                                    onCheckedChange={checked => handleRuleEnabled(checked, index)}
                                                />
                                             </div>
                                         </TooltipTrigger>
                                         <TooltipContent>
                                             <p>{rule.enabled ? (t('tooltip_disable_rule') || 'Disable Rule') : (t('tooltip_enable_rule') || 'Enable Rule')}</p>
                                         </TooltipContent>
                                     </Tooltip>
                                </div>
                                )}
                            </div>
                            
                            {!rule.collapsed && (
                            <>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>{t('app_rule_header_source') || 'Fuente'}</Label>
                                    <Textarea
                                        value={rule.src}
                                        onChange={e => handleRuleSrc(e.target.value, index)}
                                        placeholder="https://example.com/old"
                                        className="font-mono text-sm"
                                        rows={2}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('app_rule_header_destination') || 'Destino'}</Label>
                                    <Textarea
                                        value={rule.dest}
                                        onChange={e => handleRuleDest(e.target.value, index)}
                                        placeholder="https://example.com/new"
                                        className="font-mono text-sm"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-2 border-r pr-4 mr-2">
                                             <Switch
                                                id={`enabled-detail-${index}`}
                                                checked={rule.enabled}
                                                onCheckedChange={checked => handleRuleEnabled(checked, index)}
                                            />
                                            <Label htmlFor={`enabled-detail-${index}`} className="text-sm cursor-pointer">
                                                {t('app_rule_label_enabled') || 'Enabled'}
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`regex-${index}`}
                                                checked={rule.regex}
                                                onCheckedChange={checked => handleRuleRegex(checked, index)}
                                            />
                                            <Label htmlFor={`regex-${index}`} className="text-sm cursor-pointer">
                                                {t('app_rule_header_regex') || 'Regex'}
                                            </Label>
                                        </div>
                                        <Switch
                                            id={`decode-${index}`}
                                            checked={rule.shouldDecode || false}
                                            onCheckedChange={checked =>
                                                updateRule(index, {
                                                    shouldDecode: checked
                                                })
                                            }
                                        />
                                        <Label htmlFor={`decode-${index}`} className="text-sm cursor-pointer">
                                            {t('app_rule_header_decode') || 'Decode'}
                                        </Label>
                                    </div>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleRuleDelete(index)}
                                            className="shrink-0 hidden sm:inline-flex"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('tooltip_delete') || 'Delete'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
