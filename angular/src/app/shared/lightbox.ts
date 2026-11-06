import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-lightbox',
  template: `
    <div class="lightbox-backdrop" (click)="close.emit()">
      <div #frame class="lightbox-frame" role="dialog" aria-modal="true" [attr.aria-label]="label" (click)="$event.stopPropagation()" (keydown)="trapFocus($event)">
        <button #closeBtn type="button" class="lightbox-close cursor-pointer" (click)="close.emit()" aria-label="Close">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
        @if (images.length > 1) {
          <button type="button" class="lightbox-nav lightbox-prev" (click)="prev()" aria-label="Previous image">
            <i class="bi bi-chevron-left" aria-hidden="true"></i>
          </button>
        }
        <img #lbImg [src]="images[currentIndex]" class="lightbox-image" [class.transitioning]="isTransitioning" [alt]="imageAlt()" (load)="onImageLoad()" (error)="onImageLoad()">
        @if (images.length > 1) {
          <button type="button" class="lightbox-nav lightbox-next" (click)="next()" aria-label="Next image">
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
          <div class="lightbox-dots">
            @for (img of images; track $index) {
              <button type="button" class="lightbox-dot cursor-pointer" [class.active]="$index === currentIndex" [attr.aria-current]="$index === currentIndex ? 'true' : null" (click)="changeImage($index)" [attr.aria-label]="'Image ' + ($index + 1)"></button>
            }
          </div>
          <p class="visually-hidden" aria-live="polite">Image {{ currentIndex + 1 }} of {{ images.length }}</p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host {
      --lb-radius: 0.5rem;
    }

    .lightbox-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1050;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(3px);
      display: grid;
      place-items: center;
      padding: 1.25rem;
      animation: lb-fade-in 200ms ease;
    }

    .lightbox-frame {
      width: min(96vw, 1200px);
      max-height: 92vh;
      position: relative;
      display: grid;
      place-items: center;
      animation: lb-zoom-in 280ms cubic-bezier(0.34, 1.4, 0.64, 1);
    }

    .lightbox-image {
      max-width: 100%;
      max-height: 86vh;
      object-fit: contain;
      border-radius: var(--lb-radius);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .lightbox-image.transitioning {
      opacity: 0;
      transform: scale(0.95);
    }

    .lightbox-close {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      width: 2.4rem;
      height: 2.4rem;
      border: 0;
      border-radius: var(--lb-radius);
      background: rgba(0, 0, 0, 0.62);
      color: #fff;
      display: grid;
      place-items: center;
      z-index: 1;
    }

    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 2.8rem;
      height: 2.8rem;
      border: 0;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.52);
      color: #fff;
      display: grid;
      place-items: center;
      z-index: 1;
      cursor: pointer;
      transition: background 160ms ease, opacity 160ms ease;
    }

    .lightbox-nav:not(:disabled):hover {
      background: rgba(0, 0, 0, 0.78);
    }

    .lightbox-nav:disabled {
      opacity: 0.2;
      cursor: default;
    }

    .lightbox-prev { left: 0.5rem; }
    .lightbox-next { right: 0.5rem; }

    .lightbox-dots {
      position: absolute;
      bottom: -1.75rem;
      display: flex;
      gap: 0.5rem;
    }

    .lightbox-dot {
      width: 0.55rem;
      height: 0.55rem;
      border: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      padding: 0;
      transition: background 160ms ease;
    }

    .lightbox-dot.active {
      background: #fff;
    }

    @keyframes lb-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes lb-zoom-in {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }

    :host-context(html.reduce-motion) .lightbox-backdrop { animation: none; }
    :host-context(html.reduce-motion) .lightbox-frame    { animation: none; }
    :host-context(html.reduce-motion) .lightbox-image    { transition: none; }
  `]
})
export class LightboxComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() images: string[] = [];
  @Input() startIndex = 0;
  @Input() label = 'Image viewer';
  @Input() alt = '';
  @Output() close = new EventEmitter<void>();

  @ViewChild('lbImg') private imgRef!: ElementRef<HTMLImageElement>;
  @ViewChild('frame') private frameRef!: ElementRef<HTMLElement>;
  @ViewChild('closeBtn') private closeBtnRef!: ElementRef<HTMLButtonElement>;

  currentIndex = 0;
  isTransitioning = false;
  private priorBodyOverflow = '';
  private loadTimeout: ReturnType<typeof setTimeout> | null = null;
  private opener: HTMLElement | null = null;

  ngOnInit() {
    this.currentIndex = this.startIndex;
    this.opener = document.activeElement as HTMLElement | null;
    this.priorBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit() {
    this.closeBtnRef.nativeElement.focus();
  }

  ngOnDestroy() {
    document.body.style.overflow = this.priorBodyOverflow;
    if (this.loadTimeout) clearTimeout(this.loadTimeout);
    if (this.opener?.isConnected) this.opener.focus();
  }

  imageAlt(): string {
    const base = this.alt || this.label;
    return this.images.length > 1 ? `${base}, image ${this.currentIndex + 1} of ${this.images.length}` : base;
  }

  trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(this.frameRef.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  changeImage(index: number) {
    if (this.isTransitioning || index === this.currentIndex) return;
    this.isTransitioning = true;
    setTimeout(() => {
      this.currentIndex = index;
      this.loadTimeout = setTimeout(() => this.onImageLoad(), 5000);
    }, 200);
  }

  onImageLoad() {
    if (this.loadTimeout) { clearTimeout(this.loadTimeout); this.loadTimeout = null; }
    if (this.isTransitioning) this.isTransitioning = false;
  }

  prev() {
    this.changeImage((this.currentIndex - 1 + this.images.length) % this.images.length);
  }

  next() {
    this.changeImage((this.currentIndex + 1) % this.images.length);
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.close.emit(); }

  @HostListener('document:keydown.arrowleft')
  onLeft() { if (this.images.length > 1) this.prev(); }

  @HostListener('document:keydown.arrowright')
  onRight() { if (this.images.length > 1) this.next(); }
}
