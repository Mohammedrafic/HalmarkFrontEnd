import { FormBuilder, Validators } from '@angular/forms';
import { Injectable } from '@angular/core';

import { CustomFormGroup } from '@core/interface';
import { RecordFields } from '../enums';
import { AddTimsheetForm } from '../interface';

@Injectable()
export class AddRecordService {
  constructor(
    private fb: FormBuilder,
  ) {}

  createForm(type: RecordFields): CustomFormGroup<AddTimsheetForm> {
    if (type === RecordFields.Time) {
      return this.fb.group({
          day: [null, [Validators.required]],
          timeIn: [null, [Validators.required]],
          timeOut: [null, [Validators.required]],
          departmentId: [null, Validators.required],
          billRateConfigId: [null, Validators.required],
          hadLunchBreak: [true],
        }) as CustomFormGroup<AddTimsheetForm>;
    }

    if (type === RecordFields.Miles) {
      return this.fb.group(
        {
          timeIn: [null, [Validators.required]],
          departmentId: [null, Validators.required],
          value: [null, [Validators.required, Validators.min(0), Validators.max(Number.MAX_SAFE_INTEGER)]],
        }
      ) as CustomFormGroup<AddTimsheetForm>;
    }

    return this.fb.group(
      {
        timeIn: [null, [Validators.required]],
        departmentId: [null, Validators.required],
        description: [null, Validators.maxLength(250)],
        value: [null, [Validators.required, Validators.min(0), Validators.max(Number.MAX_SAFE_INTEGER)]],
      }
    ) as CustomFormGroup<AddTimsheetForm>;

  }
}
