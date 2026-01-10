import {
    HelpCircle,
    ExternalLink,
    Code,
    Zap,
    Hash,
    Link as LinkIcon
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { t } from "../utils/i18n";

export function HelpDialog() {
    return (
        <Dialog >
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <HelpCircle className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl h-[85vh] min-h-0 flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <HelpCircle className="w-6 h-6 text-primary" />
                        {t('help_title') || 'Redirector Help'}
                    </DialogTitle>
                    <DialogDescription>
                        {t('help_desc') || 'Learn how to create powerful redirection rules using different matching modes.'}
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-6 pt-0 space-y-8 pb-4">
                        {/* Static Mode */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/5">
                                    <Zap className="w-3 h-3 mr-1" />
                                    {t('mode_static') || 'Static'}
                                </Badge>
                                <h3 className="text-lg font-bold">{t('help_static_title') || 'Exact Match'}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('help_static_desc') || 'The simplest mode. It matches the source URL exactly as written.'}
                            </p>
                            <div className="bg-muted/50 p-4 rounded-lg border space-y-2 text-sm">
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                    <span className="font-semibold text-muted-foreground">{t('help_input_rule') || 'Input (Source URL)'}:</span>
                                    <code className="text-primary truncate font-mono">https://google.com</code>
                                </div>
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                    <span className="font-semibold text-muted-foreground">{t('help_destination_rule') || 'Redirect to (Destination)'}:</span>
                                    <code className="text-primary truncate font-mono">https://bing.com</code>
                                </div>
                                <div className="pt-2 border-t mt-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <ExternalLink className="w-3 h-3" />
                                        <span>{t('help_example_result') || 'Example result'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center font-mono text-xs">
                                        <span className="line-through opacity-50">...google.com</span>
                                        <span className="text-primary">→</span>
                                        <span className="font-bold">...bing.com</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Wildcard Mode */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/5">
                                    <Hash className="w-3 h-3 mr-1" />
                                    {t('mode_wildcard') || 'Wildcard'}
                                </Badge>
                                <h3 className="text-lg font-bold">{t('help_wildcard_title') || 'Simple Patterns'}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('help_wildcard_desc') || 'Use "*" to match any text. Each "*" value is available as $1, $2, etc., in the destination.'}
                            </p>
                            <div className="bg-muted/50 p-4 rounded-lg border space-y-2 text-sm">
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                    <span className="font-semibold text-muted-foreground">{t('help_input_rule') || 'Input (Source URL)'}:</span>
                                    <code className="text-primary truncate font-mono">https://*.wikipedia.org/wiki/*</code>
                                </div>
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                    <span className="font-semibold text-muted-foreground">{t('help_destination_rule') || 'Redirect to (Destination)'}:</span>
                                    <code className="text-primary truncate font-mono">https://$1.m.wikipedia.org/wiki/$2</code>
                                </div>
                                <div className="pt-2 border-t mt-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <ExternalLink className="w-3 h-3" />
                                        <span>{t('help_example_result') || 'Example result'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center font-mono text-xs">
                                        <span className="line-through opacity-50">https://en.wikipedia.org/wiki/Cat</span>
                                        <span className="text-primary">→</span>
                                        <span className="font-bold text-primary">https://en.m.wikipedia.org/wiki/Cat</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* URL Pattern Mode */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/5">
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                    {t('mode_url_pattern') || 'URL Pattern'}
                                </Badge>
                                <h3 className="text-lg font-bold">{t('help_pattern_title') || 'Named Parameters'}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('help_pattern_desc') || 'Capture specific parts of the URL using ":name". Use {{name}} in the destination to insert them.'}
                            </p>
                            <div className="bg-muted/50 p-4 rounded-lg border space-y-2 text-sm">
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                    <span className="font-semibold text-muted-foreground">{t('help_input_rule') || 'Input (Source URL)'}:</span>
                                    <code className="text-primary truncate font-mono">https://github.com/:user/:repo</code>
                                </div>
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                    <span className="font-semibold text-muted-foreground">{t('help_destination_rule') || 'Redirect to (Destination)'}:</span>
                                    <code className="text-primary truncate font-mono">https://gitlab.com/{"{{user}}"}/{"{{repo}}"}</code>
                                </div>
                                <div className="pt-2 border-t mt-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <ExternalLink className="w-3 h-3" />
                                        <span>{t('help_example_result') || 'Example result'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center font-mono text-xs">
                                        <span className="line-through opacity-50">...github.com/danidoble/redirector</span>
                                        <span className="text-primary">→</span>
                                        <span className="font-bold text-primary">...gitlab.com/danidoble/redirector</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Regex Mode */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/5">
                                    <Code className="w-3 h-3 mr-1" />
                                    {t('mode_regex') || 'Regex'}
                                </Badge>
                                <h3 className="text-lg font-bold">{t('help_regex_title') || 'Regular Expressions'}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('help_regex_desc') || 'Full power of JavaScript Regular Expressions. Use capture groups () and $1, $2 to reference them.'}
                            </p>
                            <div className="bg-muted/50 p-4 rounded-lg border space-y-2 text-sm">
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                    <span className="font-semibold text-muted-foreground">{t('help_input_rule') || 'Input (Source URL)'}:</span>
                                    <code className="text-primary truncate font-mono">^https://.*\.amazon\.com/dp/([A-Z0-9]{10}).*</code>
                                </div>
                                <div className="grid grid-cols-[160px_1fr] gap-2">
                                    <span className="font-semibold text-muted-foreground">{t('help_destination_rule') || 'Redirect to (Destination)'}:</span>
                                    <code className="text-primary truncate font-mono">https://smile.amazon.com/dp/$1</code>
                                </div>
                                <div className="pt-2 border-t mt-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <ExternalLink className="w-3 h-3" />
                                        <span>{t('help_example_result') || 'Example result'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center font-mono text-xs">
                                        <span className="line-through opacity-50">...amazon.com/dp/B00X4WHP5E/...</span>
                                        <span className="text-primary">→</span>
                                        <span className="font-bold text-primary">...smile.amazon.com/dp/B00X4WHP5E</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="border-t pt-8" />

                        {/* Decoding Section */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                    <Code className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold">{t('help_decode_title') || 'Decoding Parameters'}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('help_decode_desc') || 'When enabled, captured values (like $1 or {{name}}) will be decoded (URI unescaped) before being inserted into the destination.'}
                            </p>
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 text-sm">
                                <p className="text-xs font-medium text-primary mb-2 uppercase tracking-wider">{t('help_example_result') || 'Example result'}:</p>
                                <div className="space-y-1">
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground">Encoded:</span>
                                        <code className="font-mono">https%3A%2F%2Fgoogle.com</code>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-primary font-bold">Decoded:</span>
                                        <code className="font-mono bg-background px-1.5 py-0.5 rounded border">https://google.com</code>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-muted-foreground italic">
                                    {t('help_decode_example_desc') || "For example, if the URL contains '%3A%2F%2F', decoding will convert it to '://'."}
                                </p>
                            </div>
                        </section>

                        {/* Groups Section */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                    <Hash className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold">{t('help_groups_title') || 'Rule Groups'}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('help_groups_desc') || 'Groups allow you to organize your rules. Disabling a group will disable all rules within it.'}
                            </p>
                        </section>

                        {/* General Tips */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold">{t('help_tips_title') || 'General Tips'}</h3>
                            </div>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                <li>{t('help_tips_order') || 'Order matters: Rules are processed from top to bottom. The first rule that matches will be applied.'}</li>
                                <li>{t('help_tips_testing') || "Test your rules: Use the 'Test URL' field in the rule editor to verify your patterns before saving."}</li>
                            </ul>
                        </section>
                    </div>
                </ScrollArea>
                
                <div className="p-4 border-t bg-muted/20 flex justify-end">
                    <Button variant="default" onClick={() => (document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement)?.click()}>
                        {t('app_close') || 'Close'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
