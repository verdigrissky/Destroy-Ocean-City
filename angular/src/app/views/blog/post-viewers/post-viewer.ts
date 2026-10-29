import { Component, Input, OnDestroy, HostListener, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

// Service Imports
import { FeaturedImageService } from '../../../services/featuredImage-service';
import { IdentityService } from '../../../services/identity-service'

// Component Imports
import { CommentViewer } from '../comment-viewer/comment-viewer';

// Pipe Imports
import { OrdinalDatePipe } from '../../../pipes/ordinal-date.pipe';
import { SafeHtmlPipe } from '../../../pipes/safe-html.pipe';

// Model Imports
import { post } from '../../../models/post-model';

@Component({
  selector: 'postViewer',
  imports: [ CommentViewer, RouterLink, OrdinalDatePipe, SafeHtmlPipe ],
  template: `
    <div class="card paper px-0 mb-4 mx-auto">
      <div class="card-body p-sm-2 p-md-5">
        <h1 [innerHTML]="post!.title.rendered" class="oblique cursor-default"></h1>
        <h5 class="text-primary">
          Posted on {{ post.date | ordinalDate:'EEEE, MMMM d' }}
        </h5>
        @if (featuredImageSrc(); as featuredImage) {
          <figure class="post-featured-image-wrap">
            <button type="button" class="post-featured-image-button cursor-pointer" (click)="openLightbox(featuredImage)" aria-label="Open featured image in lightbox">
              <img [src]="featuredImage" class="post-featured-image" alt="Featured image for this post" loading="lazy">
              <span class="post-featured-image-hint monospace">
                View image
              </span>
            </button>
          </figure>
        }
        @if (showAuthorHeader) {
          <blockquote class="blockquote float-right cursor-default mb-0">
            <section class="text-muted text-center my-4">
              <h5>
                @if (this.identity.authorAvatar(post)) {
                  <img [src]="this.identity.authorAvatar(post)" alt="Author avatar" class="author-avatar">
                }
                &nbsp;{{this.identity.authorName(post)}}, {{this.identity.authorTier(post)}}
              </h5>
            </section>
          </blockquote>
        }
        <div [innerHTML]="post!.content.rendered | safeHtml"></div>
        <div class="d-flex justify-content-end">
          <small class="badge bg-light text-dark cursor-default">
            {{'#' + 'Promoted'}}
          </small>
        </div>
      </div>
      <div class="card-footer px-sm-2 px-md-5 pb-sm-2 pb-md-5">
        @if (showAuthorFooter) {
          <div class="d-sm-none d-md-flex mt-4 justify-content-center cursor-default w-100">
            <p>
              See more from&nbsp;
              <span [routerLink]="['/blog/author', identity.slugifyName(identity.authorName(post))]" class="link-primary cursor-pointer">
                @if (this.identity.authorAvatar(post)) {
                  <img [src]="this.identity.authorAvatar(post)" alt="Author avatar" class="author-avatar-button">&nbsp;
                }
                {{ this.identity.authorName(post).trimEnd() }}</span>, or&nbsp;<span class="link-primary cursor-pointer" routerLink="/blog">See More Posts</span>
            </p>
          </div>
        }
        @if (showComments) {
          <commentViewer [postId]="post!.id"></commentViewer>
        }
      </div>
    </div>

    @if (lightboxImageSrc(); as fullImageSrc) {
      <div class="post-lightbox-backdrop" (click)="closeLightbox()" role="dialog" aria-modal="true" aria-label="Featured image lightbox">
        <div class="post-lightbox-frame" (click)="$event.stopPropagation()">
          <button type="button" class="post-lightbox-close cursor-pointer" (click)="closeLightbox()" aria-label="Close featured image">
            <i class="bi bi-x-lg"></i>
          </button>
          <img [src]="fullImageSrc" class="post-lightbox-image" alt="Featured image full size">
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host {
      --app-radius: 0.5rem;
    }

    .author-avatar {
      height: 80px;
      width: auto;
      border-radius: 45%;
      filter: brightness(110%);
    }

    .author-avatar-button {
      height: 32px;
      width: auto;
      border-radius: 45%;
      transition-duration: 0.2s;
    }

    .link-primary:hover .author-avatar-button{
      filter: brightness(125%);
    }

    .post-featured-image-wrap {
      margin: 1rem 0 1.5rem;
    }

    .post-featured-image-button {
      width: 100%;
      border: 0;
      padding: 0;
      background: transparent;
      border-radius: var(--app-radius);
      overflow: hidden;
      position: relative;
      display: block;
      text-align: left;
    }

    .post-featured-image {
      width: 100%;
      max-height: min(45vh, 28rem);
      object-fit: cover;
      object-position: center;
      border-radius: var(--app-radius);
      transition: transform 260ms ease;
      display: block;
    }

    .post-featured-image-button:hover .post-featured-image,
    .post-featured-image-button:focus-visible .post-featured-image {
      transform: scale(1.02);
    }

    .post-featured-image-hint {
      position: absolute;
      right: 0.75rem;
      bottom: 0.75rem;
      font-size: 0.78rem;
      letter-spacing: 0.02em;
      border-radius: var(--app-radius);
      background: rgba(0, 0, 0, 0.58);
      color: #fff;
      padding: 0.3rem 0.65rem;
      pointer-events: none;
    }

    .post-lightbox-backdrop {
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

    .post-lightbox-frame {
      width: min(96vw, 1200px);
      max-height: 92vh;
      position: relative;
      display: grid;
      place-items: center;
    }

    .post-lightbox-image {
      max-width: 100%;
      max-height: 92vh;
      object-fit: contain;
      border-radius: var(--app-radius);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.48);
    }

    .post-lightbox-close {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      width: 2.4rem;
      height: 2.4rem;
      border: 0;
      border-radius: var(--app-radius);
      background: rgba(0, 0, 0, 0.62);
      color: #fff;
      line-height: 1;
      display: grid;
      place-items: center;
    }

    @keyframes lightbox-fade-in {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .post-featured-image,
      .post-lightbox-backdrop {
        transition: none;
        animation: none;
      }
    }
  `]
})
export class PostViewer implements OnDestroy {
  @Input() post!: post;
  @Input() showAuthorHeader = true;
  @Input() showAuthorFooter = true;
  @Input() showComments = true;
  lightboxImageSrc = signal<string | null>(null);
  private priorBodyOverflow = '';

  constructor(
    public featured: FeaturedImageService,
    public identity: IdentityService
  ){}

  featuredImageSrc(): string | undefined {
    return this.featured.image(this.post) ?? undefined;
  }

  openLightbox(imageSrc: string): void {
    this.lightboxImageSrc.set(imageSrc);
    this.priorBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxImageSrc.set(null);
    document.body.style.overflow = this.priorBodyOverflow;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.lightboxImageSrc()) {
      this.closeLightbox();
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.priorBodyOverflow;
  }

}
