import { Component, AfterViewInit, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';

const PROXY_BASE = 'https://dropship.destroyocean.city';
const PRINTFUL_CDN_HOST = 'files.cdn.printful.com';

@Component({
  selector: 'product-image',
  template: `
    <div class="imageContainer" (mousemove)="onMouseMove($event)" (mouseleave)="onMouseLeave()" (click)="onClick()" [style.cursor]="currentCursor">
      <img #productImage class="productPreviewImage" [src]="proxiedSrc" [alt]="altText" crossorigin="anonymous" (load)="onImageLoad()" (error)="onImageError()" [style.filter]="currentCursor === 'pointer' ? 'brightness(125%)' : 'brightness(100%)'">
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .productPreviewImage {
      width: 100%;
      height: auto;
      display: block;
      pointer-events: none;
      transition: filter 0.5s;
    }
    .imageContainer {
      display: block;
      width: 100%;
      position: relative;
    }
  `
})
export class ProductImageComponent implements AfterViewInit {
  @Input() imageSrc!: string;
  @Input() altText: string = '';
  alphaThreshold: number = 100;

  get proxiedSrc(): string {
    try {
      const parsed = new URL(this.imageSrc);
      if (parsed.hostname === PRINTFUL_CDN_HOST) {
        return `${PROXY_BASE}/image-proxy?url=${encodeURIComponent(this.imageSrc)}`;
      }
    } catch {}
    return this.imageSrc;
    
  }
  
  @ViewChild('productImage') imageRef!: ElementRef<HTMLImageElement>;
  
  @Output() overImage = new EventEmitter<boolean>();
  @Output() imageClick = new EventEmitter<void>();
  @Output() loaded = new EventEmitter<void>();

  currentCursor: string = 'default';
  private _isOverImage = false;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;

  ngAfterViewInit() {
    this.onImageLoad();

  }

  onImageError() {
    this.loaded.emit();
  }

  onImageLoad() {
    const img = this.imageRef.nativeElement;

    if (!img.complete) { return; }

    this.loaded.emit();

    this.canvas = document.createElement('canvas');
    this.canvas.width = img.naturalWidth;
    this.canvas.height = img.naturalHeight;
    
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    if (!this.ctx) return;
    this.ctx.drawImage(img, 0, 0);
    
    try {
      this.imageData = this.ctx.getImageData(
        0, 0, 
        this.canvas.width, 
        this.canvas.height
      );
    } catch (e) {
      console.warn('Could not read image data (CORS?):', e);
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.imageData || !this.canvas) { return; 

    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const img = this.imageRef.nativeElement;
    const scaleX = this.canvas.width / img.offsetWidth;
    const scaleY = this.canvas.height / img.offsetHeight;
    
    const imageX = Math.floor(x * scaleX);
    const imageY = Math.floor(y * scaleY);

    if (imageX < 0 || imageX >= this.canvas.width || imageY < 0 || imageY >= this.canvas.height) {
      this.currentCursor = 'default';
      return;

    }

    const index = (imageY * this.canvas.width + imageX) * 4;
    const alpha = this.imageData.data[index + 3];
    const over = alpha > this.alphaThreshold;
    this.currentCursor = over ? 'pointer' : 'default';

    if (over !== this._isOverImage) {
      this._isOverImage = over;
      this.overImage.emit(over);

    }
  }

  onClick() {
    if (this._isOverImage) this.imageClick.emit();

  }

  onMouseLeave() {
    this.currentCursor = 'default';
    if (this._isOverImage) {
      this._isOverImage = false;
      this.overImage.emit(false);

    }
  }

}