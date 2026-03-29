import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { t } from '../../utils/i18n';
import type { Rule, RuleMode } from '../../types/background';
import type { ConfigState } from '../../Options';
import { matchRule } from '../../utils/matcher';

interface RuleFormProps {
    initialRule?: Partial<Rule>;
    config: ConfigState;
    onSave: (rule: Rule) => void;
    onCancel: () => void;
}

export function RuleForm({ initialRule, config, onSave, onCancel }: RuleFormProps) {
    const [rule, setRule] = useState<Rule>({
        id: crypto.randomUUID(),
        enabled: true,
        mode: 'static',
        regex: false,
        src: '',
        dest: '',
        color: undefined,
        groupId: undefined,
        name: '',
        testUrl: '',
        shouldDecode: false,
        ...initialRule
    });

    const handleChange = (field: keyof Rule, value: any) => {
        setRule(prev => ({ ...prev, [field]: value }));
    };

    const handleModeChange = (value: RuleMode) => {
        setRule(prev => ({
            ...prev,
            mode: value,
            regex: value === 'regex'
        }));
    };

    return (
        <div className="grid gap-6 py-4">
            {/* Name and Group Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">{t('app_rule_name') || 'Name'}</Label>
                    <Input
                        id="name"
                        value={rule.name || ''}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder={t('app_rule_name_placeholder') || 'Rule Name'}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="group">{t('app_rule_group') || 'Group'}</Label>
                    <Select
                        value={rule.groupId || 'none'}
                        onValueChange={v => handleChange('groupId', v === 'none' ? undefined : v)}
                    >
                        <SelectTrigger id="group">
                            <SelectValue placeholder={t('app_select_group') || 'Select group'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">{t('app_group_none') || 'None'}</SelectItem>
                            {config.groups?.map(g => (
                                <SelectItem key={g.id} value={g.id}>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: g.color }}
                                        ></div>
                                        {g.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Source and Destination */}
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="src">{t('app_rule_header_source') || 'Source URL'}</Label>
                    <Textarea
                        id="src"
                        value={rule.src}
                        onChange={e => handleChange('src', e.target.value)}
                        placeholder={t('placeholder_source') || 'https://example.com/old'}
                        className="font-mono text-sm"
                        rows={2}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="dest">{t('app_rule_header_destination') || 'Destination URL'}</Label>
                    <Textarea
                        id="dest"
                        value={rule.dest}
                        onChange={e => handleChange('dest', e.target.value)}
                        placeholder={t('placeholder_destination') || 'https://example.com/new'}
                        className="font-mono text-sm"
                        rows={2}
                    />
                </div>
            </div>

            {/* Settings Row: Enabled, Mode, Decode */}
            <div className="flex flex-wrap items-center gap-6 p-4 border rounded-md bg-muted/20">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="enabled"
                        checked={rule.enabled}
                        onCheckedChange={checked => handleChange('enabled', checked)}
                    />
                    <Label htmlFor="enabled" className="cursor-pointer">
                        {t('app_rule_label_enabled') || 'Enabled'}
                    </Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Label htmlFor="mode">{t('app_rule_mode') || 'Mode:'}</Label>
                    <Select
                        value={rule.mode || (rule.regex ? 'regex' : 'static')}
                        onValueChange={v => handleModeChange(v as RuleMode)}
                    >
                        <SelectTrigger id="mode" className="w-[140px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="static">{t('mode_static') || 'Static'}</SelectItem>
                            <SelectItem value="wildcard">{t('mode_wildcard') || 'Wildcard'}</SelectItem>
                            <SelectItem value="url-pattern">{t('mode_url_pattern') || 'URL Pattern'}</SelectItem>
                            <SelectItem value="regex">{t('mode_regex') || 'Regex'}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="decode"
                        checked={rule.shouldDecode || false}
                        onCheckedChange={checked => handleChange('shouldDecode', checked)}
                    />
                    <Label htmlFor="decode" className="cursor-pointer">
                        {t('app_rule_header_decode') || 'Decode'}
                    </Label>
                </div>
            </div>

            {/* Test URL Section */}
            <div className="grid gap-2 pt-2 border-t">
                <Label htmlFor="testUrl" className="text-xs text-muted-foreground">
                    {t('app_test_match') || 'Test Rule Match'}
                </Label>
                <div className="flex gap-2 items-center">
                    <Input
                        id="testUrl"
                        placeholder={t('placeholder_test_url') || 'Enter test URL...'}
                        value={rule.testUrl || ''}
                        onChange={e => handleChange('testUrl', e.target.value)}
                        className="h-9 text-sm"
                    />
                    {rule.testUrl && (
                        <div
                            className={`text-xs px-3 py-1.5 rounded-md font-bold shrink-0 items-center flex ${
                                matchRule(rule, rule.testUrl)
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900'
                            }`}
                        >
                            {matchRule(rule, rule.testUrl)
                                ? t('app_match') || 'MATCH'
                                : t('app_no_match') || 'NO MATCH'}
                        </div>
                    )}
                </div>
                {rule.testUrl && matchRule(rule, rule.testUrl) && (
                    <div className="mt-1 p-3 rounded-md bg-muted text-sm break-all border">
                        <span className="font-semibold text-muted-foreground select-none block text-xs mb-1">
                            {t('app_test_result') || 'Result:'}
                        </span>
                        <div className="font-mono text-primary">{matchRule(rule, rule.testUrl)}</div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onCancel}>
                    {t('app_cancel') || 'Cancel'}
                </Button>
                <Button onClick={() => onSave(rule)}>{t('app_save') || 'Save'}</Button>
            </div>
        </div>
    );
}
