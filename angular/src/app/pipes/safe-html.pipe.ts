import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'option'],
  FORBID_ATTR: ['formaction'],
};

const CMS_CLASS = /^(wp-|has-|is-layout-|is-style-|size-|align(left|right|center|wide|full|none)$)/;

const PULL_QUOTE_CLASS = /^is-style-text-display/;

DOMPurify.addHook('afterSanitizeAttributes', node => {
  if (!(node instanceof Element) || !node.hasAttribute('class')) return;
  const isPullQuote = Array.from(node.classList).some(name => PULL_QUOTE_CLASS.test(name));
  const kept = Array.from(node.classList).filter(name => !CMS_CLASS.test(name));
  if (isPullQuote) {
    kept.push('pull-quote');
    node.setAttribute('aria-hidden', 'true');
  }
  if (kept.length) {
    node.setAttribute('class', kept.join(' '));
  } else {
    node.removeAttribute('class');
  }
});

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    const clean = DOMPurify.sanitize(value ?? '', PURIFY_CONFIG);
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
