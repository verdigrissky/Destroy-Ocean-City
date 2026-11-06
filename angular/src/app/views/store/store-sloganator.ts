import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SloganatorService } from '../../services/sloganator-service';
import { ThemeService } from '../../services/theme-service';

@Component({
  selector: 'store-sloganator',
  template: `
    <p class="h5 text-primary cursor-default mb-2">
      <span class="visually-hidden">{{ sloganatorService.fullText() }}</span>
      <span aria-hidden="true">{{ sloganatorService.displayText() }}<span class="typewriter-cursor" [class.static]="theme.reducedMotion()">|</span></span>
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .typewriter-cursor {
      animation: blink 0.7s step-end infinite;
    }
    .typewriter-cursor.static {
      animation: none;
      opacity: 0;
    }
    @keyframes blink {
      50% { opacity: 0; }
    }
  `]
})
export class StoreSloganator {
  protected sloganatorService = inject(SloganatorService);
  protected theme = inject(ThemeService);
}
