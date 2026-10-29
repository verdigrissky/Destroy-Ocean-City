import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './not-found.html'
})
export class NotFound {
  attemptedUrl = signal<string>('');

  constructor(private router: Router) {
    this.attemptedUrl.set(router.url);

  }

}
