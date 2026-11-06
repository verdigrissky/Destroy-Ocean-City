import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CommentViewer } from './comment-viewer';
import { ApiService } from '../../../services/api-service';
import { postComment } from '../../../models/postComment-model';

describe('CommentViewer', () => {
  const comment = (id: number, author_name: string): postComment => ({
    id, post: 1, parent: 0, author_name, author_url: '', date: '2026-05-05T16:26:21',
    content: { rendered: '<p>Hello</p>' },
  });

  const render = (comments: postComment[], pick: number) => {
    vi.spyOn(Math, 'random').mockReturnValue(pick);
    TestBed.configureTestingModule({
      imports: [CommentViewer],
      providers: [{ provide: ApiService, useValue: { getCommentsByPostId: () => of(comments) } }],
    });
    const fixture = TestBed.createComponent(CommentViewer);
    fixture.componentInstance.postId = 1;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {} }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses the singular form when one local wrote every comment', () => {
    const el = render([comment(1, 'Simon'), comment(2, 'Simon')], 0);
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('What One Real Local Has to Say:');
  });

  it('counts different commenters for people and every comment for comments', () => {
    const comments = [comment(1, 'Simon'), comment(2, 'Simon'), comment(3, 'Rupert')];
    expect(render(comments, 0).querySelector('h2')?.textContent?.trim()).toBe('What Two Real Locals Have to Say:');
    TestBed.resetTestingModule();
    expect(render(comments, 0.6).querySelector('h2')?.textContent?.trim()).toBe('Three Dispatches from the Boardwalk:');
  });

  it('uses digits above ten', () => {
    const comments = Array.from({ length: 12 }, (_, i) => comment(i + 1, `Local ${i}`));
    expect(render(comments, 0).querySelector('h2')?.textContent?.trim()).toBe('What 12 Real Locals Have to Say:');
  });

  it('decodes HTML entities in commenter names', () => {
    const el = render([comment(1, 'Bubba&#8217;s Bar &amp; Grille with an E')], 0);
    expect(el.querySelector('.comment-author')?.textContent).toBe('Bubba’s Bar & Grille with an E');
  });
});
