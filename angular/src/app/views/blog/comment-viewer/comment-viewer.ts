import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';

// Service Imports
import { ApiService } from '../../../services/api-service';
import { StreetService } from '../../../services/street-service';

// Model Imports
import { postComment } from '../../../models/postComment-model';

@Component({
  selector: 'commentViewer',
  imports: [ DatePipe ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
  @if (comments.length > 0) {
    <section>
      <h5 class="mt-4 mb-2 text-secondary cursor-default">
        <i class="bi bi-life-preserver text-primary"></i> What Real Locals Have to Say:
      </h5>
      <div class="mb-4">
        @for (comment of comments; track comment.id) {
          <div class="card mb-2">
            <div class="card-body">
              <h6 class="cursor-default mt-0 mb-1">
                <img src="anonymous.jpg" alt="{{ comment.author_name }}'s Avatar" class="rounded-circle" width="32" height="32">
                &emsp;{{ comment.author_name }}
                <small class="text-muted">
                  &emsp;&mdash;
                  &emsp;{{ comment.date | date:'EEEE, MMMM d' }}
                  &emsp;<i class="bi bi-brightness-high"></i>
                  &emsp;{{ streetMap[comment.author_name] }}, Ocean City
                </small>
              </h6>
              <div [innerHTML]="comment.content.rendered"></div>
            </div>
          </div>
        }
      </div>
    </section>
  }
  `
})
export class CommentViewer {
  @Input() postId!: number;
  comments: postComment[] = [];
  streetMap: Record<string, string> = {};
  loading = true;

  constructor(
    private apiService: ApiService,
    private streetService: StreetService
  ){}

  ngOnInit(): void {
    if (this.postId) {
      this.apiService.getCommentsByPostId(this.postId).subscribe({
        next: (res) => {
          this.comments = res;
          for (const comment of res) {
            this.streetMap[comment.author_name] = this.streetService.getStreetForAuthor(comment.author_name);
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching comments:', err);
          this.loading = false;
        }
      });
    }
  }

}
