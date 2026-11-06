import { TestBed } from '@angular/core/testing';

import { SloganatorService } from './sloganator-service';
import { ThemeService } from './theme-service';

describe('SloganatorService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {} }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const create = (reduced: boolean) => {
    localStorage.setItem('reduceMotion', reduced ? 'on' : 'off');
    const service = TestBed.inject(SloganatorService);
    const theme = TestBed.inject(ThemeService);
    return { service, theme };
  };

  it('types the slogan one character at a time normally', () => {
    const { service } = create(false);
    const full = service.fullText();
    expect(full.length).toBeGreaterThan(1);
    vi.advanceTimersByTime(50);
    expect(service.displayText().length).toBeLessThan(full.length);
  });

  it('shows the complete slogan and holds it with reduced motion', () => {
    const { service } = create(true);
    const full = service.fullText();
    expect(full.length).toBeGreaterThan(0);
    expect(service.displayText()).toBe(full);
    vi.advanceTimersByTime(20000);
    expect(service.displayText()).toBe(full);
  });

  it('jumps to the complete slogan when reduced motion turns on mid-typing, and resumes when it turns off', () => {
    const { service, theme } = create(false);
    vi.advanceTimersByTime(50);
    theme.toggleReducedMotion();
    TestBed.tick();
    const full = service.fullText();
    expect(service.displayText()).toBe(full);
    vi.advanceTimersByTime(20000);
    expect(service.displayText()).toBe(full);

    theme.toggleReducedMotion();
    TestBed.tick();
    vi.advanceTimersByTime(3499);
    expect(service.displayText()).toBe(full);
    vi.advanceTimersByTime(1);
    expect(service.displayText().length).toBe(full.length - 1);
    vi.advanceTimersByTime(28);
    expect(service.displayText().length).toBe(full.length - 2);
  });

  it('shows the new slogans immediately on a store transition with reduced motion', () => {
    const { service } = create(true);
    service.beginErase();
    expect(service.displayText()).toBe('');
    service.transitionTo(['Buy the hat']);
    expect(service.displayText()).toBe('Buy the hat');
  });
});
