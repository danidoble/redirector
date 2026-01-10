import cn from 'clsx';

export function Footer({ className }: { className?: string }) {
    return (
        <footer className={cn('border-t border-muted', className)}>
            <div className="container max-w-7xl mx-auto px-4 py-2 text-center text-sm text-muted-foreground">
                Created by{' '}
                <a href="https://github.com/danidoble" target="_blank">
                    danidoble
                </a>
                . © {new Date().getFullYear()}
            </div>
        </footer>
    );
}
