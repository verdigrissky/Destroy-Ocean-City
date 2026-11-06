import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;

  const render = (html: string): string => {
    const host = document.createElement('div');
    host.innerHTML = (pipe.transform(html) as any).changingThisBreaksApplicationSecurity;
    return host.innerHTML;
  };

  beforeEach(() => {
    pipe = new SafeHtmlPipe(TestBed.inject(DomSanitizer));
  });

  it('removes scripts, event handlers and javascript: URLs', () => {
    const out = render('<p>ok</p><script>alert(1)</script><img src="x.png" onerror="alert(1)"><a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('<p>ok</p>');
  });

  it('removes form controls', () => {
    const out = render('<form action="https://evil.example"><input name="password"><button>Log in</button></form>');
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
    expect(out).not.toContain('<button');
  });

  it('keeps ids, site classes and image attributes used by CMS content', () => {
    const out = render('<p id="item-1" class="content-anchor-focus">a</p><figure><img src="a.jpg" srcset="a.jpg 1x" alt="A" width="10" height="10"></figure>');
    expect(out).toContain('id="item-1"');
    expect(out).toContain('class="content-anchor-focus"');
    expect(out).toContain('srcset="a.jpg 1x"');
    expect(out).toContain('alt="A"');
  });

  it('turns display-styled paragraphs into pull quotes hidden from screen readers', () => {
    const out = render(
      '<p class="wp-block-paragraph">Body text.</p>' +
      '<p class="is-style-text-display is-style-text-display--1 wp-block-paragraph">Red, blue, green&#8230; <em>all wind industry colors</em>.</p>'
    );
    const host = document.createElement('div');
    host.innerHTML = out;
    const [body, quote] = Array.from(host.querySelectorAll('p'));
    expect(body.className).toBe('');
    expect(body.hasAttribute('aria-hidden')).toBe(false);
    expect(quote.className).toBe('pull-quote');
    expect(quote.getAttribute('aria-hidden')).toBe('true');
    expect(quote.querySelector('em')?.textContent).toBe('all wind industry colors');
  });

  it('strips editor-generated class names that would identify the CMS', () => {
    const out = render(
      '<p class="wp-block-paragraph">a</p>' +
      '<hr class="wp-block-separator has-alpha-channel-opacity">' +
      '<figure class="wp-block-image size-full aligncenter"><img class="wp-image-62 keep-me" src="a.jpg"></figure>' +
      '<blockquote class="wp-block-quote is-layout-flow">q</blockquote>'
    );
    expect(out).not.toMatch(/wp-|has-|is-layout|size-full|aligncenter/);
    expect(out).not.toContain('class=""');
    expect(out).toContain('class="keep-me"');
  });
});
