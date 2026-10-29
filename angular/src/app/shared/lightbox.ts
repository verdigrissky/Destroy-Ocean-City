import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-lightbox',
  template: `
    <div class="lightbox-backdrop" (click)="close.emit()" role="dialog" aria-modal="true" aria-label="Image lightbox">
      <div class="lightbox-frame" (click)="$event.stopPropagation()">
        <button type="button" class="lightbox-close cursor-pointer" (click)="close.emit()" aria-label="Close lightbox">
          <i class="bi bi-x-lg"></i>
        </button>
        <button type="button" class="lightbox-nav lightbox-prev" (click)="prev()" [disabled]="images.length <= 1" aria-label="Previous image">
          <i class="bi bi-chevron-left"></i>
        </button>
        <img #lbImg [src]="images[currentIndex]" class="lightbox-image" [class.transitioning]="isTransitioning" alt="Product image" (load)="onImageLoad()" (error)="onImageLoad()">
        <button type="button" class="lightbox-nav lightbox-next" (click)="next()" [disabled]="images.length <= 1" aria-label="Next image">
          <i class="bi bi-chevron-right"></i>
        </button>
        @if (images.length > 1) {
          <div class="lightbox-dots">
            @for (img of images; track $index) {
              <button type="button" class="lightbox-dot cursor-pointer" [class.active]="$index === currentIndex" (click)="changeImage($index)" [attr.aria-label]="'Image ' + ($index + 1)"></button>
            }
          </div>
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

    @media (prefers-reduced-motion: reduce) {
      .lightbox-backdrop { animation: none; }
      .lightbox-frame    { animation: none; }
      .lightbox-image    { transition: none; }
    }
  `]
})
export class LightboxComponent implements OnInit, OnDestroy {
  @Input() images: string[] = [];
  @Input() startIndex = 0;
  @Output() close = new EventEmitter<void>();

  @ViewChild('lbImg') private imgRef!: ElementRef<HTMLImageElement>;

  currentIndex = 0;
  isTransitioning = false;
  private priorBodyOverflow = '';
  private loadTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.currentIndex = this.startIndex;
    this.priorBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = this.priorBodyOverflow;
    if (this.loadTimeout) clearTimeout(this.loadTimeout);
  }

  changeImage(index: number) {
    if (this.isTransitioning || index === this.currentIndex) return;
    this.isTransitioning = true;
    setTimeout(() => {
      this.currentIndex = index;
      // isTransitioning cleared by onImageLoad(); safety fallback after 5s
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
