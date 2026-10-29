import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SloganatorService } from '../../services/sloganator-service';

@Component({
  selector: 'store-sloganator',
  template: `
    <h5 class="text-primary cursor-default">
      {{ sloganatorService.displayText() }}<span class="typewriter-cursor">|</span>
    </h5>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .typewriter-cursor {
      animation: blink 0.7s step-end infinite;
    }
    @keyframes blink {
      50% { opacity: 0; }
    }
  `]
})
export class StoreSloganator {
  protected sloganatorService = inject(SloganatorService);
}
