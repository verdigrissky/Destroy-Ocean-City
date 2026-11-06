import { Component, Input, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

// Service Imports
import { FeaturedImageService } from '../../../services/featuredImage-service';
import { IdentityService } from '../../../services/identity-service'
import { AlertService } from '../../../services/alert-service';

// Component Imports
import { CommentViewer } from '../comment-viewer/comment-viewer';
import { LightboxComponent } from '../../../shared/lightbox';

// Pipe Imports
import { OrdinalDatePipe } from '../../../pipes/ordinal-date.pipe';
import { SafeHtmlPipe } from '../../../pipes/safe-html.pipe';
import { ReadingTimePipe } from '../../../pipes/reading-time.pipe';

// Model Imports
import { adjacentPost, post } from '../../../models/post-model';
import { plainText } from '../../../shared/plain-text';

@Component({
  selector: 'postViewer',
  imports: [ CommentViewer, RouterLink, LightboxComponent, OrdinalDatePipe, ReadingTimePipe, SafeHtmlPipe ],
  template: `
    <div class="card paper px-0 mb-4 mx-auto">
      <div class="card-body p-sm-2 p-md-5">
        @if (showBlogNav) {
          <a routerLink="/blog" class="post-back-link link-primary text-decoration-none monospace small"><span aria-hidden="true">&larr;</span> All posts</a>
        }
        <h1 [innerHTML]="post!.title.rendered" class="oblique cursor-default"></h1>
        <p class="h5 text-primary">
          Posted on {{ post.date | ordinalDate:'EEEE, MMMM d' }}
          @if (showBlogNav) {
            <small class="text-muted monospace fs-6">&nbsp;&middot;&nbsp;{{ post.content.rendered | readingTime }}</small>
          }
        </p>
        @if (featuredImageSrc(); as featuredImage) {
          <figure class="post-featured-image-wrap">
            <button type="button" class="post-featured-image-button cursor-pointer" (click)="openLightbox(featuredImage)" aria-label="Open featured image in lightbox">
              @if (featured.sized(post); as shown) {
                <img [src]="shown.src" [attr.srcset]="shown.srcset" [attr.sizes]="shown.srcset ? featuredImageSizes : null"
                  [attr.width]="shown.width" [attr.height]="shown.height" class="post-featured-image" [alt]="featured.alt(post)">
              }
              <span class="post-featured-image-hint monospace">
                View image
              </span>
            </button>
          </figure>
        }
        <div class="post-column">
          <div class="post-byline">
            @if (showAuthorHeader) {
              <div class="post-author cursor-default">
                @if (this.identity.authorAvatar(post)) {
                  <img [src]="this.identity.authorAvatar(post)" alt="" class="author-avatar">
                }
                <div>
                  <span class="post-author-name">{{ this.identity.authorName(post) }}</span>
                  <span class="post-author-tier text-muted">{{ this.identity.authorTier(post) }}</span>
                </div>
              </div>
            }
            <div class="post-share">
              @if (commentCount() > 0) {
                <button type="button" class="share-link" (click)="commentViewer()?.reveal()">{{ commentCount() }} {{ commentCount() === 1 ? 'comment' : 'comments' }}</button>
                <span class="text-muted" aria-hidden="true">&middot;</span>
              }
              <button type="button" class="share-link" (click)="share()">Share</button>
            </div>
          </div>
          <div class="post-content" [innerHTML]="post!.content.rendered | safeHtml"></div>
        </div>
      </div>
      <div class="card-footer px-sm-2 px-md-5 pb-sm-2 pb-md-5">
        @if (showBlogNav && (previousPost || nextPost)) {
          <nav class="post-nav d-flex flex-column flex-md-row justify-content-between gap-3 mt-4" aria-label="More posts">
            @if (previousPost) {
              <a class="post-nav-link text-decoration-none" [routerLink]="['/blog', previousPost.slug]">
                <small class="text-muted monospace d-block"><span aria-hidden="true">&larr;</span> Older post</small>
                <span class="link-primary" [innerHTML]="previousPost.title.rendered"></span>
              </a>
            } @else {
              <span></span>
            }
            @if (nextPost) {
              <a class="post-nav-link text-decoration-none text-md-end" [routerLink]="['/blog', nextPost.slug]">
                <small class="text-muted monospace d-block">Newer post <span aria-hidden="true">&rarr;</span></small>
                <span class="link-primary" [innerHTML]="nextPost.title.rendered"></span>
              </a>
            }
          </nav>
        }
        @if (showAuthorFooter) {
          <div class="d-flex mt-4 justify-content-center cursor-default w-100">
            <p>
              See more from&nbsp;
              <a [routerLink]="['/blog/author', identity.slugifyName(identity.authorName(post))]" class="link-primary cursor-pointer text-decoration-none">
                @if (this.identity.authorAvatar(post)) {
                  <img [src]="this.identity.authorAvatar(post)" alt="" class="author-avatar-button">&nbsp;
                }
                {{ this.identity.authorName(post).trimEnd() }}</a>, or&nbsp;<a class="link-primary cursor-pointer text-decoration-none" routerLink="/blog">See More Posts</a>
            </p>
          </div>
        }
        @if (showComments) {
          <commentViewer [postId]="post!.id" (loaded)="commentCount.set($event)"></commentViewer>
        }
      </div>
    </div>

    @if (lightboxImageSrc(); as fullImageSrc) {
      <app-lightbox [images]="[fullImageSrc]" label="Featured image" [alt]="featured.alt(post) || 'Featured image'" (close)="closeLightbox()"></app-lightbox>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host {
      --app-radius: 0.5rem;
    }

    .post-column > .post-byline {
      grid-column: full;
    }

    .post-byline {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin: 0.5rem 0 1.75rem;
    }

    .post-author {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding-left: 1rem;
      border-left: 3px solid var(--doc-link-red, #ff5252);
    }

    .post-author-name {
      display: block;
      font-weight: 600;
      font-size: 1.1rem;
      line-height: 1.3;
    }

    .post-author-tier {
      display: block;
      font-size: 0.9rem;
    }

    .author-avatar {
      height: 56px;
      width: auto;
      border-radius: 45%;
      filter: brightness(110%);
    }

    .post-share {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .share-link {
      background: none;
      border: 0;
      padding: 0;
      font: inherit;
      font-weight: 600;
      color: var(--doc-link-red, #ff5252);
      text-decoration: underline;
      text-underline-offset: 0.18em;
      text-decoration-thickness: 1px;
      cursor: pointer;
    }

    .share-link:hover {
      text-decoration-thickness: 2px;
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

    .post-column {
      display: grid;
      grid-template-columns:
        [full-start] minmax(0, 1fr)
        [content-start] min(72ch, 100%)
        [content-end] minmax(0, 1fr)
        [full-end];
    }
    .post-column > * {
      grid-column: content;
    }
    .post-content {
      display: contents;
    }

    .post-featured-image-wrap {
      margin: 1rem 0 1.5rem;
    }

    .post-back-link {
      display: inline-block;
      margin-bottom: 0.75rem;
    }

    .post-nav-link {
      display: block;
      max-width: 48%;
    }

    @media (max-width: 767px) {
      .post-nav-link { max-width: 100%; }
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
      height: auto;
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

    :host-context(html.reduce-motion) .post-featured-image {
      transition: none;
    }
  `]
})
export class PostViewer {
  @Input() post!: post;
  @Input() showAuthorHeader = true;
  @Input() showAuthorFooter = true;
  @Input() showComments = true;
  @Input() showBlogNav = false;
  @Input() previousPost: adjacentPost | null = null;
  @Input() nextPost: adjacentPost | null = null;
  lightboxImageSrc = signal<string | null>(null);
  commentCount = signal(0);
  commentViewer = viewChild(CommentViewer);
  readonly featuredImageSizes = '(max-width: 1023px) 100vw, 930px';

  constructor(
    public featured: FeaturedImageService,
    public identity: IdentityService,
    private alertService: AlertService
  ){}

  async share(): Promise<void> {
    const url = `${location.origin}${location.pathname}`;
    const title = plainText(this.post.title.rendered);
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      this.alertService.addAlert('success', 'Link copied to your clipboard.', true);
    } catch {
      this.alertService.addAlert('info', `Copy this link to share: ${url}`, true);
    }
  }

  featuredImageSrc(): string | undefined {
    return this.featured.image(this.post) ?? undefined;
  }

  openLightbox(imageSrc: string): void {
    this.lightboxImageSrc.set(imageSrc);
  }

  closeLightbox(): void {
    this.lightboxImageSrc.set(null);
  }

}
