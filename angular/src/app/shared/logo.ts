import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'doc-logo',
  template: `<span class="destroy">Destroy</span>&nbsp;<span class="ocean-city">Ocean City!</span>`,
  host: { '[class.interactive]': 'interactive()' },
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    :host {
      display: inline-block;
      font-family: "Bowlby One", sans-serif;
      font-weight: 400;
      font-style: normal;
      font-variant: normal;
      font-synthesis: none;
      font-kerning: normal;
      letter-spacing: normal;
      word-spacing: normal;
      line-height: 1.2;
      text-transform: uppercase;
      text-decoration: none;
      text-align: inherit;
      text-indent: 0;
      white-space: nowrap;
      cursor: default;
      filter: drop-shadow(5px 5px 10px rgba(0, 0, 0, 0.75));
    }
    :host(.interactive) {
      cursor: pointer;
    }
    .destroy,
    .ocean-city {
      transition-duration: 0.5s;
    }
    .destroy {
      color: #ff5252;
      text-shadow:
        0 1px 0 hsl(0, 90%, 58%),
        0 2px 0 hsl(0, 75%, 54%),
        0 3px 0 hsl(0, 60%, 50%),
        0 4px 0 hsl(0, 45%, 46%),
        0 5px 0 hsl(0, 40%, 42%),
        0 6px 0 hsl(0, 35%, 38%),
        0 7px 0 hsl(0, 30%, 34%),
        0 8px 0 hsl(0, 25%, 30%);
    }
    .ocean-city {
      color: #f0f0f0;
      text-shadow:
        0 1px 0 hsl(0, 0%, 58%),
        0 2px 0 hsl(0, 0%, 54%),
        0 3px 0 hsl(0, 0%, 50%),
        0 4px 0 hsl(0, 0%, 46%),
        0 5px 0 hsl(0, 0%, 42%),
        0 6px 0 hsl(0, 0%, 38%),
        0 7px 0 hsl(0, 0%, 34%),
        0 8px 0 hsl(0, 0%, 30%);
    }
    :host(.interactive:hover) .destroy {
      color: #f0f0f0;
      filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.75));
      text-shadow:
        0 1px 0 hsl(0, 0%, 58%),
        0 2px 0 hsl(0, 0%, 54%),
        0 3px 0 hsl(0, 0%, 50%),
        0 4px 0 hsl(0, 0%, 46%),
        0 5px 0 hsl(0, 0%, 42%),
        0 6px 0 hsl(0, 0%, 38%),
        0 7px 0 hsl(0, 0%, 34%),
        0 8px 0 hsl(0, 0%, 30%);
    }
    :host(.interactive:hover) .ocean-city {
      color: #FF5252;
      filter: drop-shadow(0px 0px 10px rgba(255, 57, 57, 0.75));
      text-shadow:
        0 1px 0 hsl(0, 90%, 58%),
        0 2px 0 hsl(0, 75%, 54%),
        0 3px 0 hsl(0, 60%, 50%),
        0 4px 0 hsl(0, 45%, 46%),
        0 5px 0 hsl(0, 40%, 42%),
        0 6px 0 hsl(0, 35%, 38%),
        0 7px 0 hsl(0, 30%, 34%),
        0 8px 0 hsl(0, 25%, 30%);
    }
  `
})
export class Logo {
  interactive = input(false);
}
