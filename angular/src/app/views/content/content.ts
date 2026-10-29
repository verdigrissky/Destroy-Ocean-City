import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

// Service Imports
import { ApiService } from '../../services/api-service';
import { AlertService } from '../../services/alert-service';
import { TitleService } from '../../services/title-service';

// Component Imports
import { PostViewer } from '../blog/post-viewers/post-viewer';

// Model Imports
import { post } from '../../models/post-model';

@Component({
  selector: 'contentViewer',
  imports: [ PostViewer ],
  styleUrl: './content.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (isLoading()) {
      <article class="card paper px-0 mb-4 mx-auto content-loading">
        <div class="card-body p-sm-2 p-md-5">
          <div class="content-sk-title shimmer"></div>
          <div class="content-sk-date shimmer"></div>
          <div class="content-sk-lines">
            <div class="content-sk-line shimmer"></div>
            <div class="content-sk-line shimmer"></div>
            <div class="content-sk-line short shimmer"></div>
            <div class="content-sk-line shimmer"></div>
            <div class="content-sk-line shimmer"></div>
            <div class="content-sk-line medium shimmer"></div>
          </div>
        </div>
      </article>
    } @else if (contentPost) {
      <postViewer [post]="contentPost" [showAuthorHeader]="false" [showAuthorFooter]="false" [showComments]="false"></postViewer>
    }
  `
})
export class Content implements OnInit, OnDestroy {

  isLoading = signal(true);
  contentPost: post | null = null;
  private fragment: string | null = null;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private alertService: AlertService,
    private titleService: TitleService
  ) {}

  ngOnInit() {
    this.subs.add(
      this.route.fragment.subscribe(f => { this.fragment = f; })
    );

    this.subs.add(
      this.route.paramMap.subscribe(params => {
        const slug = params.get('contentSlug');
        if (!slug) return;

        this.isLoading.set(true);
        this.contentPost = null;

        this.apiService.getContentBySlug(slug).subscribe({
          next: posts => {
            if (posts.length > 0) {
              this.contentPost = this.withInjectedAnchors(posts[0]);
              this.titleService.setCustomSiteTitle(posts[0].title.rendered);
            } else {
              this.alertService.addAlert('error', `Content "${slug}" could not be found.`);
            }
          },
          error: () => {
            this.alertService.addAlert('error', `Failed to load content "${slug}".`);
            this.isLoading.set(false);
          },
          complete: () => {
            this.isLoading.set(false);
            if (this.contentPost && this.fragment) {
              this.scheduleScrollToFragment(this.fragment);
            }
          }
        });
      })
    );
  }

  // Parses the post HTML and stamps id="item-N" on <p> elements that lack one.
  // IDs are injected before Angular renders the content so bypassSecurityTrustHtml
  // in SafeHtmlPipe preserves them through the [innerHTML] binding.
  private withInjectedAnchors(p: post): post {
    const doc = new DOMParser().parseFromString(p.content.rendered, 'text/html');
    let index = 1;
    doc.querySelectorAll<HTMLParagraphElement>('p').forEach(p => {
      if (!p.id) p.id = `item-${index}`;
      index++;
    });
    return { ...p, content: { rendered: doc.body.innerHTML } };
  }

  // Waits two frames for Angular to flush [innerHTML], then scrolls to the target
  // paragraph and applies the focus class (which transitions it to a larger size).
  private scheduleScrollToFragment(fragment: string): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = document.getElementById(fragment);
        if (!target) return;
        target.classList.add('content-anchor-focus');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  ngOnDestroy() {
    this.titleService.resetSiteTitle();
    this.subs.unsubscribe();
  }

}
