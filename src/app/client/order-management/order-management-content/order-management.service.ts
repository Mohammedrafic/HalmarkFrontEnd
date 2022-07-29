import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderManagementService {
  public readonly orderPerDiemId$: Subject<number> = new Subject<number>();
  public excludeDeployed: boolean;
}
