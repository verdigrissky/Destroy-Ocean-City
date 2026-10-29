import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { BackendStatus } from '../../services/maintenance-service';

@Component({
  selector: 'doc-maintenance',
  template: `
  <main class="maintenance" role="alert" aria-live="assertive">
    <span class="destroyOceanCityLogo maintenance-logo">
      <span class="destroy">Destroy</span>&nbsp;<span class="ocean-city">Ocean City!</span>
    </span>
    <p class="maintenance-message">
      @if (status() === 'maintenance') {
        Our servers are currently being inspected for structural windmill damage.
        Please try again once the turbines stop spinning.
      } @else {
        Our servers appear to have been knocked offline by a rogue offshore gust.
        Please try again once the wind dies down.
      }
    </p>
  </main>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .maintenance {
      position: fixed;
      inset: 0;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      padding: 1rem;
      text-align: center;
    }
    .maintenance-logo {
      margin-right: 0;
      cursor: default;
      font-size: clamp(2rem, 8vw, 5rem);
      line-height: 1.2;
    }
    .maintenance-message {
      color: #f0f0f0;
      max-width: 36rem;
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      margin: 0;
    }
  `
})
export class Maintenance {
  status = input<BackendStatus>('maintenance');
}
