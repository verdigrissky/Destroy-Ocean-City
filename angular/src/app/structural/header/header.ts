import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme-service';

@Component({
  selector: 'doc-header',
  imports: [ NgClass, RouterLink, RouterLinkActive ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './header.html'
})
export class Header {

  private router = inject(Router);

  constructor( public theme: ThemeService ) {}

  ngOnInit() {}

  isBlogActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/blog') || url.startsWith('/content/');
  }

  isMerchActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/merch') || url.startsWith('/merchandise/');
  }

}
