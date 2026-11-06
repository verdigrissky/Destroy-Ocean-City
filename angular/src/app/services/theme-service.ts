import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'black';
export type ThemeSetting = 'auto' | Theme;

const LEGACY_SETTINGS: Record<string, ThemeSetting> = { forceLight: 'light', forceDark: 'black' };
const THEME_SETTINGS: ThemeSetting[] = ['auto', 'light', 'dark', 'black'];
const THEME_BAR_COLORS: Record<Theme, string> = { light: '#212529', dark: '#141518', black: '#000000' };

@Injectable({ providedIn: 'root' })
export class ThemeService {
    currentTheme = signal <Theme> ('light');
    currentThemeSetting = signal <ThemeSetting> ('auto');
    reducedMotion = signal <boolean> (false);

    private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    private motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    constructor() {
        this.setTheme(this.savedThemeSetting(), false);

        this.mediaQuery.addEventListener('change', () => {
            if (this.currentThemeSetting() === 'auto') {
                this.loadTheme(this.mediaQuery.matches ? 'dark' : 'light');

            }
        });

        const savedMotion = this.readStorage('reduceMotion');
        this.setReducedMotion(savedMotion ? savedMotion === 'on' : this.motionQuery.matches, false);

        this.motionQuery.addEventListener('change', () => {
            if (!this.readStorage('reduceMotion')) {
                this.setReducedMotion(this.motionQuery.matches, false);

            }
        });

    }

    setTheme(themeSetting: ThemeSetting, persist: boolean = true) {
        this.currentThemeSetting.set(themeSetting);

        if (themeSetting === 'auto') {
            const osTheme: Theme = this.mediaQuery.matches ? 'dark' : 'light';
            this.loadTheme(osTheme);

        } else {
            this.loadTheme(themeSetting);

        }

        if (persist) {
            this.writeStorage('themeSetting', themeSetting);

        }

    }

    toggleReducedMotion() {
        this.setReducedMotion(!this.reducedMotion());

    }

    setReducedMotion(reduce: boolean, persist: boolean = true) {
        this.reducedMotion.set(reduce);
        document.documentElement.classList.toggle('reduce-motion', reduce);

        if (persist) {
            this.writeStorage('reduceMotion', reduce ? 'on' : 'off');

        }

    }

    private savedThemeSetting(): ThemeSetting {
        const saved = this.readStorage('themeSetting');
        if (!saved) return 'auto';
        if (saved in LEGACY_SETTINGS) {
            const migrated = LEGACY_SETTINGS[saved];
            this.writeStorage('themeSetting', migrated);
            return migrated;

        }
        return THEME_SETTINGS.includes(saved as ThemeSetting) ? saved as ThemeSetting : 'auto';

    }

    private loadTheme(theme: Theme) {
        let link = document.getElementById('theme') as HTMLLinkElement | null;

        if (!link) {
            link = document.createElement('link');
            link.id = 'theme';
            link.rel = 'stylesheet';
            document.head.appendChild(link);

        }

        const href = new URL(`theme-${theme}.css`, document.baseURI).toString();
        if (link.href !== href) {
            link.onerror = theme === 'light' ? null : () => this.loadTheme('light');
            link.href = href;

        }
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_BAR_COLORS[theme]);
        this.currentTheme.set(theme);

    }

    private readStorage(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }

    }

    private writeStorage(key: string, value: string) {
        try {
            localStorage.setItem(key, value);
        } catch {}

    }

}
