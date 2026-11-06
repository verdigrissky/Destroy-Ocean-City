import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme-service';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'doc-header',
  imports: [ NgClass, RouterLink, RouterLinkActive, Logo ],
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

  themeSettingLabel(): string {
    switch (this.theme.currentThemeSetting()) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'black': return 'Black';
      default: return 'Automatic';
    }
  }

  isMerchActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/merch') || url.startsWith('/merchandise/');
  }

}
