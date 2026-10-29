import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

// Service Imports
import { ApiService } from '../../services/api-service';

// Component Imports
import { PostPreviewer } from '../blog/post-viewers/post-previewer';

// Model Imports
import { post } from '../../models/post-model';


@Component({
  selector: 'landing',
  imports: [ PostPreviewer, RouterLink ],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './landing.css'
})
export class Landing {
  posts = signal<post[]>([]);
  isLoading = signal<boolean>(false);
  readonly skeletonCards = [0, 1, 2];

  constructor( private api: ApiService ) {}

  ngOnInit(): void {
    this.isLoading.set(true);
    this.api.getRecentPosts().subscribe({
      next: (posts: post[]) => this.posts.set(posts),
      complete: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false),
    });
  }

}
