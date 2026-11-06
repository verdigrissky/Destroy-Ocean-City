import { Component, ElementRef, ViewChild, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

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
      <a class="visually-hidden-focusable skip-link" href="#main-content" (click)="focusMain($event)">Skip to main content</a>
      <doc-header></doc-header>
      <main #main id="main-content" tabindex="-1" class="container p-md-5 p-sm-1 my-2" style="min-height: 600px;">
          <alert></alert>
          <router-outlet></router-outlet>
      </main>
      <sloganator></sloganator>
      <doc-footer></doc-footer>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    @keyframes vt-fade-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes vt-fade-out { from { opacity: 1 } to { opacity: 0 } }
    ::view-transition-old(root) { animation: 120ms ease-out vt-fade-out; }
    ::view-transition-new(root) { animation: 160ms ease-in vt-fade-in; }
    header, app-alert { view-transition-name: none; }
    .skip-link {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      z-index: 2000;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      background: var(--bs-body-bg);
      color: var(--bs-body-color);
    }
    main:focus { outline: none; }
    .paper {
      max-width: 1024px;
      filter: drop-shadow(30px 10px 4px #000000);
    }
  `
})
export class App {
  protected readonly title = signal('destroyOceanCity');
  protected readonly maintenance = inject(MaintenanceService);
  @ViewChild('main') private mainRef?: ElementRef<HTMLElement>;

  constructor() {
    let previousPath: string | null = null;
    inject(Router).events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(e => {
      const path = e.urlAfterRedirects.split(/[?#]/)[0];
      if (previousPath !== null && path !== previousPath) {
        this.mainRef?.nativeElement.focus({ preventScroll: true });
      }
      previousPath = path;
    });
  }

  focusMain(event: Event) {
    event.preventDefault();
    this.mainRef?.nativeElement.focus();
  }

}
