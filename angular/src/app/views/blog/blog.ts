import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

// Service Imports
import { ApiService } from '../../services/api-service';
import { IdentityService } from '../../services/identity-service';
import { TitleService } from '../../services/title-service';
import { ThemeService } from '../../services/theme-service';

// Component Imports
import { PostPreviewer } from './post-viewers/post-previewer';
import { PostViewer } from './post-viewers/post-viewer';

// Model Imports
import { adjacentPost, post } from '../../models/post-model';

export interface isolation {
  type: string;
  value: string;
}

@Component({
  selector: 'doc-blog',
  imports: [ PostPreviewer, PostViewer, RouterLink ],
  templateUrl: './blog.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './blog.css'
})
export class Blog implements AfterViewInit, OnDestroy {
  @ViewChild('postsGrid') postsGrid?: ElementRef<HTMLElement>;

  private readonly defaultHeading = 'See what our Experts have to Say:';
  heading: string = this.defaultHeading;
  isolation: isolation | null = null;
  post = signal<post | null>(null);
  postNotFound = signal<boolean>(false);
  previousPost = signal<adjacentPost | null>(null);
  nextPost = signal<adjacentPost | null>(null);
  posts = signal<post[]>([]);
  sortNewestFirst = signal<boolean>(true);
  isLoadingSinglePost = signal<boolean>(false);
  isLoadingPosts = signal<boolean>(false);
  readonly skeletonCards = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  private resizeObserver?: ResizeObserver;
  private layoutFrameId: number | null = null;
  private shouldAutoScrollOnInitialLoad = true;
  private loadSub?: Subscription;
  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public identity: IdentityService,
    private router: Router,
    private ngZone: NgZone,
    private titleService: TitleService,
    private theme: ThemeService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.shouldAutoScrollOnInitialLoad = true;
      this.getPosts(params);
    });

  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.scheduleMasonryLayout());

      const grid = this.postsGrid?.nativeElement;
      if (grid) {
        this.resizeObserver.observe(grid);
      }
    });

    this.scheduleMasonryLayout();
  }

  ngOnDestroy(): void {
    this.titleService.resetSiteTitle();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.layoutFrameId !== null) {
      cancelAnimationFrame(this.layoutFrameId);
      this.layoutFrameId = null;
    }
  }

  getPosts(params: ParamMap = this.route.snapshot.paramMap): void {
    const slug = params.get('slug');
    const authorName = params.get('authorName')?.trim();
    this.loadSub?.unsubscribe();
    this.postNotFound.set(false);
    this.previousPost.set(null);
    this.nextPost.set(null);

    if (slug) {
      this.isLoadingSinglePost.set(true);
      this.isLoadingPosts.set(false);
      this.post.set(null);
      this.loadSub = this.api.getPostBySlug(slug).subscribe({
        next: (post) => {
          if (!post) {
            this.postNotFound.set(true);
            this.titleService.setCustomSiteTitle('Post not found');
            return;
          }
          this.post.set(post);
          this.titleService.setCustomSiteTitle(post.title.rendered);
          this.api.getAdjacentPosts(post).subscribe(({ previous, next }) => {
            if (this.post() !== post) return;
            this.previousPost.set(previous);
            this.nextPost.set(next);
          });
        },
        complete: () => {
          this.isLoadingSinglePost.set(false);
          this.scrollToTopAfterInitialLoad();
        },
        error: () => {
          this.isLoadingSinglePost.set(false);
        }
      });
    } else if (authorName) {
      this.isLoadingSinglePost.set(false);
      this.post.set(null);
      this.isLoadingPosts.set(true);
      this.isolation = {type: 'author', value: authorName};
      this.loadSub = this.api.getPostsByAuthorName(authorName).subscribe({
        next: (posts) => {
          this.posts.set(this.sortPostsByDate(posts));
          if (posts.length > 0) {
            const displayName = this.identity.authorName(posts[0]);
            this.isolation = {type: 'author', value: displayName};
            this.heading = `See what <span class="oblique-author">${displayName}</span> has to Say:`;
          }
          this.scheduleMasonryLayout();
        },
        error: () => {
          this.isLoadingPosts.set(false);
        },
        complete: () => {
          this.isLoadingPosts.set(false);
          this.scrollToTopAfterInitialLoad();
        }
      });
    } else {
      this.isLoadingSinglePost.set(false);
      this.post.set(null);
      this.isolation = null;
      this.heading = this.defaultHeading;
      this.isLoadingPosts.set(true);
      const promotedTagId = 123;
      this.loadSub = this.api.getPosts(promotedTagId).subscribe({
        next: (posts) => {
          this.posts.set(this.sortPostsByDate(posts));
          this.scheduleMasonryLayout();
        },
        error: () => {
          this.isLoadingPosts.set(false);
        },
        complete: () => {
          this.isLoadingPosts.set(false);
          this.scrollToTopAfterInitialLoad();
        }
      });
    }

  }

  clearIsolation(): void {
    if (!this.isolation) {
      return;
    }
    this.router.navigate(['/blog']);
  }

  toggleSortOrder(): void {
    this.sortNewestFirst.set(!this.sortNewestFirst());
    this.posts.set(this.sortPostsByDate(this.posts()));
    this.scheduleMasonryLayout();
  }

  private sortPostsByDate(posts: post[]): post[] {
    const sorted = [...posts].sort((a, b) => {
      const aDate = this.getPostTimestamp(a);
      const bDate = this.getPostTimestamp(b);
      return this.sortNewestFirst() ? bDate - aDate : aDate - bDate;
    });

    return sorted;
  }

  private getPostTimestamp(value: post): number {
    const timestamp = Date.parse(value.date);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private scrollToTopAfterInitialLoad(): void {
    if (!this.shouldAutoScrollOnInitialLoad) {
      return;
    }

    this.shouldAutoScrollOnInitialLoad = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: this.theme.reducedMotion() ? 'auto' : 'smooth' });
      });
    });
  }

  private scheduleMasonryLayout(): void {
    if (this.layoutFrameId !== null) {
      cancelAnimationFrame(this.layoutFrameId);
    }

    this.layoutFrameId = requestAnimationFrame(() => {
      this.layoutFrameId = null;
      this.applyMasonryLayout();
    });
  }

  private applyMasonryLayout(): void {
    const grid = this.postsGrid?.nativeElement;
    if (!grid) {
      return;
    }

    const computedGridStyle = window.getComputedStyle(grid);
    const autoRows = Number.parseFloat(computedGridStyle.getPropertyValue('grid-auto-rows'));
    const rowGap = Number.parseFloat(computedGridStyle.getPropertyValue('row-gap'));

    if (!Number.isFinite(autoRows) || autoRows <= 0) {
      return;
    }

    const cards = grid.querySelectorAll<HTMLElement>('.post-card');
    cards.forEach((card) => {
      card.style.gridRowEnd = 'span 1';

      const cardHeight = card.getBoundingClientRect().height;
      const span = Math.max(1, Math.ceil((cardHeight + rowGap) / (autoRows + rowGap)));
      card.style.gridRowEnd = `span ${span}`;

      if (this.resizeObserver) {
        this.resizeObserver.observe(card);
      }
    });
  }

}
