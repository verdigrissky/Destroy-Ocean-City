import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

// Service Imports
import { FeaturedImageService } from '../../../services/featuredImage-service';
import { IdentityService } from '../../../services/identity-service';

// Model Imports
import { post } from '../../../models/post-model';

@Component({
  selector: 'postPreviewer',
  imports: [ RouterLink, NgClass ],
  template: `
    @if (this.featured.image(post); as featuredImage) {
      <div class="cursor-pointer featured-image-wrap sk-img-wrap" [ngClass]="cropFeaturedImage ? 'previewer-image-crop' : ''" [class.image-loading]="!isImageLoaded(post.id, featuredImage)" [routerLink]="['/blog/', post.slug]">
        <img [src]="featuredImage" class="card-img-top featured-image" [class.image-loaded]="isImageLoaded(post.id, featuredImage)" (load)="onImageLoad(post.id, featuredImage)" alt="Featured image">
      </div>
    } @else if (cropFeaturedImage) {
      <div class="cursor-pointer previewer-image-crop featured-image-wrap sk-img-wrap" [class.image-loading]="!isImageLoaded(post.id, fallbackImage(post.id))" [routerLink]="['/blog/', post.slug]">
        <img [src]="fallbackImage(post.id)" class="card-img-top featured-image" [class.image-loaded]="isImageLoaded(post.id, fallbackImage(post.id))" (load)="onImageLoad(post.id, fallbackImage(post.id))" alt="Featured image">
      </div>
    }
    <div class="card-body">
      <a class="cursor-pointer" [routerLink]="['/blog/', post.slug]">
        <h4 [innerHTML]="post.title.rendered"></h4>
      </a>
      <blockquote class="blockquote mb-0">
        <p class="cursor-default" [innerHTML]="post.excerpt.rendered"></p>
        <footer class="blockquote-footer cursor-default mt-4">
          @if (this.identity.authorAvatar(post)) {
            <img [src]="this.identity.authorAvatar(post)" alt="Author avatar" class="rounded-circle" width="48" height="48">
          }
          {{ this.identity.authorName(post) }}
        </footer>
      </blockquote>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .featured-image-wrap {
      cursor: pointer;
    }

    .card-body a {
      cursor: pointer;
    }

    .featured-image {
      display: block;
      width: 100%;
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

    @media (prefers-reduced-motion: reduce) {
      .featured-image {
        transition: none;
      }
    }
  `]
})
export class PostPreviewer {
  @Input() post!: post;
  @Input() cropFeaturedImage: boolean = false;
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
