import { Component, ElementRef, ViewChild, inject, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { SloganatorService } from '../services/sloganator-service';

const WING_MS = 500;
const FADE_MS = 350;
const REST_MS = 3500;

@Component({
  selector: 'sloganator',
  imports: [],
  template: `
    <div class="d-flex justify-content-center align-items-center mt-4 w-100 cursor-default user-select-none slogan-row">
      <i class="bi bi-filter-right text-muted wing-icon"></i>
      <div class="slogan-container" [style.width.px]="containerWidth">
        <small class="text-muted monospace slogan-text" [style.opacity]="sloganOpacity">{{ displaySlogan }}</small>
      </div>
      <i class="bi bi-filter-left text-muted wing-icon"></i>
    </div>
    <small #measurer class="slogan-measurer monospace">{{ measureSlogan }}</small>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .slogan-row { gap: 6px; }
    .slogan-container {
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      transition: width 500ms ease-in-out;
    }
    .slogan-text {
      display: block;
      white-space: nowrap;
      transition: opacity 350ms ease;
    }
    .wing-icon { opacity: 0.5; }
    .slogan-measurer {
      position: fixed;
      left: -9999px;
      top: -9999px;
      white-space: nowrap;
      pointer-events: none;
      visibility: hidden;
    }
  `]
})
export class Sloganator implements AfterViewInit, OnDestroy {
  @ViewChild('measurer') private measurerRef!: ElementRef<HTMLSpanElement>;

  protected displaySlogan = '';
  protected measureSlogan = '';
  protected sloganOpacity = 0;
  protected containerWidth = 0;

  private service = inject(SloganatorService);
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    this.timer = setTimeout(() => this.beginCycle(), 300);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  private beginCycle(): void {
    const slogan = this.service.pickNextAppSlogan();
    this.displaySlogan = slogan;
    this.measureSlogan = slogan;
    // tick for measurer to render, then read width → wings expand → fade in
    this.timer = setTimeout(() => {
      this.containerWidth = this.measurerRef.nativeElement.offsetWidth;
      this.timer = setTimeout(() => {
        this.sloganOpacity = 1;
        this.timer = setTimeout(() => this.scheduleRest(), FADE_MS);
      }, WING_MS);
    }, 0);
  }

  private scheduleRest(): void {
    this.timer = setTimeout(() => {
      this.sloganOpacity = 0;
      // after fade out, swap to next slogan and repeat
      this.timer = setTimeout(() => this.beginCycle(), FADE_MS);
    }, REST_MS);
  }
}
