import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LightboxComponent } from './lightbox';

@Component({
  imports: [ LightboxComponent ],
  template: `
    <button id="opener" (click)="open.set(true)">Open</button>
    @if (open()) {
      <app-lightbox [images]="images" label="Gallery" alt="Hat" (close)="open.set(false)"></app-lightbox>
    }
  `
})
class Host {
  open = signal(false);
  images = ['a.png', 'b.png', 'c.png'];
}

describe('LightboxComponent', () => {
  const setup = () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    document.body.appendChild(el);
    const opener = el.querySelector<HTMLButtonElement>('#opener')!;
    opener.focus();
    opener.click();
    fixture.detectChanges();
    return { fixture, el, opener };
  };

  it('moves focus into the dialog and labels it', () => {
    const { el } = setup();
    const dialog = el.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-label')).toBe('Gallery');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close');
    expect(el.querySelector('img')!.getAttribute('alt')).toBe('Hat, image 1 of 3');
  });

  it('wraps Tab focus inside the dialog', () => {
    const { el } = setup();
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'));
    const last = buttons[buttons.length - 1];
    last.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('returns focus to the opener when closed', () => {
    const { fixture, el, opener } = setup();
    el.querySelector<HTMLButtonElement>('[aria-label="Close"]')!.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
