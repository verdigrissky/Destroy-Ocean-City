import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, Observable, throwError, switchMap, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertService } from './alert-service';
import { MaintenanceService } from './maintenance-service';
import { adjacentPost, post } from '../models/post-model';
import { postComment } from '../models/postComment-model';
import { hero } from '../models/hero-model';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private backendUrl = 'https://api.destroyocean.city/json';
  private dropshipUrl = 'https://dropship.destroyocean.city';
  private promotedId = 14;
  private unpromotedId = 1;
  private promotedBlogId = 2;
  private promotedContentId = 13;
  private promotedHeroId = 4;
  private promotedUiId = 3;

  constructor(private http: HttpClient, private alertService: AlertService, private maintenance: MaintenanceService) { }

  getPosts(tagId: number): Observable<post[]> {
    return this.http
      .get<post[]>(`${this.backendUrl}/posts?categories=${this.promotedBlogId}&per_page=100&_embed`)
      .pipe(
        map(posts => posts || []),
        catchError(err => this.handleError(err, `fetching posts for Promoted tag ${tagId}.`))
      );
  }

  getPostBySlug(slug: string): Observable<post | null> {
    return this.http
      .get<post[]>(`${this.backendUrl}/posts?slug=${encodeURIComponent(slug)}&categories=${this.promotedBlogId}&_embed`)
      .pipe(
        map(posts => posts?.[0] ?? null),
        catchError(err => this.handleError(err, `loading post with slug ${slug}.`))
      );
  }

  getAdjacentPosts(current: post): Observable<{ previous: adjacentPost | null, next: adjacentPost | null }> {
    const base = `${this.backendUrl}/posts?categories=${this.promotedBlogId}&per_page=1&_fields=slug,title&orderby=date`;
    const date = encodeURIComponent(current.date);
    const first = (posts: adjacentPost[]) => posts?.[0] ?? null;
    return forkJoin({
      previous: this.http.get<adjacentPost[]>(`${base}&order=desc&before=${date}`).pipe(map(first)),
      next: this.http.get<adjacentPost[]>(`${base}&order=asc&after=${date}`).pipe(map(first)),
    }).pipe(
      catchError(() => of({ previous: null, next: null }))
    );
  }

  getRecentPosts(limit = 3): Observable<post[]> {
    return this.http
      .get<post[]>(`${this.backendUrl}/posts?per_page=${limit}&categories=${this.promotedBlogId}&_embed`)
      .pipe(
        map(posts => posts || []),
        catchError(err => this.handleError(err, 'fetching recent posts.'))
      );
  }

  getCommentsByPostId(postId: number): Observable<postComment[]> {
    return this.http
      .get<postComment[]>(`${this.backendUrl}/comments?post=${postId}&orderby=date&order=asc`)
      .pipe(
        map(posts => posts || []),
        catchError(err => this.handleError(err, `fetching comments for post ID ${postId}.`))
      );
  }

  getPostsByAuthorID(authorId: number): Observable<post[]> {
    return this.http
      .get<post[]>(`${this.backendUrl}/posts?author=${authorId}&categories=${this.promotedBlogId}&per_page=100&_embed`)
      .pipe(
        map(posts => posts || []),
        catchError(err => this.handleError(err, `fetching posts from author with ID ${authorId}.`))
      );
  }

  getPostsByAuthorName(name: string): Observable<post[]> {
    return this.getAuthorByName(name).pipe(
      switchMap(author => {
        if (!author) return of([]);
        return this.getPostsByAuthorID(author.id);
      })
    );
  }

  getAuthorByName(nameOrSlug: string): Observable<any> {
    const slug = nameOrSlug.toLowerCase().replace(/\s+/g, '-');
    return this.http
      .get<any[]>(`${this.backendUrl}/users?per_page=100`)
      .pipe(
        map(users => users.find(u => u.name.toLowerCase().replace(/\s+/g, '-') === slug) || null),
        catchError(err => this.handleError(err, `fetching author with slug ${nameOrSlug}.`))
      );
  }

  getContentBySlug(slug: string): Observable<post[]> {
    return this.http.get<post[]>(`${this.backendUrl}/posts?slug=${slug}&categories=${this.promotedContentId}&_embed`);
  }

  getHeroes(): Observable<hero[]> {
    return this.http
      .get<any[]>(`${this.backendUrl}/posts?categories=${this.promotedHeroId}&_embed`)
      .pipe(
        map(posts => posts
          .map(post => ({
            id: post.id,
            slug: post.slug,
            name: post.title?.rendered ?? '',
            tier: post.acf?.hero_tier ?? '',
            excerpt: post.content?.rendered ?? '',
            order: post.acf?.hero_order ?? 0,
            facts: [
              post.acf?.hero_fact_1 ?? '',
              post.acf?.hero_fact_2 ?? '',
              post.acf?.hero_fact_3 ?? '',
            ].filter(f => f !== ''),
            media: post._embedded?.['media']?.[0] ?? {},
          } as hero))
          .sort((a, b) => a.order - b.order)
        ),
        catchError(err => this.handleError(err, 'fetching heroes.'))
      );
  }

  private handleError(error: any, context: string) {
    console.error(`API error while ${context}:`, error);

    if (this.maintenance.down()) {
      return throwError(() => error);
    }

    let message = 'An unexpected error occurred while communicating with the backend API.';

    if (error instanceof HttpErrorResponse) {
      message = `API Service encountered an error (${error.status}) while ${context}.`;
      if (error.error?.message) {
        message += ` Details: ${error.error.message}`;
      }
    }
    this.alertService.addAlert('error', message, true);
    return throwError(() => error);
  }
}