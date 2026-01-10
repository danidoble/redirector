import cn from 'clsx';
import { Card, CardContent } from './ui/card';
import { Coffee } from 'lucide-react';
import { t } from '@/utils/i18n';

export function Donation({ className, classNameText }: { className?: string, classNameText?: string }) {
    return (
        <div className={cn('container max-w-7xl mx-auto', className)}>
            <a
                href="https://buymeacoffee.com/danidoble"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
                <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-950/40 py-2">
                    <CardContent className={cn('flex items-center justify-center px-4 py-2 gap-3 text-yellow-700 dark:text-yellow-400 font-medium text-lg', classNameText)}>
                        <Coffee className="w-5 h-5" />
                        {t('app_buy_coffee')}
                    </CardContent>
                </Card>
            </a>
        </div>
    );
}
