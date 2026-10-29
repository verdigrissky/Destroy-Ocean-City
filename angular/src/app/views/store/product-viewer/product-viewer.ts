import { Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

// Service Imports
import { AlertService } from '../../../services/alert-service';
import { PrintfulApiService } from '../../../services/printful-api-service';
import { SloganatorService } from '../../../services/sloganator-service';
import { TitleService } from '../../../services/title-service';

// Model Imports
import { printfulProductDetail } from '../../../models/printful-model';

// Component Imports
import { StoreCartButton } from '../store-cart/store-cart';
import { StoreSloganator } from '../store-sloganator';
import { LightboxComponent } from '../../../shared/lightbox';
import { AddToCart } from './product-add-to-cart';
import { ProductImageComponent } from '../product-previewer/product-previewer-image';

// Data Imports
import localProducts from '../../../data/products.json';

const IMAGE_BASE = 'https://images.destroyocean.city/products';

function buildImageUrl(slug: string, angle: string, size: 'full' | '600' | '50'): string {
  return `${IMAGE_BASE}/${slug}/${slug}_${angle}_${size}.png`;
}

@Component({
  selector: 'product-viewer',
  imports: [RouterLink, CurrencyPipe, StoreCartButton, StoreSloganator, ProductImageComponent, LightboxComponent, AddToCart],
  templateUrl: './product-viewer.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .pv-sk-image { height: 320px; width: 100%; }
    .pv-sk-thumb { width: 50px; height: 50px; flex-shrink: 0; }
    .pv-sk-btn   { height: 2.5rem; width: 100%; }

    .button-store-back {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      margin-right: 0.5rem;
      border: 1px solid var(--bs-secondary);
      border-radius: 50%;
      text-decoration: none;
      transition: background-color 0.3s, color 0.3s;
    }
    .main-image-wrap {
      transition: opacity 0.25s ease;
    }
    .main-image-wrap.fading {
      opacity: 0;
    }
    .thumb-strip {
      justify-content: center;
    }
    .thumb-strip img {
      width: 50px;
      height: 50px;
      object-fit: contain;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 0.25rem;
      transition: transform 0.5s, filter 0.5s, border-color 0.15s;
    }
    .thumb-strip img:hover:not(.active) {
      transform: translateY(-5px);
    }
    .thumb-strip img.active {
      border-color: var(--bs-primary);
      transform: translateY(-10px);
      filter: brightness(125%);
    }
    `
})
export class ProductViewer implements OnInit, OnDestroy {

  product = signal<printfulProductDetail | null>(null);
  loading = signal(true);
  isOverProduct = false;
  lightboxOpen = false;
  selectedAngleIndex = signal(0);
  imageFading = signal(false);

  private loadTimeout: ReturnType<typeof setTimeout> | null = null;

  selectAngle(index: number) {
    this.imageFading.set(true);
    if (this.loadTimeout) { clearTimeout(this.loadTimeout); this.loadTimeout = null; }
    setTimeout(() => {
      this.selectedAngleIndex.set(index);
      // imageFading cleared by onProductImageLoaded(); safety fallback after 5s
      this.loadTimeout = setTimeout(() => this.onProductImageLoaded(), 5000);
    }, 250);
  }

  onProductImageLoaded() {
    if (this.loadTimeout) { clearTimeout(this.loadTimeout); this.loadTimeout = null; }
    if (this.imageFading()) this.imageFading.set(false);
  }

  private localImages = computed(() => this.product()?.sync_product.images ?? []);
  private productSlug = computed(() => this.product()?.sync_product.slug ?? '');

  mainImageUrl = computed(() => {
    const slug = this.productSlug();
    const images = this.localImages();
    if (slug && images.length) return buildImageUrl(slug, images[this.selectedAngleIndex()], '600');
    return this.product()?.sync_product.thumbnail_url ?? '';
  });

  thumbnailUrls = computed(() => {
    const slug = this.productSlug();
    const images = this.localImages();
    if (!slug || !images.length) return [];
    return images.map(angle => buildImageUrl(slug, angle, '50'));
  });

  lightboxImages = computed(() => {
    const slug = this.productSlug();
    const images = this.localImages();
    if (!slug || !images.length) return [];
    return images.map(angle => buildImageUrl(slug, angle, 'full'));
  });

  private route = inject(ActivatedRoute);
  private printfulApiService = inject(PrintfulApiService);
  private alertService = inject(AlertService);
  private sloganatorService = inject(SloganatorService);
  private titleService = inject(TitleService);

  ngOnInit() {
    this.sloganatorService.beginErase();

    const params = this.route.snapshot.paramMap;
    const itemSlug = params.get('itemSlug');
    const itemId = params.get('itemId');

    let id: number | null = null;
    if (itemSlug) {
      const local = localProducts.printfulProducts.find(p => p.slug === itemSlug);
      if (local) id = local.id;
    } else if (itemId) {
      id = Number(itemId);
    }

    if (!id) {
      this.alertService.addAlert('error', 'Product not found.');
      this.loading.set(false);
      return;
    }

    this.printfulApiService.getProduct(id).subscribe({
      next: detail => {
        this.product.set(detail);
        this.selectedAngleIndex.set(0);
        this.loading.set(false);
        this.titleService.setCustomSiteTitle(detail.sync_product.name);
        this.sloganatorService.transitionTo(detail.sync_product.slogans ?? []);
      },
      error: err => {
        this.alertService.addAlert('error', err?.message ?? 'Failed to load product.');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() {
    if (this.loadTimeout) clearTimeout(this.loadTimeout);
    this.titleService.resetSiteTitle();
  }

}
