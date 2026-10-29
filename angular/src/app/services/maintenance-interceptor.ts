import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MaintenanceService } from './maintenance-service';

export const maintenanceInterceptor: HttpInterceptorFn = (req, next) => {
  const maintenance = inject(MaintenanceService);

  return next(req).pipe(
    catchError(err => {
      if (maintenance.isOfflineResponse(err)) {
        maintenance.report('maintenance');
      } else if (maintenance.isOutageResponse(req.url, err)) {
        maintenance.report('outage');
      }
      return throwError(() => err);
    })
  );
};
