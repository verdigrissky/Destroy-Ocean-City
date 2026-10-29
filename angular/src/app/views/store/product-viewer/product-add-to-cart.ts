import { Component, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';

const MIN_QTY = 1;
const MAX_QTY = 99;

@Component({
  selector: 'add-to-cart',
  template: `
    <div class="d-flex align-items-center gap-2">
      <div class="qty-group">
        <button class="qty-btn" type="button"
          (click)="decrement()" [disabled]="quantity() <= MIN_QTY">
          &minus;
        </button>
        <div class="qty-display">
          @if (animTick() % 2 === 0) {
            <span [class]="'qty-num ' + direction()">{{ quantity() }}</span>
          } @else {
            <span [class]="'qty-num ' + direction()">{{ quantity() }}</span>
          }
        </div>
        <button class="qty-btn" type="button"
          (click)="increment()" [disabled]="quantity() >= MAX_QTY">
          &plus;
        </button>
      </div>
      <button class="btn btn-primary text-white flex-fill" type="button"
        (click)="addToCart()" [disabled]="soldOut()">
        {{ buttonLabel() }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .qty-group {
      display: flex;
      width: 8rem;
      flex-shrink: 0;
      border-radius: var(--bs-border-radius);
      box-shadow:
        0 1px 0 rgba(0, 0, 0, 0.18),
        0 2px 0 rgba(0, 0, 0, 0.13),
        0 3px 0 rgba(0, 0, 0, 0.09),
        0 4px 0 rgba(0, 0, 0, 0.05),
        0 6px 14px rgba(0, 0, 0, 0.10);
    }
    .qty-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.375rem 0.75rem;
      font-size: 1rem;
      line-height: 1.5;
      cursor: pointer;
      user-select: none;
      background-color: var(--bs-body-bg);
      border: 1px solid var(--bs-border-color);
      color: var(--bs-body-color);
    }
    .qty-btn:first-child {
      border-radius: var(--bs-border-radius) 0 0 var(--bs-border-radius);
      border-right: none;
    }
    .qty-btn:last-child {
      border-radius: 0 var(--bs-border-radius) var(--bs-border-radius) 0;
      border-left: none;
    }
    .qty-btn:hover:not(:disabled) {
      background-color: var(--bs-secondary-bg);
    }
    .qty-btn:disabled {
      color: var(--bs-border-color);
      cursor: default;
    }
    .qty-display {
      flex: 1;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bs-body-bg);
      border-top: 1px solid var(--bs-border-color);
      border-bottom: 1px solid var(--bs-border-color);
      color: var(--bs-body-color);
      font-size: 1rem;
      line-height: 1.5;
      user-select: none;
    }
    .qty-num {
      display: block;
    }
    .qty-num.up {
      animation: rollUp 0.2s ease-out both;
    }
    .qty-num.down {
      animation: rollDown 0.2s ease-out both;
    }
    @keyframes rollUp {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    @keyframes rollDown {
      from { transform: translateY(-100%); }
      to   { transform: translateY(0); }
    }
  `
})
export class AddToCart {

  readonly MIN_QTY = MIN_QTY;
  readonly MAX_QTY = MAX_QTY;

  soldOut = input<boolean>(false);

  quantity = signal(1);
  animTick = signal(0);
  direction = signal<'up' | 'down' | ''>('');

  buttonLabel = computed(() => {
    if (this.soldOut()) return 'Sold Out';
    return this.quantity() === 1 ? 'Add to Cart' : `Add ${this.quantity()} to Cart`;
  });

  increment() {
    if (this.quantity() >= MAX_QTY) return;
    this.direction.set('up');
    this.animTick.update(t => t + 1);
    this.quantity.update(q => q + 1);
  }

  decrement() {
    if (this.quantity() <= MIN_QTY) return;
    this.direction.set('down');
    this.animTick.update(t => t + 1);
    this.quantity.update(q => q - 1);
  }

  addToCart() {
    // TODO: wire up cart service
    console.log(`Adding ${this.quantity()} to cart`);
  }

}
