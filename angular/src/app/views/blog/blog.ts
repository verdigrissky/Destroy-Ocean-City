import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Service Imports
import { ApiService } from '../../services/api-service';
import { IdentityService } from '../../services/identity-service';
import { TitleService } from '../../services/title-service';

// Component Imports
import { PostPreviewer } from './post-viewers/post-previewer';
import { PostViewer } from './post-viewers/post-viewer';

// Model Imports
import { post } from '../../models/post-model';
import { postComment } from '../../models/postComment-model';

export interface isolation {
  type: string;
  value: string;
}

@Component({
  selector: 'doc-blog',
  imports: [ PostPreviewer, PostViewer ],
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
  comments = signal<postComment[]>([]);
  posts = signal<post[]>([]);
  sortNewestFirst = signal<boolean>(true);
  isLoadingSinglePost = signal<boolean>(false);
  isLoadingPosts = signal<boolean>(false);
  readonly skeletonCards = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  private resizeObserver?: ResizeObserver;
  private layoutFrameId: number | null = null;
  private shouldAutoScrollOnInitialLoad = true;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public identity: IdentityService,
    private router: Router,
    private ngZone: NgZone,
    private titleService: TitleService
  ) {}

  ngOnInit(): void {
    this.shouldAutoScrollOnInitialLoad = true;
    this.getPosts();

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

  getPosts(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    const authorName = this.route.snapshot.paramMap.get('authorName')?.trim();

    if (slug) {
      this.isLoadingSinglePost.set(true);
      this.isLoadingPosts.set(false);
      this.post.set(null);
      this.api.getPostBySlug(slug).subscribe({
        next: ({ post, comments }) => {
          this.post.set(post);
          this.comments.set(comments);
          this.titleService.setCustomSiteTitle(post.title.rendered);
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
      this.api.getPostsByAuthorName(authorName).subscribe({
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
      this.api.getPosts(promotedTagId).subscribe({
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
