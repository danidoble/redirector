
import {
    Settings,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ModeToggle } from '../../components/mode-toggle';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '../../components/ui/tooltip';
import { t } from '../../utils/i18n';
import type { ConfigState } from '../../Options';
import type { Rule, RuleGroup } from '../../types/background';
import { Footer } from '../Footer';
import { Donation } from '../Donation';

interface MiniModeProps {
    config: ConfigState;
    updateGroup: (id: string, updates: Partial<RuleGroup>, save?: boolean) => void;
    updateRule: (index: number, updates: Partial<Rule>, save?: boolean) => void;
}

export function MiniMode({
    config,
    updateGroup,
    updateRule,
}: MiniModeProps) {



    return (
         <div className="min-h-0 h-150 bg-background p-4 w-full flex flex-col">
            <div className="shrink-0 flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                     <img src="/img/icon-48.png" className="w-8 h-8" />
                     <span className="font-bold">Redirector</span>
                 </div>
                 <div className="flex gap-2">
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
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => chrome.runtime.openOptionsPage()}>
                                <Settings className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('tooltip_settings') || 'Open Settings'}</p>
                        </TooltipContent>
                    </Tooltip>
                 </div>
            </div>
            <Donation className="shrink-0 px-0 mt-0 mb-2" classNameText="text-sm" />
            
            <main className="flex-grow mt-4 space-y-4">
                {config.groups?.map(group => (
                    <Card key={group.id} className="p-2">
                       <div className="flex items-center justify-between">
                           <Tooltip>
                               <TooltipTrigger asChild>
                                   <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => {
                                        updateGroup(group.id, {collapsed: !group.collapsed}, true);
                                   }}>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          {group.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </Button>
                                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: group.color}}></div>
                                      <span className="font-medium">{group.name}</span>
                                   </div>
                               </TooltipTrigger>
                               <TooltipContent>
                                   <p>{group.collapsed ? (t('tooltip_expand') || 'Expand') : (t('tooltip_collapse') || 'Collapse')}</p>
                               </TooltipContent>
                           </Tooltip>

                           <Tooltip>
                               <TooltipTrigger asChild>
                                   <div>
                                       <Switch checked={group.enabled} onCheckedChange={(c) => {
                                           updateGroup(group.id, {enabled: c}, true);
                                       }} />
                                   </div>
                               </TooltipTrigger>
                               <TooltipContent>
                                   <p>{group.enabled ? (t('tooltip_disable_group') || 'Disable Group') : (t('tooltip_enable_group') || 'Enable Group')}</p>
                               </TooltipContent>
                           </Tooltip>
                       </div>
                       {!group.collapsed && (
                           <div className="mt-2 space-y-2 pl-4 border-l ml-1.5 pt-2">
                               {config.rules.filter(r => r.groupId === group.id).map((rule) => (
                                   <div key={rule.id} className="flex items-center justify-between text-sm">
                                       <span className="truncate flex-1 pr-2" title={rule.name || rule.src}>
                                           {rule.name || rule.src}
                                       </span>
                                       <Tooltip>
                                           <TooltipTrigger asChild>
                                               <div>
                                                   <Switch className="h-4 w-8" checked={rule.enabled} onCheckedChange={(c) => {
                                                       updateRule(config.rules.indexOf(rule), {enabled: c}, true);
                                                   }} />
                                               </div>
                                           </TooltipTrigger>
                                           <TooltipContent>
                                               <p>{rule.enabled ? (t('tooltip_disable_rule') || 'Disable Rule') : (t('tooltip_enable_rule') || 'Enable Rule')}</p>
                                           </TooltipContent>
                                       </Tooltip>
                                   </div>
                               ))}
                           </div>
                       )}
                    </Card>
                ))}
                
                {config.rules.filter(r => !r.groupId).length > 0 && (
                    <Card className="p-2">
                        <div className="font-medium mb-2 text-muted-foreground flex justify-between items-center">
                            <span>Ungrouped</span>
                            <Badge variant="secondary">{config.rules.filter(r => !r.groupId).length}</Badge>
                        </div>
                        <div className="space-y-2">
                           {config.rules.filter(r => !r.groupId).map((rule) => (
                               <div key={rule.id} className="flex items-center justify-between text-sm">
                                   <span className="truncate flex-1 pr-2" title={rule.name || rule.src}>
                                       {rule.name || rule.src}
                                   </span>
                                   <Tooltip>
                                       <TooltipTrigger asChild>
                                           <div>
                                               <Switch className="h-4 w-8" checked={rule.enabled} onCheckedChange={(c) => {
                                                   updateRule(config.rules.indexOf(rule), {enabled: c}, true);
                                               }} />
                                           </div>
                                       </TooltipTrigger>
                                       <TooltipContent>
                                           <p>{rule.enabled ? (t('tooltip_disable_rule') || 'Disable Rule') : (t('tooltip_enable_rule') || 'Enable Rule')}</p>
                                       </TooltipContent>
                                   </Tooltip>
                               </div>
                           ))}
                        </div>
                    </Card>
                )}

                {config.rules.length === 0 && (!config.groups || config.groups.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">
                        No rules found.
                    </div>
                )}
            </main>

            
            <Footer className="shrink-0" />
         </div>
    );
}
