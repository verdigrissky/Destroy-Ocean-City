import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

// Component Imports
import { ProductImageComponent } from './product-previewer-image';

// Model Imports
import { printfulSyncProduct } from '../../../models/printful-model';

const IMAGE_BASE = 'https://images.destroyocean.city/products';

@Component({
  selector: 'product-previewer',
  imports: [ RouterLink, ProductImageComponent ],
  styles: `
    :host {
      display: flex;
      position: relative;
      z-index: 0;
      transition: filter 0.2s ease, z-index 0s;
    }
    :host:hover {
      z-index: 2;
      filter: drop-shadow(var(--product-card-shadow));
    }
    .product-card {
      border: none;
      width: 100%;
      overflow: hidden;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .product-card:hover {
      transform: translateY(-5px);
    }
    .image-wrap { position: relative; }
    .sold-out-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .sold-out-text {
      font-family: "Bowlby One", sans-serif;
      color: #fff;
      font-size: 1.25rem;
      letter-spacing: 0.1em;
      transform: rotate(-12deg);
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }
    .featured-badge {
      position: absolute;
      top: 0.625rem;
      right: 0.625rem;
      z-index: 2;
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
  @if (product()) {
    <div class="card h-100 w-100 product-card" [routerLink]="isOverProduct ? (product()!.slug ? ['/merchandise/swag', product()!.slug] : ['/merchandise/swag/id', product()!.id]) : null">
      <div class="image-wrap">
        @if (product()!.promoted) {
          <span class="badge bg-primary featured-badge">Sale</span>
        }
        <product-image [imageSrc]="previewImageUrl()" [altText]="product()!.name" (overImage)="isOverProduct = $event"></product-image>
        @if (product()!.soldOut) {
          <div class="sold-out-overlay">
            <span class="sold-out-text">Sold Out</span>
          </div>
        }
      </div>
      <div class="card-body d-flex flex-column">
        <h6 class="card-title fw-semibold">{{ product()!.name }}</h6>
        <p class="card-text text-muted small mt-auto">
          {{ product()!.variants }} {{ product()!.variant ?? 'variant' }}{{ product()!.variants !== 1 ? 's' : '' }}
        </p>
        <a class="btn btn-primary btn-sm mt-2 text-white" [routerLink]="product()!.slug ? ['/merchandise/swag', product()!.slug] : ['/merchandise/swag/id', product()!.id]">
          View Product
        </a>
      </div>
    </div>
  }
  `
})
export class ProductPreviewer {

  product = input<printfulSyncProduct>();
  isOverProduct = false;

  previewImageUrl = computed(() => {
    const p = this.product();
    if (!p) return '';
    if (p.slug && p.images?.length) {
      return `${IMAGE_BASE}/${p.slug}/${p.slug}_${p.images[0]}_600.png`;
    }
    return p.thumbnail_url;
  });

}
