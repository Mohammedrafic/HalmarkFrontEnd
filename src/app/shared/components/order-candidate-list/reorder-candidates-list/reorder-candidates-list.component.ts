import { GetCandidateJob, ReloadOrderCandidatesLists } from '@agency/store/order-management.actions';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GetAvailableSteps, GetOrganisationCandidateJob } from '@client/store/order-managment-content.actions';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { DialogNextPreviousOption } from '@shared/components/dialog-next-previous/dialog-next-previous.component';
import { OrderCandidateListViewService } from '@shared/components/order-candidate-list/order-candidate-list-view.service';
import { CandidatStatus } from '@shared/enums/applicant-status.enum';

import { OrderCandidateJob, OrderCandidatesList } from '@shared/models/order-management.model';
import { filter, merge, Observable, takeUntil, tap } from 'rxjs';
import { AbstractOrderCandidateListComponent } from '../abstract-order-candidate-list.component';

enum ReorderCandidateStatuses {
  BillRatePending = 44,
  OfferedBR = 47,
  Onboard = 60,
  Rejected = 100,
  Cancelled = 110,
}

@Component({
  selector: 'app-reorder-candidates-list',
  templateUrl: './reorder-candidates-list.component.html',
  styleUrls: ['./reorder-candidates-list.component.scss'],
})
export class ReorderCandidatesListComponent extends AbstractOrderCandidateListComponent implements OnInit {
  public candidate: OrderCandidatesList;
  public dialogNextPreviousOption: DialogNextPreviousOption = { next: false, previous: false };
  public candidateStatuses = ReorderCandidateStatuses;
  public candidateJob: OrderCandidateJob;

  public readonly cancelledStatusName = ReorderCandidateStatuses[ReorderCandidateStatuses.Cancelled];

  private selectedIndex: number;

  constructor(
    protected override store: Store,
    protected override router: Router,
    private orderCandidateListViewService: OrderCandidateListViewService,
    private actions$: Actions
  ) {
    super(store, router);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.onChangeCandidateJob().pipe(takeUntil(this.unsubscribe$)).subscribe();
    this.subscribeOnReloadAction();
  }

  public onEdit(data: OrderCandidatesList & { index: string }, event: MouseEvent): void {
    if (this.order?.isClosed && data.statusName !== this.cancelledStatusName) {
      return;
    }

    this.candidate = { ...data };
    this.selectedIndex = Number(data.index);

    this.getCandidateJobData();

    this.dialogNextPreviousOption = this.getDialogNextPreviousOption(this.candidate);
    this.orderCandidateListViewService.setIsCandidateOpened(true);
    this.openDetails.next(true);
  }

  private getCandidateJobData(): void {
    if (this.order && this.candidate) {
      if (this.isAgency) {
        this.store.dispatch(new GetCandidateJob(this.order.organizationId, this.candidate.candidateJobId));
      } else if (this.isOrganization) {
        const isGetAvailableSteps = [CandidatStatus.BillRatePending, CandidatStatus.OfferedBR, CandidatStatus.OnBoard].includes(
          this.candidate.status
        );

        this.store.dispatch(new GetOrganisationCandidateJob(this.order.organizationId, this.candidate.candidateJobId));
        isGetAvailableSteps &&
          this.store.dispatch(new GetAvailableSteps(this.order.organizationId, this.candidate.candidateJobId));
      }
    }
  }

  private getDialogNextPreviousOption(selectedOrder: OrderCandidatesList): DialogNextPreviousOption {
    const gridData = this.grid.dataSource as OrderCandidatesList[];
    const [first] = gridData;
    const last = gridData[gridData.length - 1];
    return {
      previous: first.candidateId !== selectedOrder.candidateId,
      next: last.candidateId !== selectedOrder.candidateId,
    };
  }

  public onNextPreviousOrderEvent(next: boolean): void {
    const nextIndex = next ? this.selectedIndex + 1 : this.selectedIndex - 1;
    const nextCandidate = (this.grid.dataSource as OrderCandidatesList[])[nextIndex];
    this.candidate = nextCandidate;
    this.selectedIndex = nextIndex;
    this.getCandidateJobData();
    this.dialogNextPreviousOption = this.getDialogNextPreviousOption(this.candidate);
  }

  private onChangeCandidateJob(): Observable<OrderCandidateJob> {
    return merge(this.candidateJobOrganisationState$, this.candidateJobAgencyState$).pipe(
      filter((candidateJob) => !!candidateJob),
      tap((candidateJob: OrderCandidateJob) => (this.candidateJob = candidateJob))
    );
  }

  private subscribeOnReloadAction(): void {
    this.actions$.pipe(takeUntil(this.unsubscribe$), ofActionSuccessful(ReloadOrderCandidatesLists)).subscribe(() => {
      this.emitGetCandidatesList();
    });
  }
}
