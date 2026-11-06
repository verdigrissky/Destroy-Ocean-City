import { Component, Input, ChangeDetectionStrategy, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

// Service Imports
import { ApiService } from '../../../services/api-service';
import { StreetService } from '../../../services/street-service';
import { ThemeService } from '../../../services/theme-service';

// Pipe Imports
import { SafeHtmlPipe } from '../../../pipes/safe-html.pipe';

// Model Imports
import { postComment } from '../../../models/postComment-model';
import { plainText } from '../../../shared/plain-text';

type HeadingCounts = { comments: number; people: number };

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const count = (n: number) => NUMBER_WORDS[n] ?? String(n);

const HEADINGS: ((c: HeadingCounts) => string)[] = [
  ({ people }) => people === 1
    ? 'What One Real Local Has to Say:'
    : `What ${count(people)} Real Locals Have to Say:`,
  ({ people }) => people === 1
    ? 'One Commenter, Straight from Ocean City:'
    : `${count(people)} Commenters, Straight from Ocean City:`,
  ({ people }) => people === 1
    ? 'One Local Weighs In:'
    : `${count(people)} Locals Weigh In:`,
  ({ comments }) => comments === 1
    ? 'One Dispatch from the Boardwalk:'
    : `${count(comments)} Dispatches from the Boardwalk:`,
  ({ people }) => people === 1
    ? 'One Ocean City Resident Sounds Off:'
    : `${count(people)} Ocean City Residents Sound Off:`,
  ({ comments }) => comments === 1
    ? 'One Comment from the Seawall:'
    : `${count(comments)} Comments from the Seawall:`,
];

@Component({
  selector: 'commentViewer',
  imports: [ DatePipe, SafeHtmlPipe ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
  @if (comments.length > 0) {
    <section #section class="comments" aria-labelledby="comments-heading" tabindex="-1">
      <h2 id="comments-heading" class="h5 comments-heading text-secondary cursor-default">
        <i class="bi bi-life-preserver text-primary" aria-hidden="true"></i> {{ heading }}
      </h2>
      <ol class="comment-list">
        @for (comment of comments; track comment.id) {
          <li class="comment">
            <div class="comment-byline cursor-default">
              <img src="anonymous.jpg" alt="" class="comment-avatar" width="40" height="40">
              <div>
                <span class="comment-author">{{ comment.author_name }}</span>
                <span class="comment-meta text-muted monospace">
                  <i class="bi bi-brightness-high" aria-hidden="true"></i>
                  {{ streetMap[comment.author_name] }}, Ocean City
                  <span aria-hidden="true">&middot;</span>
                  <time [attr.datetime]="comment.date">{{ comment.date | date:'EEEE, MMMM d' }}</time>
                </span>
              </div>
            </div>
            <div class="comment-body" [innerHTML]="comment.content.rendered | safeHtml"></div>
          </li>
        }
      </ol>
    </section>
  }
  `,
  styles: `
    :host {
      display: block;
      max-width: 72ch;
      margin: 0 auto;
    }

    .comments {
      margin-top: 2.5rem;
    }

    .comments:focus {
      outline: none;
    }

    .comments-heading {
      margin-bottom: 0.5rem;
    }

    .comment-list {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem;
    }

    .comment {
      padding: 1.25rem 0;
    }

    .comment + .comment {
      border-top: 1px solid var(--bs-border-color);
    }

    .comment-byline {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.6rem;
    }

    .comment-avatar {
      border-radius: 45%;
      flex-shrink: 0;
    }

    .comment-author {
      display: block;
      font-weight: 600;
      line-height: 1.3;
    }

    .comment-meta {
      display: block;
      font-size: 0.85rem;
    }
  `
})
export class CommentViewer {
  @Input() postId!: number;
  @Output() loaded = new EventEmitter<number>();
  @ViewChild('section') private section?: ElementRef<HTMLElement>;
  comments: postComment[] = [];
  streetMap: Record<string, string> = {};
  heading = '';
  loading = true;
  private readonly pickHeading = HEADINGS[Math.floor(Math.random() * HEADINGS.length)];

  constructor(
    private apiService: ApiService,
    private streetService: StreetService,
    private theme: ThemeService
  ){}

  ngOnInit(): void {
    if (this.postId) {
      this.apiService.getCommentsByPostId(this.postId).subscribe({
        next: (res) => {
          this.comments = res.map(comment => ({ ...comment, author_name: plainText(comment.author_name) }));
          for (const comment of this.comments) {
            this.streetMap[comment.author_name] = this.streetService.getStreetForAuthor(comment.author_name);
          }
          this.heading = this.pickHeading({ comments: res.length, people: Object.keys(this.streetMap).length });
          this.loading = false;
          this.loaded.emit(res.length);
        },
        error: (err) => {
          console.error('Error fetching comments:', err);
          this.loading = false;
        }
      });
    }
  }

  reveal(): void {
    const section = this.section?.nativeElement;
    if (!section) return;
    section.scrollIntoView({ behavior: this.theme.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    section.focus({ preventScroll: true });
  }

}
