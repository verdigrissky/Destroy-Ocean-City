import { Injectable, signal, effect, inject } from '@angular/core';
import localProducts from '../data/products.json';
import slogansData from '../data/slogans.json';
import { ThemeService } from './theme-service';

@Injectable({ providedIn: 'root' })
export class SloganatorService {

  readonly displayText = signal<string>('');
  readonly fullText = signal<string>('');

  private theme = inject(ThemeService);
  private wasReduced = this.theme.reducedMotion();

  private slogans: string[] = [...localProducts.genericContent.slogans];
  private appSlogans: string[] = [...slogansData.slogans.appSloganator];
  private recentAppIndices: number[] = [];
  private currentText = '';
  private targetText = '';
  private recentIndices: number[] = [];
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private transitioning = false;
  private waiting = false;
  private pendingSlogans: string[] | null = null;

  constructor() {
    this.startTyping();

    effect(() => {
      const reduced = this.theme.reducedMotion();
      if (reduced === this.wasReduced) return;
      this.wasReduced = reduced;
      if (reduced) {
        this.settle();
      } else if (!this.waiting) {
        this.timeout = setTimeout(() => this.eraseStep(), 3500);
      }
    });
  }

  beginErase(): void {
    if (this.transitioning || this.waiting) return;
    this.clearTimer();
    this.transitioning = true;
    this.pendingSlogans = null;
    this.eraseStep();
  }

  transitionTo(slogans: string[]): void {
    this.pendingSlogans = [...slogans];
    if (this.waiting) {
      this.waiting = false;
      this.applyPendingAndStart();
    } else if (!this.transitioning) {
      this.clearTimer();
      this.transitioning = true;
      this.eraseStep();
    }
  }

  private applyPendingAndStart(): void {
    if (this.theme.reducedMotion()) { this.settle(); return; }
    if (this.pendingSlogans) {
      this.slogans = [...this.pendingSlogans];
      this.pendingSlogans = null;
      this.recentIndices = [];
    }
    this.transitioning = false;
    this.timeout = setTimeout(() => this.startTyping(), 500);
  }

  private startTyping(): void {
    this.targetText = this.pickNext();
    this.fullText.set(this.targetText);
    this.currentText = '';
    this.typeStep();
  }

  private typeStep(): void {
    if (this.theme.reducedMotion()) { this.settle(); return; }
    if (this.currentText.length < this.targetText.length) {
      this.currentText = this.targetText.slice(0, this.currentText.length + 1);
      this.displayText.set(this.currentText);
      this.timeout = setTimeout(() => this.typeStep(), 50);
    } else {
      this.timeout = setTimeout(() => this.eraseStep(), 3500);
    }
  }

  private eraseStep(): void {
    if (this.theme.reducedMotion()) { this.settle(); return; }
    if (this.currentText.length > 0) {
      this.currentText = this.currentText.slice(0, -1);
      this.displayText.set(this.currentText);
      this.timeout = setTimeout(() => this.eraseStep(), 28);
    } else if (this.transitioning) {
      if (this.pendingSlogans) {
        this.applyPendingAndStart();
      } else {
        this.waiting = true;
      }
    } else {
      this.timeout = setTimeout(() => this.startTyping(), 500);
    }
  }

  private settle(): void {
    this.clearTimer();
    if (this.pendingSlogans) {
      this.slogans = [...this.pendingSlogans];
      this.pendingSlogans = null;
      this.recentIndices = [];
      this.transitioning = false;
      this.waiting = false;
      this.targetText = this.pickNext();
    } else if (this.transitioning || this.waiting) {
      this.transitioning = false;
      this.waiting = true;
      this.currentText = '';
      this.displayText.set('');
      this.fullText.set('');
      return;
    } else if (!this.targetText) {
      this.targetText = this.pickNext();
    }
    this.currentText = this.targetText;
    this.displayText.set(this.currentText);
    this.fullText.set(this.targetText);
  }

  private clearTimer(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  pickNextAppSlogan(): string {
    if (!this.appSlogans.length) return '';
    let idx: number;
    do {
      idx = Math.floor(Math.random() * this.appSlogans.length);
    } while (this.recentAppIndices.includes(idx) && this.appSlogans.length > this.recentAppIndices.length);
    this.recentAppIndices.push(idx);
    if (this.recentAppIndices.length > 3) this.recentAppIndices.shift();
    return this.appSlogans[idx];
  }

  private pickNext(): string {
    if (!this.slogans.length) return '';
    let idx: number;
    do {
      idx = Math.floor(Math.random() * this.slogans.length);
    } while (this.recentIndices.includes(idx) && this.slogans.length > this.recentIndices.length);
    this.recentIndices.push(idx);
    if (this.recentIndices.length > 3) this.recentIndices.shift();
    return this.slogans[idx];
  }

}
