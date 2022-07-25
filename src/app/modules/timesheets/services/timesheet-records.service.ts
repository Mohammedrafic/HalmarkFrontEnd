import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Injectable } from '@angular/core';

import { ColDef } from '@ag-grid-community/core';
import { merge, Observable } from 'rxjs';
import { TabComponent } from '@syncfusion/ej2-angular-navigations';

import { DropdownOption, TimesheetRecordsDto, RecordValue } from './../interface';
import { TimesheetsApiService } from './timesheets-api.service';
import { RecordFields } from '../enums';

@Injectable()
export class TimesheetRecordsService {
  constructor(
    private fb: FormBuilder,
    private apiService: TimesheetsApiService,
  ) {}

  public setCostOptions(defs: ColDef[], options: DropdownOption[]): void {
    const idx = defs.findIndex((item) => item.field === 'costCenter');
    defs[idx].cellRendererParams.options = options;
  }

  public setBillRatesOptions(defs: ColDef[], options: DropdownOption[]): void {
    const idx = defs.findIndex((item) => item.field === 'billRateType');
    defs[idx].cellRendererParams.options = options;
  }

  public createEditForm(
    records: TimesheetRecordsDto,
    currentTab: RecordFields,
    colDefs: ColDef[],
    ): Record<string, FormGroup> {
    const formGroups: Record<string, FormGroup> = {};

    records[currentTab].forEach((record) => {
      const config = colDefs.filter((item) => item.cellRendererParams?.editMode);
      const controls: Record<string, string[] | number[] | Validators[]> = {};

      config.forEach((column) => {
        const field = column.field as keyof RecordValue;
        const value = record[field];

        controls[field] = [value as string | number, Validators.required];
      });

      formGroups[record.id] = this.fb.group(controls);
    });
    return formGroups;
  }

  public findDiffs(
    data: RecordValue[], forms: Record<string, FormGroup>, defs: ColDef[],
    ): RecordValue[] {
    const diffs: Record<string, string | number>[] = [];
    const filedsToCompare = defs.filter((def) => def.cellRendererParams?.editMode).map((def) => def.field);

    data.forEach((dataItem) => {
      const values: RecordValue = forms[dataItem.id].getRawValue() as RecordValue;
      const diffValues: Record<string, string | number> = {};


      Object.keys(dataItem).filter((key) => filedsToCompare.includes(key))
      .forEach((key) => {
        if (key !== 'id') {
          const keyValue = key as keyof RecordValue;

          if (dataItem[keyValue] !== values[keyValue]) {
            diffValues[keyValue] = values[keyValue] as string | number;
          }

        }
      });

      if (Object.keys(diffValues).length) {
        diffs.push({
          ...dataItem,
          ...diffValues,
        });

      }
    });

    return diffs as unknown as RecordValue[];
  }

  public watchFormChanges(controls: Record<string, FormGroup>): Observable<unknown> {
    return merge(
      ...Object.keys(controls).map((key) => controls[key].valueChanges)
    )
  }

  public checkIfFormTouched(controls: Record<string, FormGroup>): boolean {
    return Object.keys(controls).some((key) => controls[key].touched)
  }

  public getCurrentTabName(idx: number): RecordFields {
    if (idx === 1) {
      return  RecordFields.Miles;
    }
    if (idx === 2) {
      return RecordFields.Expenses;
    }

    return RecordFields.Time;
  }

  public controlTabsVisibility(billRates: DropdownOption[], tabs: TabComponent): void {
    const isMilageAvaliable = billRates.some((rate) => rate.text.includes('Mileage'));
    const isExpensesAvaliable = billRates.some((rate) => rate.text.includes('Expenses'));

    tabs.hideTab(1, !isMilageAvaliable);
    tabs.hideTab(2, !isExpensesAvaliable);
  }
}
