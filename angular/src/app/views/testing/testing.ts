import { Component, ChangeDetectionStrategy } from '@angular/core';

import { AlertService } from '../../services/alert-service';
import { ApiService } from '../../services/api-service';

@Component({
  selector: 'app-testing',
  imports: [],
  templateUrl: './testing.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './testing.css'
})
export class Testing {

  constructor(private alertService: AlertService, private api: ApiService) {}

  generateError(type: 'success' | 'error' | 'warning' | 'info') {
    this.alertService.addAlert(type, `Test ${type} alert`, true);

  }

}
