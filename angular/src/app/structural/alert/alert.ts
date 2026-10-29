import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'alert',
  imports: [ NgClass ],
  templateUrl: './alert.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert.css'
})
export class AlertComponent {

  constructor(public alertService: AlertService) {}

  dismiss(id: number) {
    this.alertService.removeAlert(id);

  }

}
