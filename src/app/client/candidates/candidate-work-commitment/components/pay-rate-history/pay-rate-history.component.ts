import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Store } from '@ngxs/store';
import { Subject, switchMap, take, Observable, filter, of, takeUntil } from 'rxjs';

import { AbstractPermission } from '@shared/helpers/permissions';
import { PagerConfig } from '../../constants';
import { ColumnDefinitionModel } from '@shared/components/grid/models';
import { PayRateColumnDef } from '../../constants/pay-rate-history.constant';
import { AvailRestrictDialogData, PayRateHistory } from '../../interfaces';
import { PayRateService } from '../../services/pay-rate.service';
import { PayRateApiService } from '../../services/pay-rate-api.service';
import { PageOfCollections } from '@shared/models/page.model';
import { CandidatesService } from '@client/candidates/services/candidates.service';
import { DateTimeHelper } from '@core/helpers';
import { ConfirmService } from '@shared/services/confirm.service';
import { DELETE_RECORD_TEXT, DELETE_RECORD_TITLE, NO_ACTIVE_WORK_COMMITMET } from '@shared/constants';
import { DateRanges } from '@client/candidates/departments/departments.model';
import { CandidateWorkCommitmentShort } from '@client/candidates/interface/employee-work-commitments.model';

@Component({
  selector: 'app-pay-rate-history',
  templateUrl: './pay-rate-history.component.html',
  styleUrls: ['./pay-rate-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayRateHistoryComponent extends AbstractPermission implements OnInit {

  @Input() public refreshSubject$: Subject<void>;
  @Input() set employeeIdVal(value: number | null) {
    if (value) {
      this.employeeId = value;
      this.dispatchNewPage();
    }
  }

  public readonly dialogSubject$: Subject<AvailRestrictDialogData> = new Subject();

  public gridTitle = 'Pay Rate History';
  public formGroup: FormGroup;
  public payRateRecords: PayRateHistory[] = [];
  public columnDef: ColumnDefinitionModel[];
  public customRowsPerPageDropDownObject = PagerConfig;
  public dateRanges: DateRanges = {};
  public noActiveWorkCommitment = false;
  public tooltipMessage = NO_ACTIVE_WORK_COMMITMET;
  public pagingData = {
    pageNumber: 1,
    pageSize: 5,
    totalCount: 0,
  };

  private employeeId: number;
  private employeeWorkCommitmentId: number;

  constructor(
    protected override store: Store,
    private readonly cdr: ChangeDetectorRef,
    private readonly payRateService: PayRateService,
    private readonly payRateApiService: PayRateApiService,
    private readonly candidateService: CandidatesService,
    private readonly confirmService: ConfirmService,
  ) { super(store); }

  public override ngOnInit(): void {
    super.ngOnInit();
    this.initFormGroup();
    this.initColumnsDefinition();
    this.getActiveEmployeeWorkCommitment();

    //TODO implement refresh grid while updating wc EIN-14375
    // this.refreshSubject$.subscribe((data) => {
    //   console.error(data);
    //   this.dispatchNewPage();
    // });
  }

  public handleChangePage(pageNumber: number): void {
    if (pageNumber && this.pagingData.pageNumber !== pageNumber) {
      this.pagingData.pageNumber = pageNumber;
      this.dispatchNewPage();
    }
  }

  public addPayRate(): void {
    this.dialogSubject$.next({ isOpen: true });
  }

  public submitFormData(): void {
    if (this.formGroup.valid) {
      const formData = this.formGroup.getRawValue() as PayRateHistory;
      const payload = {
        employeeWorkCommitmentId: this.employeeWorkCommitmentId,
        payRate: formData.payRate,
        startDate: DateTimeHelper.toUtcFormat(formData.startDate),
      };

      this.payRateApiService.addPayRateRecord(payload)
        .pipe(
          switchMap(() => this.getPayRateRecords()),
          take(1)
        ).subscribe((data) => {
          this.dialogSubject$.next({ isOpen: false });
          this.refreshSubject$.next();
          this.extractData(data);
        });
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  private initColumnsDefinition(): void {
    this.columnDef = PayRateColumnDef(this.deletePayRate.bind(this));
  }

  private deletePayRate(id: number): void {
    this.confirmService
      .confirm(DELETE_RECORD_TEXT, {
        okButtonLabel: 'Delete',
        okButtonClass: 'delete-button',
        title: DELETE_RECORD_TITLE,
      })
      .pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.payRateApiService.deletePayRateRecord(id)),
        switchMap(() => {
          this.pagingData.pageNumber = this.candidateService.getGridPageNumber(
            this.payRateRecords.length,
            this.pagingData.pageNumber,
          );
          return this.getPayRateRecords();
        }),
        take(1)
      ).subscribe((data) => {
        this.extractData(data);
      });
  }

  private initFormGroup(): void {
    this.formGroup = this.payRateService.createPayRateForm();
  }

  private getPayRateRecords(): Observable<PageOfCollections<PayRateHistory>> {
    return this.candidateService.getActiveEmployeeWorkCommitment()
      .pipe(
        filter(Boolean),
        switchMap((activeWorkCommitment) => of({
          employeeId: this.employeeId,
          employeeWorkCommitmentId: activeWorkCommitment.id,
          pageNumber: this.pagingData.pageNumber,
          pageSize: this.pagingData.pageSize,
        })),
        switchMap((payload) => this.payRateApiService.getPayRateRecords(payload))
      );
  }


  public extractData(data: PageOfCollections<PayRateHistory>): void {
    this.payRateRecords = data.items;
    this.pagingData.totalCount = data.totalCount;
    this.cdr.markForCheck();
  }

  private dispatchNewPage(): void {
    this.getPayRateRecords().pipe(
      take(1)
    ).subscribe((data) => {
      this.extractData(data);
    });
  }

  private setDateRanges(employeeWorkCommitment: CandidateWorkCommitmentShort): void {
    const { startDate, endDate } = employeeWorkCommitment;

    this.dateRanges.max = endDate ? DateTimeHelper.convertDateToUtc(endDate) : undefined;
    this.dateRanges.min = startDate ? DateTimeHelper.convertDateToUtc(startDate) : undefined;
    this.cdr.markForCheck();
  }

  public getActiveEmployeeWorkCommitment(): void {
    this.candidateService.getActiveEmployeeWorkCommitment()
      .pipe(
        takeUntil(this.componentDestroy())
      ).subscribe((data) => {
        this.noActiveWorkCommitment = !!data;
        if (data) {
          this.employeeWorkCommitmentId = data.id;
          this.setDateRanges(data);
        }
      });
  }
}
