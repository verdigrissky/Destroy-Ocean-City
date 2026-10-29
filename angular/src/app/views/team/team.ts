import { Component, HostListener, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../services/api-service';
import { IdentityService } from '../../services/identity-service';
import { TitleService } from '../../services/title-service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { hero } from '../../models/hero-model';

@Component({
  selector: 'app-team',
  imports: [ SafeHtmlPipe, RouterLink ],
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
    .hero-lightbox-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1050;
      background: rgba(0, 0, 0, 0.76);
      backdrop-filter: blur(2px);
      display: grid;
      place-items: center;
      padding: 1.25rem;
      animation: lightbox-fade-in 180ms ease;
    }
    .hero-lightbox-frame {
      width: min(96vw, 600px);
      max-height: 92vh;
      position: relative;
      display: grid;
      place-items: center;
    }
    .hero-lightbox-image {
      max-width: 100%;
      max-height: 92vh;
      object-fit: contain;
      border-radius: 0.5rem;
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.48);
    }
    .hero-lightbox-close {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      width: 2.4rem;
      height: 2.4rem;
      border: 0;
      border-radius: 0.5rem;
      background: rgba(0, 0, 0, 0.62);
      color: #fff;
      line-height: 1;
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    @keyframes lightbox-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    /* --- Skeleton cards --- */
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
    /* --- Card reveal on load --- */
    .hero-card-reveal {
      opacity: 0;
      transform: translateY(10px) scale(0.988);
      animation: sk-settle 420ms cubic-bezier(.2, .7, .2, 1) forwards;
      animation-delay: var(--reveal-delay, 0ms);
    }
    @media (prefers-reduced-motion: reduce) {
      .hero-photo, .hero-lightbox-backdrop,
      .hero-card-reveal, .hero-skeleton-card {
        transition: none;
        animation: none;
        opacity: 1;
        transform: none;
      }
    }
  `
})
export class Team implements OnDestroy {
  heroes: hero[] = [];
  isLoading = signal<boolean>(true);
  readonly skeletonCards = [0, 1, 2, 3];
  lightboxImageSrc = signal<string | null>(null);
  private priorBodyOverflow = '';

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

  openLightbox(src: string): void {
    this.lightboxImageSrc.set(src);
    this.priorBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxImageSrc.set(null);
    document.body.style.overflow = this.priorBodyOverflow;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.lightboxImageSrc()) this.closeLightbox();
  }

  ngOnDestroy(): void {
    this.titleService.resetSiteTitle();
    document.body.style.overflow = this.priorBodyOverflow;
  }

}
