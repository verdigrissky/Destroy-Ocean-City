import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'store-cart-display',
  imports: [],
  templateUrl: './store-cart.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './store-cart.css',
})
export class StoreCart {

  // TODO: replace with cart service
  productsInCart = signal<{ productId: number, quantity: number }[]>([]);

}

@Component({
  selector: 'store-cart-button',
  imports: [StoreCart, DecimalPipe],
  styles: `
    :host { position: relative; z-index: 10; }
    .cart-btn {
      background: none;
      border: none;
      padding: 0;
      color: inherit;
      font-family: inherit;
      font-size: inherit;
      cursor: pointer;
    }
    .cart-btn:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
      border-radius: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="dropdown">
      <button type="button" class="cart-btn dropdown-toggle"
        data-bs-toggle="dropdown" aria-expanded="false">
        <i class="bi bi-bag"></i>
        <span class="ms-1">&#36;{{ cartTotal() | number:'1.2-2' }}</span>
      </button>
      <div class="dropdown-menu dropdown-menu-end p-0" style="min-width: 240px;">
        <store-cart-display></store-cart-display>
      </div>
    </div>
  `
})
export class StoreCartButton {

  // TODO: replace with cart service
  cartTotal = signal<number>(0);

}
