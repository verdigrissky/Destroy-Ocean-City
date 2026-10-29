import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TitleService } from '../../services/title-service';

@Component({
  selector: 'app-privacy',
  imports: [ DatePipe ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './privacy.html'
})
export class Privacy implements OnInit, OnDestroy {

  public currentDate = new Date();

  constructor(private titleService: TitleService) {}

  ngOnInit() {
    this.titleService.setCustomSiteTitle('Privacy Policy');
  }

  ngOnDestroy() {
    this.titleService.resetSiteTitle();
  }

}
