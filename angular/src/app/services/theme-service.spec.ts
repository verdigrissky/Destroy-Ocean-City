import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme-service';

let browserReducesMotion = false;
let browserIsDark = false;

const stubMatchMedia = () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduced-motion') ? browserReducesMotion : query.includes('dark') ? browserIsDark : false,
    addEventListener: () => {},
  }));
};

const themeHref = () => document.getElementById('theme')?.getAttribute('href') ?? '';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('reduce-motion');
  document.getElementById('theme')?.remove();
  browserReducesMotion = false;
  browserIsDark = false;
  stubMatchMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ThemeService themes', () => {
  it('uses the charcoal Dark theme on Automatic when the OS is dark', () => {
    browserIsDark = true;
    const theme = TestBed.inject(ThemeService);
    expect(theme.currentThemeSetting()).toBe('auto');
    expect(theme.currentTheme()).toBe('dark');
    expect(themeHref()).toContain('theme-dark.css');
  });

  it('loads the Black theme when chosen and remembers it', () => {
    const theme = TestBed.inject(ThemeService);
    theme.setTheme('black');
    expect(theme.currentTheme()).toBe('black');
    expect(themeHref()).toContain('theme-black.css');
    expect(localStorage.getItem('themeSetting')).toBe('black');
  });

  it('migrates a saved legacy "forceDark" (the old black theme) to Black', () => {
    localStorage.setItem('themeSetting', 'forceDark');
    const theme = TestBed.inject(ThemeService);
    expect(theme.currentThemeSetting()).toBe('black');
    expect(localStorage.getItem('themeSetting')).toBe('black');
  });

  it('migrates a saved legacy "forceLight" to Light', () => {
    localStorage.setItem('themeSetting', 'forceLight');
    const theme = TestBed.inject(ThemeService);
    expect(theme.currentThemeSetting()).toBe('light');
  });

  it('falls back to Automatic for an unknown saved value', () => {
    localStorage.setItem('themeSetting', 'neon');
    const theme = TestBed.inject(ThemeService);
    expect(theme.currentThemeSetting()).toBe('auto');
  });
});

describe('ThemeService reduced motion', () => {
  it('turns on automatically when the browser asks for reduced motion', () => {
    browserReducesMotion = true;
    const theme = TestBed.inject(ThemeService);
    expect(theme.reducedMotion()).toBe(true);
    expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
  });

  it('stays off when the browser has no preference', () => {
    const theme = TestBed.inject(ThemeService);
    expect(theme.reducedMotion()).toBe(false);
    expect(document.documentElement.classList.contains('reduce-motion')).toBe(false);
  });

  it('lets the visitor turn it off, and remembers that over the browser flag', () => {
    browserReducesMotion = true;
    const theme = TestBed.inject(ThemeService);
    theme.toggleReducedMotion();
    expect(theme.reducedMotion()).toBe(false);
    expect(document.documentElement.classList.contains('reduce-motion')).toBe(false);
    expect(localStorage.getItem('reduceMotion')).toBe('off');
  });

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const theme = TestBed.inject(ThemeService);
    expect(() => theme.toggleReducedMotion()).not.toThrow();
    vi.restoreAllMocks();
  });
});
