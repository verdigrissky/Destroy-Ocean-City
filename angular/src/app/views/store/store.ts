import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy } from '@angular/core';

// Component Imports
import { ProductPreviewer } from './product-previewer/product-previewer';
import { StoreCartButton } from './store-cart/store-cart';
import { StoreSloganator } from './store-sloganator';

// Service Imports
import { AlertService } from '../../services/alert-service';
import { PrintfulApiService } from '../../services/printful-api-service';
import { SloganatorService } from '../../services/sloganator-service';
import { TitleService } from '../../services/title-service';

// Model Imports
import { printfulSyncProduct } from '../../models/printful-model';

// Data Imports
import slogansData from '../../data/slogans.json';

@Component({
  selector: 'app-store',
  imports: [ProductPreviewer, StoreCartButton, StoreSloganator],
  templateUrl: './store.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .store-sk-image { height: 280px; width: 100%; border-radius: var(--bs-border-radius) var(--bs-border-radius) 0 0; }
    .store-sk-btn   { height: 2.5rem; width: 100%; }
  `
})
export class Store implements OnInit, OnDestroy {

  products = signal<printfulSyncProduct[]>([]);
  isLoading = signal(true);
  readonly skeletonCards = [0, 1, 2, 3, 4, 5];

  private alertService = inject(AlertService);
  private printfulApiService = inject(PrintfulApiService);
  private sloganatorService = inject(SloganatorService);
  private titleService = inject(TitleService);

  ngOnInit() {
    this.titleService.setCustomSiteTitle('Merch');
    this.sloganatorService.transitionTo(slogansData.slogans.storeSloganator);

    this.printfulApiService.getProducts().subscribe({
      next: products => {
        console.log(products);
        this.products.set(products);
      },
      error: err => {
        this.alertService.addAlert('error', err?.message ?? 'Failed to load products.');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  ngOnDestroy() {
    this.titleService.resetSiteTitle();
  }

}
