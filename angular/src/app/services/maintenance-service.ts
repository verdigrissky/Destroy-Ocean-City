import { computed, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';

export type BackendStatus = 'ok' | 'maintenance' | 'outage';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {

  private apiHost = 'api.destroyocean.city';
  private probeUrl = `https://${this.apiHost}/json/posts?per_page=1&_fields=id`;
  private probeTimeoutMs = 3000;

  // Unreachable (0) and gateway errors where Cloudflare can't get a usable answer from the origin
  private outageStatuses = new Set([0, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530]);

  status = signal<BackendStatus>('ok');
  down = computed(() => this.status() !== 'ok');

  constructor(private http: HttpClient) { }

  // Matches the lockdown response nginx serves: 503 + {"code":"backend_offline"}
  isOfflineResponse(error: unknown): boolean {
    return error instanceof HttpErrorResponse
      && error.status === 503
      && error.error?.code === 'backend_offline';
  }

  isOutageResponse(url: string, error: unknown): boolean {
    return error instanceof HttpErrorResponse
      && this.outageStatuses.has(error.status)
      && new URL(url, location.href).host === this.apiHost;
  }

  // Planned maintenance takes precedence over a generic outage
  report(status: Exclude<BackendStatus, 'ok'>) {
    if (this.status() !== 'maintenance') {
      this.status.set(status);
    }
  }

  // Runs before first render. The interceptor sets `status`; a slow probe fails open.
  probe(): Promise<unknown> {
    return firstValueFrom(
      this.http.get(this.probeUrl).pipe(
        timeout(this.probeTimeoutMs),
        catchError(() => of(null))
      )
    );
  }
}
