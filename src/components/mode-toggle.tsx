import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/utils/i18n';

export function ModeToggle() {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">{t('app_theme_toogle')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>{t('app_theme_light')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>{t('app_theme_dark')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>{t('app_theme_system')}</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
