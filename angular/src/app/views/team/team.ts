import { Component, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../services/api-service';
import { IdentityService } from '../../services/identity-service';
import { TitleService } from '../../services/title-service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { LightboxComponent } from '../../shared/lightbox';
import { hero } from '../../models/hero-model';

@Component({
  selector: 'app-team',
  imports: [ SafeHtmlPipe, RouterLink, LightboxComponent ],
  templateUrl: './team.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles:`
    .hero-intro-container {
      margin-bottom: 1rem;
      display: flex;
      gap: 1rem;
    }
    .hero-photo-container {
      height: 100px;
      width: 100px;
      flex-shrink: 0;
    }
    .hero-photo-button {
      border: 0;
      padding: 0;
      background: transparent;
      border-radius: 45%;
      overflow: hidden;
      position: relative;
      display: block;
      height: 100px;
      width: 100px;
      cursor: pointer;
    }
    .hero-photo {
      height: 100px;
      width: 100px;
      object-fit: cover;
      border-radius: 45%;
      filter: brightness(110%);
      display: block;
      transition: transform 260ms ease;
    }
    .hero-photo-button:hover .hero-photo,
    .hero-photo-button:focus-visible .hero-photo {
      transform: scale(1.05);
    }
    .hero-photo-hint {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 0.7rem;
      letter-spacing: 0.02em;
      background: rgba(0, 0, 0, 0.52);
      color: #fff;
      border-radius: 45%;
      opacity: 0;
      transition: opacity 180ms ease;
      pointer-events: none;
    }
    .hero-photo-button:hover .hero-photo-hint,
    .hero-photo-button:focus-visible .hero-photo-hint {
      opacity: 1;
    }
    .hero-title-container {
      width: 100%;
      display: flex;
      align-items: center;
    }
    .hero-title-text {
      margin: 0;
    }
    .hero-skeleton-card {
      opacity: 0;
      transform: translateY(10px) scale(0.988);
      animation: sk-settle 380ms cubic-bezier(.2, .7, .2, 1) forwards;
      animation-delay: var(--reveal-delay, 0ms);
      border: 1px solid var(--doc-skeleton-bg);
    }
    .hero-skeleton-intro {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.2rem;
    }
    .hero-skeleton-photo {
      width: 100px;
      height: 100px;
      border-radius: 45%;
      flex-shrink: 0;
      background: var(--doc-skeleton-bg);
    }
    .hero-skeleton-title-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.6rem;
    }
    .hero-skeleton-line {
      height: 0.9rem;
      border-radius: 0.4rem;
      background: var(--doc-skeleton-bg);
      margin-bottom: 0.65rem;
    }
    .hero-skeleton-name {
      height: 1.2rem;
      width: 72%;
      margin-bottom: 0;
    }
    .hero-skeleton-tier {
      height: 0.85rem;
      width: 46%;
      margin-bottom: 0;
    }
    .hero-skeleton-line-short { width: 55%; }
    .hero-skeleton-line-medium { width: 78%; }
    .hero-skeleton-fact-title {
      height: 1rem;
      width: 28%;
      margin-bottom: 0.9rem;
    }
    .hero-card-reveal {
      opacity: 0;
      transform: translateY(10px) scale(0.988);
      animation: sk-settle 420ms cubic-bezier(.2, .7, .2, 1) forwards;
      animation-delay: var(--reveal-delay, 0ms);
    }
    :host-context(html.reduce-motion) .hero-photo,
    :host-context(html.reduce-motion) .hero-card-reveal,
    :host-context(html.reduce-motion) .hero-skeleton-card {
      transition: none;
      animation: none;
      opacity: 1;
      transform: none;
    }
  `
})
export class Team implements OnDestroy {
  heroes: hero[] = [];
  isLoading = signal<boolean>(true);
  readonly skeletonCards = [0, 1, 2, 3];
  lightboxHero = signal<hero | null>(null);

  constructor(public api: ApiService, public identity: IdentityService, private titleService: TitleService) { }

  ngOnInit() {
    this.titleService.setCustomSiteTitle('Heroes');
    console.log('Team view initialized');
    this.api.getHeroes().subscribe({
      next: heroes => {
        console.log('Fetched heroes:', heroes);
        this.heroes = heroes;
      },
      error: () => this.isLoading.set(false),
      complete: () => this.isLoading.set(false)
    });
  }

  openLightbox(hero: hero): void {
    this.lightboxHero.set(hero);
  }

  closeLightbox(): void {
    this.lightboxHero.set(null);
  }

  ngOnDestroy(): void {
    this.titleService.resetSiteTitle();
  }

}
