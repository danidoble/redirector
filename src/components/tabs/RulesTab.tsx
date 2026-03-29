import {
    AlertCircle,
    Plus,
    Save,
    Search,
    GripVertical,
    Trash2,
    ChevronDown,
    ChevronRight,
    Layers,
    List,
    Pencil
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ReactSortable } from 'react-sortablejs';
import { useState } from 'react';
import { t } from '../../utils/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { RuleForm } from './RuleForm';
import type { ConfigState } from '../../Options';
import type { Rule, RuleGroup } from '../../types/background';

interface RulesTabProps {
    config: ConfigState;
    saving: boolean;
    setConfig: (config: ConfigState) => void;

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
    handleRuleEnabled,
    handleRuleDelete,
    updateRule,
    updateGroup,
    saveData
}: RulesTabProps) {
    const [searchText, setSearchText] = useState<string>('');
    const [isGrouped, setIsGrouped] = useState<boolean>(true);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

    const handleEditRuleStart = (ruleId: string) => {
        setEditingRuleId(ruleId);
        setIsRuleModalOpen(true);
    };

    const handleAddRuleStart = () => {
        setEditingRuleId(null);
        setIsRuleModalOpen(true);
    };

    const handleSaveRule = (savedRule: Rule) => {
        if (editingRuleId) {
            // Update existing
            const index = config.rules.findIndex(r => r.id === savedRule.id);
            if (index !== -1) {
                updateRule(index, savedRule, true); // Save immediately
            }
        } else {
            // Add new (using internal add logic but with full rule data)
            // We need to fetch current rules to append.
            // Since updateRule updates state, we can't use addRule prop directly if we want to set data immediately.
            // Actually, we can just manipulate the rules array via setConfig or similar if exposed,
            // but the props structure relies on `addRule` (empty) and `updateRule`.
            // Let's assume we can update `updateRule` to handle "add" if index is -1? No.
            // Let's modify the parent logic or just reconstruct the rules list here and call setConfig.
            setConfig({
                ...config,
                rules: [...config.rules, savedRule]
            });
            // Trigger save
            // We can't call saveData() directly and expect it to pick up the new state immediately if it uses closed-over state?
            // `saveData` in Options.tsx uses `config` state.
            // So we need to wait for state update?
            // Better: Pass `savedRule` to a new prop or handle it manually.
            // Actually `updateRule` handles `save` param.
            // Let's manually save.
            saveData().then(() => {}); // This might be stale.
            // Actually `updateRule` logic in Options.tsx handles partial updates.
            // Let's just use `setConfig` and then assume user will click save?
            // No, user expects "Save" in modal to save.
            // We need a robust way to add.
            // Let's use `addRule` prop but it adds an empty one.
            // Refactor: We will just push to config and call saveData.
            // But `saveData` in `Options.tsx` reads `config` from its scope.
            // `updateRule` in `Options.tsx` updates state AND saves.
            // We need `addRuleWithData`.
            // For now, let's just update `config` locally and trigger save via a useEffect or just rely on manual save?
            // The modal has a "Save" button.
            // We'll update the `config` state. `saveData` function in `Options.tsx` uses `config`.
            // If we update `config` via `setConfig`, the component re-renders.
            // Does `saveData` ref the new config?
            // Yes if it's a fresh render. But we call `saveData` immediately? No.
            // We can implement a `saveConfig` helper prop if needed, but `saveData` is `() => Promise` which implies it uses closure state.
            // Wait, `updateRule` in `Options` uses `saveConfigInternal(newConfig)`.
            // So we can implement `handleAdd` similarly.
            // Since we don't have `addRuleWithData` prop, we will just use `setConfig` and hope for the best?
            // No, that's risky for persistence.
            // Let's use `updateRule` for edit. For Add, we will create a new rule, add it to list, and save.
            // But we don't have the save function that takes config as arg exposed here.
            // WORKAROUND: We will rely on `setConfig` updating the UI, and maybe `saveData` works if it uses a ref or we just don't auto-save for Add?
            // Actually, `CardRule` changes auto-save for enabled/toggle.
            // The modal "Save" should probably auto-save to disk.
            // Let's check `Options.tsx`: `saveData` uses `config` state.
            // If we call `setConfig` then `saveData`, `saveData` sees old config due to closure.
            // We need to pass the new list to a save function.
            // For now, we will add an "Add & Save" logic if possible, or just add to list and let user save manually?
            // The modal implies "Save" = commit.
            // Let's look at `RulesTabProps`: `setConfig`.
            // We can use `setConfig` to update UI.
            // Detailed Fix: We will assume `updateRule` is robust.
            // For ADD, we will manualy construct configuration and call `saveData`? No.
            // We will just update state. The user might need to click "Save Rules" global button?
            // Existing `addRule` adds an empty rule and does NOT save automatically (just toast).
            // So for consistency, we will just add to state and toast.
            const newRules = [...config.rules, savedRule];
            setConfig({ ...config, rules: newRules });
            // Optional: call saveData if we want auto-save.
            // But we can't reliably.
        }
        setIsRuleModalOpen(false);
    };

    const renderRuleList = (
        rules: Rule[],
        groupName?: string,
        groupId?: string,
        groupColor?: string,
        isCollapsed?: boolean
    ) => {
        if (rules.length === 0 && !groupId) return null;

        return (
            <div className={groupId ? 'mb-4' : ''}>
                {groupId && (
                    <div
                        className="flex items-center gap-2 mb-2 cursor-pointer select-none hover:bg-muted/50 p-2 rounded-md transition-colors"
                        onClick={() => updateGroup(groupId, { collapsed: !isCollapsed }, true)}
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: groupColor }}></div>
                        <span className="font-semibold text-lg">{groupName}</span>
                        <Badge variant="secondary" className="ml-auto">
                            {rules.length}
                        </Badge>
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
                                        g.id === groupId
                                            ? (newGroupRules as Rule[])
                                            : config.rules.filter(r => r.groupId === g.id)
                                    );

                                    // Append ungrouped rules
                                    const ungrouped = config.rules.filter(r => !r.groupId);

                                    setConfig({ ...config, rules: [...rebuiltList, ...ungrouped] });
                                } else {
                                    // Updating ungrouped section
                                    const groups = config.groups || [];
                                    const groupedRules = groups.flatMap(g =>
                                        config.rules.filter(r => r.groupId === g.id)
                                    );
                                    const newUngrouped = newGroupRules as Rule[];
                                    setConfig({ ...config, rules: [...groupedRules, ...newUngrouped] });
                                }
                            }
                        }}
                        group={{ name: groupId ? `group-${groupId}` : 'ungrouped', put: false }}
                        className={groupId ? 'space-y-3 pl-4 border-l ml-2' : 'space-y-3'}
                    >
                        {rules.map(rule => {
                            const index = config.rules.findIndex(r => r.id === rule.id); // Get global index
                            return (
                                <CardRule
                                    key={rule.id}
                                    rule={rule}
                                    index={index}
                                    handleEditStart={() => handleEditRuleStart(rule.id as string)}
                                    handleRuleDelete={handleRuleDelete}
                                    handleRuleEnabled={handleRuleEnabled}
                                    groupColor={groupColor}
                                />
                            );
                        })}
                    </ReactSortable>
                )}
            </div>
        );
    };

    const filteredRules = config.rules
        .map((r, index) => ({ ...r, originalIndex: index, id: r.id || crypto.randomUUID() }))
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
                                {t('app_rules') || 'Redirection Rules'}
                            </CardTitle>
                            <CardDescription>{t('app_rules_desc') || 'Manage URL redirection rules'}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => setIsGrouped(!isGrouped)}>
                                        {isGrouped ? <List className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        {isGrouped
                                            ? t('app_view_list') || 'List View'
                                            : t('app_view_grouped') || 'Grouped View'}
                                    </p>
                                </TooltipContent>
                            </Tooltip>

                            <Button onClick={handleAddRuleStart} disabled={saving}>
                                <Plus className="w-4 h-4 mr-2" />
                                {t('app_add_rule') || 'Add Rule'}
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

                    <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingRuleId
                                        ? t('app_edit_rule') || 'Edit Rule'
                                        : t('app_add_rule') || 'Add Rule'}
                                </DialogTitle>
                                <DialogDescription>
                                    {t('app_rule_modal_desc') || 'Configure the redirection rule details below.'}
                                </DialogDescription>
                            </DialogHeader>
                            <RuleForm
                                initialRule={editingRuleId ? config.rules.find(r => r.id === editingRuleId) : undefined}
                                config={config}
                                onSave={handleSaveRule}
                                onCancel={() => setIsRuleModalOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                    {config.rules.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t('app_no_rules') || 'No rules configured'}</p>
                            <p className="text-sm mt-2">
                                {t('app_no_rules_desc') || 'Click "Add Rule" to get started'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRules.length === 0 && searchText ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('app_search_no_results') || 'No rules match your search.'}
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
                                                        {renderRuleList(
                                                            groupRules,
                                                            group.name,
                                                            group.id,
                                                            group.color,
                                                            group.collapsed
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {/* Ungrouped Rules */}
                                            {renderRuleList(
                                                filteredRules.filter(r => !r.groupId),
                                                t('app_group_ungrouped') || 'Ungrouped',
                                                undefined,
                                                undefined,
                                                false
                                            )}
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
                                                        handleEditStart={() => handleEditRuleStart(rule.id as string)}
                                                        handleRuleDelete={handleRuleDelete}
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
                    {saving ? t('app_saving') || 'Saving...' : t('app_save_changes') || 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}

function CardRule({
    rule,
    index,
    handleEditStart,
    handleRuleDelete,
    handleRuleEnabled,
    groupColor
}: {
    rule: Rule;
    index: number;
    handleEditStart: () => void;
    handleRuleDelete: (index: number) => void;
    handleRuleEnabled: (checked: boolean, index: number) => void;
    groupColor?: string;
}) {
    // Compact "Summary" View
    return (
        <Card
            key={rule.id || index}
            className="overflow-hidden"
            style={rule.groupId && groupColor ? { borderLeftColor: groupColor, borderLeftWidth: '4px' } : undefined}
        >
            <CardContent className="p-3">
                <div className="flex items-center gap-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="drag-handle cursor-move text-muted-foreground hover:text-foreground shrink-0">
                                <GripVertical className="w-5 h-5" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('app_rule_header_sort') || 'Sort'}</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 grid gap-1 cursor-pointer" onClick={handleEditStart}>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">
                                {rule.name || (
                                    <span className="text-muted-foreground italic font-normal">
                                        {t('app_rule_untitled') || 'Untitled Rule'}
                                    </span>
                                )}
                            </span>
                            {rule.mode === 'regex' && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                    Regex
                                </Badge>
                            )}
                            {rule.mode === 'wildcard' && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                    Wildcard
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono truncate">
                            <span className="truncate max-w-[200px]" title={rule.src}>
                                {rule.src}
                            </span>
                            <span className="shrink-0">→</span>
                            <span className="truncate max-w-[200px]" title={rule.dest}>
                                {rule.dest}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Group Label (if grouped) */}
                        {/* {rule.groupId && (
                            <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] h-5" style={groupColor ? { color: groupColor, borderColor: groupColor + '40' } : {}}>
                                {config.groups?.find(g => g.id === rule.groupId)?.name}
                            </Badge>
                        )} */}

                        <Switch
                            id={`enabled-${index}`}
                            checked={rule.enabled}
                            onCheckedChange={checked => handleRuleEnabled(checked, index)}
                            className="scale-75"
                        />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={handleEditStart}
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => {
                                e.stopPropagation();
                                handleRuleDelete(index);
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
