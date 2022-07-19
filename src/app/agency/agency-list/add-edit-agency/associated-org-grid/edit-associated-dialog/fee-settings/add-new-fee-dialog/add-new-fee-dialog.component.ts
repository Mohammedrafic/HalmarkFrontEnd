import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, Observable, Subject, takeWhile } from 'rxjs';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';

import { DialogComponent } from '@syncfusion/ej2-angular-popups';

import { AgencyState } from 'src/app/agency/store/agency.state';
import {
  FeeExceptions,
  FeeExceptionsInitialData,
  FeeSettingsClassification,
} from 'src/app/shared/models/associate-organizations.model';
import { valuesOnly } from 'src/app/shared/utils/enum.utils';
import { SaveFeeExceptions, SaveFeeExceptionsSucceeded } from '@agency/store/agency.actions';
import { ConfirmService } from '@shared/services/confirm.service';
import { DELETE_CONFIRM_TEXT, DELETE_CONFIRM_TITLE } from '@shared/constants/messages';
import PriceUtils from '@shared/utils/price.utils';

type AddNewFeeExceptionFormValue = {
  region: number[];
  classification: number[];
  skill: number[];
  fee: number;
};

@Component({
  selector: 'app-add-new-fee-dialog',
  templateUrl: './add-new-fee-dialog.component.html',
  styleUrls: ['./add-new-fee-dialog.component.scss'],
})
export class AddNewFeeDialogComponent implements OnInit, OnDestroy {
  @Input() openEvent: Subject<number>;
  @Input() openEditEvent: Subject<FeeExceptions>;

  @ViewChild('addFeeSideDialog') sideDialog: DialogComponent;

  @Select(AgencyState.feeExceptionsInitialData)
  public feeExceptionsInitialData$: Observable<FeeExceptionsInitialData>;

  public targetElement: HTMLElement = document.body;
  public editMode = false;
  public feeFormGroup: FormGroup = this.generateNewForm();
  public optionFields = {
    text: 'name',
    value: 'id',
  };
  public masterSkillsFields = {
    text: 'skillDescription',
    value: 'id',
  };
  public priceUtils = PriceUtils;
  public classification = Object.values(FeeSettingsClassification)
    .filter(valuesOnly)
    .map((name, id) => ({ name, id }));

  get title(): string {
    return this.editMode ? 'Edit Fee Exception' : 'Add Fee Exception';
  }

  private organizationId: number;
  private isAlive = true;

  constructor(private store: Store, private actions$: Actions, private confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.onOpenEvent();
    this.onOpenEditEvent();

    this.actions$
      .pipe(ofActionSuccessful(SaveFeeExceptionsSucceeded))
      .pipe(takeWhile(() => this.isAlive))
      .subscribe(() => {
        this.sideDialog.hide();
      });
  }

  ngOnDestroy(): void {
    this.isAlive = false;
  }

  public onCancel(): void {
    if (this.feeFormGroup.dirty) {
      this.confirmService
        .confirm(DELETE_CONFIRM_TEXT, {
          title: DELETE_CONFIRM_TITLE,
          okButtonLabel: 'Leave',
          okButtonClass: 'delete-button',
        })
        .pipe(filter((confirm) => !!confirm))
        .subscribe(() => {
          this.editMode = false;
          this.sideDialog.hide();
        });
    } else {
      this.editMode = false;
      this.sideDialog.hide();
    }
  }

  public onAdd(): void {
    this.feeFormGroup.markAllAsTouched();
    if (this.feeFormGroup.valid) {
      const value = this.feeFormGroup.getRawValue();
      this.store.dispatch(new SaveFeeExceptions({ ...value, associateOrganizationId: this.organizationId }));
    }
  }

  private onOpenEvent(): void {
    this.openEvent.subscribe((id) => {
      if (id) {
        this.organizationId = id;
        this.feeFormGroup.reset();
        this.sideDialog.show();
      }
    });
  }

  private onOpenEditEvent(): void {
    this.openEditEvent.subscribe((feeData) => {
      if (feeData) {
        this.editMode = true;
        this.feeFormGroup.patchValue({
          regionIds: [feeData.regionId],
          classifications: [feeData.classification],
          masterSkillIds: [feeData.skillId],
          fee: PriceUtils.formatNumbers(feeData.fee),
        });
      }
    });
  }

  private generateNewForm(): FormGroup {
    return new FormGroup({
      regionIds: new FormControl([], [Validators.required]),
      classifications: new FormControl([], [Validators.required]),
      masterSkillIds: new FormControl([], [Validators.required]),
      fee: new FormControl(null),
    });
  }
}
