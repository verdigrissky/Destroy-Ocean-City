import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

// Service Imports
import { FeaturedImageService } from '../../../services/featuredImage-service';
import { IdentityService } from '../../../services/identity-service';

// Pipe Imports
import { OrdinalDatePipe } from '../../../pipes/ordinal-date.pipe';
import { ReadingTimePipe } from '../../../pipes/reading-time.pipe';
import { SafeHtmlPipe } from '../../../pipes/safe-html.pipe';

// Model Imports
import { post } from '../../../models/post-model';

@Component({
  selector: 'postPreviewer',
  imports: [ RouterLink, OrdinalDatePipe, ReadingTimePipe, SafeHtmlPipe ],
  template: `
    @if (this.featured.sized(post); as featuredImage) {
      <div class="featured-image-wrap sk-img-wrap" [class.previewer-image-crop]="cropFeaturedImage" [class.image-loading]="!isImageLoaded(post.id, featuredImage.src)">
        <img [src]="featuredImage.src" [attr.srcset]="featuredImage.srcset" [attr.sizes]="featuredImage.srcset ? cardImageSizes : null"
          [attr.width]="featuredImage.width" [attr.height]="featuredImage.height" loading="lazy" decoding="async"
          class="featured-image" [class.image-loaded]="isImageLoaded(post.id, featuredImage.src)" (load)="onImageLoad(post.id, featuredImage.src)" alt="">
      </div>
    } @else if (cropFeaturedImage) {
      <div class="previewer-image-crop featured-image-wrap sk-img-wrap" [class.image-loading]="!isImageLoaded(post.id, fallbackImage(post.id))">
        <img [src]="fallbackImage(post.id)" loading="lazy" decoding="async" class="featured-image" [class.image-loaded]="isImageLoaded(post.id, fallbackImage(post.id))" (load)="onImageLoad(post.id, fallbackImage(post.id))" alt="">
      </div>
    }
    <div class="card-body preview-body">
      @if (headingLevel === 3) {
        <h3 class="preview-title"><a class="preview-link stretched-link" [routerLink]="['/blog', post.slug]" [innerHTML]="post.title.rendered"></a></h3>
      } @else {
        <h2 class="preview-title"><a class="preview-link stretched-link" [routerLink]="['/blog', post.slug]" [innerHTML]="post.title.rendered"></a></h2>
      }
      <p class="preview-meta text-muted monospace">
        {{ post.date | ordinalDate }} <span aria-hidden="true">&middot;</span> {{ post.content.rendered | readingTime }}
      </p>
      <div class="preview-excerpt" [innerHTML]="post.excerpt.rendered | safeHtml"></div>
      <div class="preview-byline">
        @if (this.identity.authorAvatar(post)) {
          <img [src]="this.identity.authorAvatar(post)" alt="" class="preview-avatar" width="40" height="40">
        }
        <div>
          <span class="preview-author">{{ this.identity.authorName(post) }}</span>
          <span class="preview-tier text-muted">{{ this.identity.authorTier(post) }}</span>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      border-radius: var(--bs-card-border-radius);
    }

    :host:has(.preview-link:focus-visible) {
      outline: 2px solid var(--doc-link-red, #ff5252);
      outline-offset: 3px;
    }

    .featured-image-wrap {
      border-radius: var(--bs-card-inner-border-radius) var(--bs-card-inner-border-radius) 0 0;
    }

    .featured-image {
      display: block;
      width: 100%;
      height: auto;
      transform: scale(1.035);
      filter: blur(12px) saturate(0.86);
      opacity: 0.78;
      transition: filter 420ms ease, transform 520ms ease, opacity 420ms ease;
      will-change: filter, transform, opacity;
    }

    .featured-image.image-loaded {
      transform: scale(1);
      filter: blur(0) saturate(1);
      opacity: 1;
    }

    :host(:hover) .featured-image.image-loaded {
      transform: scale(1.03);
    }

    .preview-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 1.25rem 1.25rem 1.4rem;
    }

    .preview-title {
      font-family: "Barlow", sans-serif;
      font-weight: 700;
      font-size: 1.35rem;
      line-height: 1.25;
      text-wrap: balance;
      margin: 0 0 0.35rem;
    }

    .preview-link {
      font-weight: inherit;
      color: var(--doc-link-red, #ff5252);
      text-decoration: none;
    }

    .preview-link:focus-visible {
      outline: none;
    }

    :host(:hover) .preview-link,
    .preview-link:focus-visible {
      text-decoration: underline;
      text-underline-offset: 0.18em;
      text-decoration-thickness: 2px;
    }

    .preview-meta {
      font-size: 0.85rem;
      margin: 0 0 0.9rem;
    }

    .preview-excerpt {
      margin-bottom: 1.25rem;
    }

    .preview-byline {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      margin-top: auto;
      padding-left: 0.85rem;
      border-left: 3px solid var(--doc-link-red, #ff5252);
    }

    .preview-avatar {
      border-radius: 45%;
      flex-shrink: 0;
    }

    .preview-author {
      display: block;
      font-weight: 600;
      line-height: 1.3;
    }

    .preview-tier {
      display: block;
      font-size: 0.85rem;
    }

    :host-context(html.reduce-motion) .featured-image {
      transition: none;
    }
  `]
})
export class PostPreviewer {
  @Input() post!: post;
  @Input() cropFeaturedImage: boolean = false;
  @Input() headingLevel: 2 | 3 = 2;
  readonly cardImageSizes = '(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 360px';
  private loadedImageKeys = new Set<string>();
  private fallbackByPostId = new Map<number, string>();

  constructor(
    public featured: FeaturedImageService,
    public identity: IdentityService
  ) {}

  fallbackImage(postId: number): string {
    const existing = this.fallbackByPostId.get(postId);
    if (existing) {
      return existing;
    }

    const next = this.featured.randomFallback();
    this.fallbackByPostId.set(postId, next);
    return next;
  }

  isImageLoaded(postId: number, src: string): boolean {
    return this.loadedImageKeys.has(this.imageKey(postId, src));
  }

  onImageLoad(postId: number, src: string): void {
    this.loadedImageKeys.add(this.imageKey(postId, src));
  }

  private imageKey(postId: number, src: string): string {
    return `${postId}::${src}`;
  }

}
