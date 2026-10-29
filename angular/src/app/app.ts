import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Structural Component Import
import { Header } from './structural/header/header';
import { AlertComponent } from './structural/alert/alert';
import { Sloganator } from "./shared/sloganator";
import { Footer } from './structural/footer/footer';
import { Maintenance } from './structural/maintenance/maintenance';
import { MaintenanceService } from './services/maintenance-service';

@Component({
  selector: 'doc-root',
  imports: [ Header, AlertComponent, RouterOutlet, Sloganator, Footer, Maintenance ],
  standalone: true,
  template: `
    @if (maintenance.down()) {
      <doc-maintenance [status]="maintenance.status()"></doc-maintenance>
    } @else {
      <doc-header></doc-header>
      <div class="container p-md-5 p-sm-1 my-2" style="min-height: 600px;">
          <alert></alert>
          <router-outlet></router-outlet>
      </div>
      <sloganator></sloganator>
      <doc-footer></doc-footer>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    @keyframes vt-fade-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes vt-fade-out { from { opacity: 1 } to { opacity: 0 } }
    /* outgoing view */
    ::view-transition-old(root) { animation: 120ms ease-out vt-fade-out; }
    /* incoming view */
    ::view-transition-new(root) { animation: 160ms ease-in vt-fade-in; }
    header, app-alert { view-transition-name: none; }
    .paper {
      max-width: 1024px;
      filter: drop-shadow(30px 10px 4px #000000);
    }
  `
})
export class App {
  protected readonly title = signal('destroyOceanCity');
  protected readonly maintenance = inject(MaintenanceService);
  
}
