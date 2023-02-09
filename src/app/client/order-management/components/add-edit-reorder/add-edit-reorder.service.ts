import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { Store } from '@ngxs/store';

import { AppState } from '../../../../store/app.state';
import { OrderManagementContentService } from '@shared/services/order-management-content.service';
import { OrderType } from '@shared/enums/order-type';
import { BillRate } from '@shared/models';
import { SidebarDialogTitlesEnum } from '@shared/enums/sidebar-dialog-titles.enum';
import { DateTimeHelper } from '@core/helpers';
import { AgencyModel, CandidateModel } from './models/candidate.model';
import { ReorderRequest, ReorderRequestModel, ReorderResponse } from './models/reorder.model';

@Injectable({
  providedIn: 'root',
})
export class AddEditReorderService {
  private readonly reOrderDialogTitle: BehaviorSubject<string> = new BehaviorSubject<string>(
    SidebarDialogTitlesEnum.AddReOrder
  );

  public get reOrderDialogTitle$(): Observable<string> {
    return this.reOrderDialogTitle.asObservable();
  }

  public constructor(
    private http: HttpClient,
    private store: Store,
    private orderManagementContentService: OrderManagementContentService
  ) {}

  public setReOrderDialogTitle(title: SidebarDialogTitlesEnum): void {
    this.reOrderDialogTitle.next(title);
  }

  public getCandidates(orderId: number, organizationId: number): Observable<CandidateModel[]> {
    const { isAgencyArea } = this.store.selectSnapshot(AppState.isOrganizationAgencyArea);
    const params = { organizationId };
    const endpoint = `/api/reorders/${orderId}/candidatespool/`;

    if (isAgencyArea) {
      return this.http.get<CandidateModel[]>(endpoint, { params }).pipe(catchError(() => of([])));
    } else {
      return this.http.get<CandidateModel[]>(endpoint).pipe(catchError(() => of([])));
    }
  }

  public getAgencies(orderId: number, organizationId: number): Observable<AgencyModel[]> {
    const { isAgencyArea } = this.store.selectSnapshot(AppState.isOrganizationAgencyArea);
    const endpoint = `/api/reorders/${orderId}/agenciespool/`;
    const params = { organizationId };

    if (isAgencyArea) {
      return this.http.get<AgencyModel[]>(endpoint, { params }).pipe(catchError(() => of([])));
    } else {
      return this.http.get<AgencyModel[]>(endpoint).pipe(catchError(() => of([])));
    }
  }

  public saveReorder(reorder: ReorderRequestModel, multipleReorderDates: Date[]): Observable<ReorderResponse[]> {
    return this.http.put<ReorderResponse[]>('/api/reorders', this.adaptToReorderRequest(reorder, multipleReorderDates));
  }

  public getBillRate(departmentId: number, skillId: number): Observable<number> {
    return this.orderManagementContentService
      .getPredefinedBillRates(OrderType.OpenPerDiem, departmentId, skillId)
      .pipe(map((billRates: BillRate[]) => billRates[0].rateHour));
  }

  private adaptToReorderRequest(
    { reOrderId, reOrderFromId, agencyIds, reorder }: ReorderRequestModel,
    multipleReorderDates: Date[]
  ): ReorderRequest {
    const dates: Date[] = multipleReorderDates.length ? multipleReorderDates : [reorder.reorderDate];
    const reorderDates: string[] = dates.map((date: Date) => {
      date.setHours(0, 0, 0, 0);

      return DateTimeHelper.toUtcFormat(date);
    });

    return {
      reOrderId,
      reOrderFromId,
      agencyIds,
      reorderDates,
      candidateProfileIds: reorder.candidates,
      shiftEndTime: new Date(DateTimeHelper.toUtcFormat(reorder.shiftEndTime)),
      shiftStartTime: new Date(DateTimeHelper.toUtcFormat(reorder.shiftStartTime)),
      billRate: reorder.billRate,
      openPositions: reorder.openPosition,
    };
  }
}
