import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { extensionDurationPrimary, extensionDurationSecondary } from '@shared/components/extension/extension-sidebar/config';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FieldSettingsModel } from '@syncfusion/ej2-angular-dropdowns';
import { Duration } from '@shared/enums/durations';
import { catchError, combineLatest, filter, startWith, tap } from 'rxjs';
import { ExtensionSidebarService } from '@shared/components/extension/extension-sidebar/extension-sidebar.service';
import isNil from 'lodash/fp/isNil';
import { addDays } from '@shared/utils/date-time.utils';
import { OrderCandidateJob, OrderManagementChild } from '@shared/models/order-management.model';
import { BillRatesComponent } from '@shared/components/bill-rates/bill-rates.component';
import { Comment } from '@shared/models/comment.model';
import { Store } from '@ngxs/store';
import { ShowToast } from 'src/app/store/app.actions';
import { MessageTypes } from '@shared/enums/message-types';
import { RECORD_ADDED } from '@shared/constants';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
import { BillRate } from '@shared/models';
import { BillRatesSyncService } from '@shared/services/bill-rates-sync.service';
import { getAllErrors } from '@shared/utils/error.utils';
import { DateTimeHelper } from '@core/helpers';

@Component({
  selector: 'app-extension-sidebar',
  templateUrl: './extension-sidebar.component.html',
  styleUrls: ['./extension-sidebar.component.scss'],
})
export class ExtensionSidebarComponent implements OnInit {
  @Input() public candidateJob: OrderCandidateJob;
  @Input() public orderPosition: OrderManagementChild;
  @Output() public saveEmitter: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('billRates') billRatesComponent: BillRatesComponent;

  public readonly extensionDurationPrimary = extensionDurationPrimary;
  public readonly extensionDurationSecondary = extensionDurationSecondary;
  public readonly durationFieldsSettings: FieldSettingsModel = { text: 'name', value: 'id' };
  public readonly datepickerMask = { month: 'MM', day: 'DD', year: 'YYYY' };
  public readonly numericInputAttributes = { maxLength: '2' };
  public readonly billRateAttributes = { maxLength: '10' };

  public minDate: Date;
  public extensionForm: FormGroup;
  public comments: Comment[] = []
  public startDate: Date;

  private get billRateControl(): FormControl {
    return this.extensionForm?.get('billRate') as FormControl;
  }

  public constructor(
    private formBuilder: FormBuilder,
    private extensionSidebarService: ExtensionSidebarService,
    private store: Store,
    private billRatesSyncService: BillRatesSyncService
  ) {}

  public ngOnInit(): void {
    const minDate = addDays(this.candidateJob?.actualEndDate, 1)!;
    this.minDate = DateTimeHelper.convertDateToUtc(minDate.toString());
    this.initExtensionForm();
    this.listenPrimaryDuration();
    this.listenDurationChanges();
    this.listenStartEndDatesChanges();
    this.subsToBillRateControlChange();
  }

  public hourlyRateToOrderSync(event: { value: string; billRate?: BillRate }): void {
    const { value, billRate } = event;
    if (!value) {
      return;
    }
    const billRates = this.billRatesComponent?.billRatesControl.value;
    let billRateToUpdate: BillRate | null = this.billRatesSyncService.getBillRateForSync(billRates);
    if (billRateToUpdate?.id !== billRate?.id && billRate?.id !== 0) {
      return;
    }

    this.billRateControl.patchValue(value, { emitEvent: false, onlySelf: true });
  }

  public saveExtension(positionDialog: DialogComponent, ignoreMissingCredentials: boolean): void {
    if (this.extensionForm.invalid) {
      this.extensionForm.markAllAsTouched();
      return;
    }
    const { value: billRate } = this.billRatesComponent.billRatesControl;
    const extension = this.extensionForm.getRawValue();
    this.extensionSidebarService
      .saveExtension({
        billRates: billRate,
        ...extension,
        jobId: this.orderPosition.jobId,
        orderId: this.candidateJob.orderId,
        comments: this.comments,
        ignoreMissingCredentials,
      })
      .pipe(
        tap(() => {
          this.store.dispatch(new ShowToast(MessageTypes.Success, RECORD_ADDED));
          positionDialog.hide();
          this.saveEmitter.emit();
        }),
        catchError((error) =>
          this.store.dispatch(new ShowToast(MessageTypes.Error, getAllErrors(error?.error)))
        ))
      .subscribe();
  }

  private subsToBillRateControlChange(): void {
    this.billRateControl.valueChanges.subscribe((value) => {
      if (!this.billRatesComponent?.billRatesControl.value) {
        return;
      }

      const billRates = this.billRatesComponent?.billRatesControl.value;
      let billRateToUpdate: BillRate | null = this.billRatesSyncService.getBillRateForSync(billRates);

      if (!billRateToUpdate) {
        return;
      }

      const restBillRates = this.billRatesComponent?.billRatesControl.value.filter(
        (billRate: BillRate) => billRate.id !== billRateToUpdate?.id
      );

      billRateToUpdate.rateHour = value || '0.00';

      this.billRatesComponent.billRatesControl.patchValue([billRateToUpdate, ...restBillRates]);
    });
  }

  private initExtensionForm(): void {
    const { actualEndDate, candidateBillRate } = this.candidateJob || {};
    const startDate = addDays(actualEndDate, 1);
    this.extensionForm = this.formBuilder.group({
      durationPrimary: [Duration.Other],
      durationSecondary: [],
      durationTertiary: [],
      startDate: [startDate ? DateTimeHelper.convertDateToUtc(startDate.toString()) : null, [Validators.required]],
      endDate: ['', [Validators.required]],
      billRate: [candidateBillRate, [Validators.required]],
      comments: [null],
    });
  }

  private listenPrimaryDuration(): void {
    this.extensionForm.get('durationPrimary')?.valueChanges.subscribe((duration: Duration) => {
      const durationSecondary = this.extensionForm.get('durationSecondary');
      const durationTertiary = this.extensionForm.get('durationTertiary');

      if (duration === Duration.Other) {
        durationSecondary?.enable({emitEvent: false});
        durationTertiary?.enable({emitEvent: false});
        durationSecondary?.reset();
        durationTertiary?.reset();
        this.extensionForm.get('startDate')?.markAsPristine();
        this.extensionForm.get('endDate')?.markAsPristine();
      } else {
        durationSecondary?.disable();
        durationTertiary?.disable();
        durationSecondary?.setValue(this.extensionSidebarService.getSecondaryDuration(duration));
        durationTertiary?.setValue(this.extensionSidebarService.getTertiaryDuration(duration));
      }
    });
  }

  private listenDurationChanges(): void {
    const durationSecondary$ = this.extensionForm.get('durationSecondary')?.valueChanges!;
    const durationTertiary$ = this.extensionForm.get('durationTertiary')?.valueChanges!;

    combineLatest([durationSecondary$, durationTertiary$])
      .pipe(
        filter(([durationSecondary$, durationTertiary$]) => !isNil(durationSecondary$) && !isNil(durationTertiary$)),
      )
      .subscribe(([durationSecondary, durationTertiary]: number[]) => {
        const { value: startDate } = this.extensionForm.get('startDate')!;
        const endDate = this.extensionSidebarService.getEndDate(startDate, durationSecondary, durationTertiary);
        this.extensionForm.patchValue({ endDate });
      });
  }

  private listenStartEndDatesChanges(): void {
    const startDateControl = this.extensionForm.get('startDate');
    const endDateControl = this.extensionForm.get('endDate');

    combineLatest([
      startDateControl?.valueChanges.pipe(startWith(null))!,
      endDateControl?.valueChanges.pipe(startWith(null))!
    ])
      .pipe(filter(() => startDateControl?.dirty! || endDateControl?.dirty!))
      .subscribe(([startDate, endDate]) => {
        this.startDate = startDate;
        if (startDate > endDate) {
          this.extensionForm.get('endDate')?.setErrors({incorrect: true});
        }
        this.extensionForm.get('durationPrimary')?.setValue(Duration.Other);
      });
  }
}
