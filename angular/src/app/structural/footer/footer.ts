import { Component, VERSION, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { version } from '../../../../package.json';

@Component({
  selector: 'doc-footer',
  imports: [ RouterLink ],
  template: `
  <footer class="my-4">
    <div class="container px-md-5 px-sm-1">
      <hr>
      <div class="d-flex flex-wrap justify-content-between align-items-center">
        <div class="col-md-4 d-flex justify-content-start">
          <p class="mb-3 mb-md-0 text-body-secondary cursor-default">
            © {{currentYear}}&nbsp;
            <small class="m-0 version-text cursor-default monospace">
              {{versionString}}
            </small>
          </p>
        </div>
        <div class="col-md-4 d-flex align-items-center gap-2 justify-content-end">
          <span class="south-link mr-2" [routerLink]="['/content/press']">
            <i class="bi bi-camera"></i>&nbsp;Press Kit
          </span>
          <span class="south-link" [routerLink]="['/privacy']">
            <i class="bi bi-shield-check"></i>&nbsp;Privacy
          </span>
        </div>
      </div>
    </div>
  </footer>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .south-link {
      color: #ff5252;
      cursor: pointer;
    }
  `
})
export class Footer {

  versionString: string = `ng ${VERSION.full} app ${version}`;
  currentYear: number = new Date().getFullYear();

}
