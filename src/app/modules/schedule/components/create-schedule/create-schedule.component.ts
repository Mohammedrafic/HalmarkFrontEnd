import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { Store } from '@ngxs/store';
import { ChangeArgs } from '@syncfusion/ej2-angular-buttons';
import { ChangeEventArgs } from '@syncfusion/ej2-angular-calendars';
import { catchError, filter, map, Subscription, switchMap, take, takeUntil, tap } from 'rxjs';

import { FieldType } from '@core/enums';
import { DestroyDialog } from '@core/helpers';
import { CustomFormGroup, DropdownOption, Permission } from '@core/interface';
import { GlobalWindow } from '@core/tokens';
import { CANCEL_CONFIRM_TEXT, DELETE_CONFIRM_TITLE } from '@shared/constants';
import { DatePickerLimitations } from '@shared/components/icon-multi-date-picker/icon-multi-date-picker.interface';
import { ScheduleShift } from '@shared/models/schedule-shift.model';
import { UnavailabilityReason } from '@shared/models/unavailability-reason.model';
import { ConfirmService } from '@shared/services/confirm.service';
import { ShiftsService } from '@shared/services/shift.service';
import { BookingsOverlapsRequest, BookingsOverlapsResponse } from '../replacement-order-dialog/replacement-order.interface';
import {
  AvailabilityFormConfig,
  BookFormConfig,
  ScheduleFormSourceKeys,
  ScheduleItemType,
  ScheduleSourcesMap,
  ScheduleTypes,
  UnavailabilityFormConfig,
} from '../../constants';
import * as ScheduleInt from '../../interface';
import { ScheduleBookingErrors, ScheduleFiltersConfig, ScheduleFilterStructure } from '../../interface';
import { CreateScheduleService } from '../../services/create-schedule.service';
import { ScheduleItemsComponent } from '../schedule-items/schedule-items.component';
import { ScheduleApiService, ScheduleFiltersService } from '../../services';
import {
  CreateBookingSuccessMessage,
  CreateScheduleSuccessMessage,
  DisableScheduleControls,
  GetShiftHours,
  GetShiftTimeControlsValue,
  ScheduleFilterHelper,
} from '../../helpers';
import { Skill } from '@shared/models/skill.model';
import { ShowToast } from '../../../../store/app.actions';
import { MessageTypes } from '@shared/enums/message-types';
import { ScheduleItemsService } from '../../services/schedule-items.service';

@Component({
  selector: 'app-create-schedule',
  templateUrl: './create-schedule.component.html',
  styleUrls: ['./create-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateScheduleComponent extends DestroyDialog implements OnInit {
  @ViewChild(ScheduleItemsComponent) scheduleItemsComponent: ScheduleItemsComponent;

  @Input() scheduleFilterData: ScheduleFiltersConfig;
  @Input() selectedScheduleFilters: ScheduleInt.ScheduleFilters;
  @Input() scheduleSelectedSlots: ScheduleInt.ScheduleSelectedSlots;
  @Input() datePickerLimitations: DatePickerLimitations;
  @Input() userPermission: Permission = {};

  @Input() set scheduleStructure(structure: ScheduleFilterStructure) {
    if (structure.regions?.length) {
      this.setScheduleStructure(structure);
    }
  }

  @Input() set scheduleData(page: ScheduleInt.ScheduleModelPage | null) {
    if (page) {
      this.createScheduleService.scheduleData = page.items;
    }
  }

  @Output() updateScheduleGrid: EventEmitter<void> = new EventEmitter<void>();

  readonly targetElement: HTMLBodyElement = this.globalWindow.document.body as HTMLBodyElement;
  readonly FieldTypes = FieldType;
  readonly scheduleTypesControl: FormControl = new FormControl(ScheduleItemType.Book);
  readonly dropDownFields = { text: 'text', value: 'value' };
  readonly scheduleFormSourcesMap: ScheduleInt.ScheduleFormSource = ScheduleSourcesMap;

  scheduleTypes: ReadonlyArray<ScheduleInt.ScheduleTypeRadioButton> = ScheduleTypes;
  scheduleForm: CustomFormGroup<ScheduleInt.ScheduleForm>;
  scheduleFormConfig: ScheduleInt.ScheduleFormConfig;
  scheduleType: ScheduleItemType;
  showScheduleForm = true;
  replacementOrderDialogOpen = false;
  replacementOrderDialogData: BookingsOverlapsResponse[] = [];

  private readonly customShiftId = -1;
  private shiftControlSubscription: Subscription | null;
  private scheduleShifts: ScheduleShift[] = [];
  private scheduleStructureList: ScheduleFilterStructure;
  private firstLoadDialog = true;
  private scheduleToBook: ScheduleInt.ScheduleBook | null;

  constructor(
    @Inject(GlobalWindow) protected readonly globalWindow: WindowProxy & typeof globalThis,
    private createScheduleService: CreateScheduleService,
    private scheduleItemsService: ScheduleItemsService,
    private scheduleApiService: ScheduleApiService,
    private confirmService: ConfirmService,
    private shiftsService: ShiftsService,
    private cdr: ChangeDetectorRef,
    private scheduleFiltersService: ScheduleFiltersService,
    private store: Store,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setScheduleTypesPermissions();
    this.watchForCloseStream();
    this.getUnavailabilityReasons();
    this.getShifts();
    this.watchForScheduleType();
  }

  closeScheduleDialog(): void {
    if (this.scheduleForm?.touched) {
      this.confirmService.confirm(
        CANCEL_CONFIRM_TEXT,
        {
          title: DELETE_CONFIRM_TITLE,
          okButtonLabel: 'Leave',
          okButtonClass: 'delete-button',
        })
        .pipe(
          take(1),
          filter(Boolean),
        )
        .subscribe(() => {
          this.handleCloseDialog();
          this.firstLoadDialog = false;
        });
    } else {
      this.handleCloseDialog();
      this.firstLoadDialog = false;
    }
  }

  changeScheduleType(event: ChangeArgs): void {
    this.updateScheduleDialogConfig(event.value as unknown as ScheduleItemType);
  }

  hideScheduleForm(): void {
    this.showScheduleForm = false;
  }

  changeTimeControls(event: ChangeEventArgs, field: string): void {
    const shiftIdControl = this.scheduleForm.get('shiftId');
    const startTimeDate = field === 'startTime' ? event.value : this.scheduleForm.get('startTime')?.value;
    const endTimeDate = field === 'endTime' ? event.value : this.scheduleForm.get('endTime')?.value;

    if (shiftIdControl?.value !== this.customShiftId) {
      shiftIdControl?.setValue(this.customShiftId);
    }

    this.setHours(startTimeDate, endTimeDate);
  }

  saveSchedule(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    if (this.scheduleType === ScheduleItemType.Book) {
      this.checkBookingsOverlaps();
    } else {
      this.saveAvailabilityUnavailability();
    }
  }

  closeReplacementOrderDialog(): void {
    this.replacementOrderDialogOpen = false;
    this.cdr.markForCheck();
  }

  saveBooking(createOrder: boolean): void {
    if (!this.scheduleToBook) {
      return;
    }

    this.scheduleToBook.createOrder = createOrder;
    this.scheduleApiService.createBookSchedule(this.scheduleToBook).pipe(
      catchError((error: HttpErrorResponse) => this.createScheduleService.handleErrorMessage(error)),
      tap((errors: ScheduleBookingErrors[]) => {
        this.scheduleItemsService.setErrors(errors);
        return errors;
      }),
      filter((errors: ScheduleBookingErrors[]) => {
        return !errors;
      }),
      takeUntil(this.componentDestroy())
    ).subscribe(() => {
      this.scheduleItemsService.setErrors([]);
      this.handleSuccessSaveDate(CreateBookingSuccessMessage(this.scheduleToBook as ScheduleInt.ScheduleBook));
      this.scheduleToBook = null;
    });
  }

  private openReplacementOrderDialog(replacementOrderDialogData: BookingsOverlapsResponse[]): void {
    this.replacementOrderDialogData = replacementOrderDialogData;
    this.replacementOrderDialogOpen = true;
    this.cdr.markForCheck();
  }

  private setHours(
    startTimeDate: Date = this.scheduleForm.get('startTime')?.value,
    endTimeDate: Date = this.scheduleForm.get('endTime')?.value,
  ): void {
    if (startTimeDate && endTimeDate) {
      this.scheduleForm.get('hours')?.setValue(GetShiftHours(startTimeDate, endTimeDate));
    }
  }

  private getUnavailabilityReasons(): void {
    this.scheduleApiService.getUnavailabilityReasons()
      .pipe(
        catchError((error: HttpErrorResponse) => this.createScheduleService.handleError(error)),
        map((reasons: UnavailabilityReason[]) => this.createScheduleService.mapToDropdownOptions(reasons)),
        takeUntil(this.componentDestroy())
      )
      .subscribe((reasons: DropdownOption[]) => {
        this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Reasons] = reasons;
        this.cdr.markForCheck();
      });
  }

  private getShifts(): void {
    this.shiftsService.getAllShifts()
      .pipe(
        catchError((error: HttpErrorResponse) => this.createScheduleService.handleError(error)),
        tap((shifts: ScheduleShift[]) => this.scheduleShifts = shifts),
        map((shifts: ScheduleShift[]) => this.createScheduleService.mapToDropdownOptions(shifts)),
        takeUntil(this.componentDestroy())
      )
      .subscribe((shifts: DropdownOption[]) => {
        this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Shifts] = [
          { text: 'Custom', value: this.customShiftId },
          ...shifts,
        ];
        this.cdr.markForCheck();
      });
  }

  private updateScheduleDialogConfig(scheduleTypeMode: ScheduleItemType): void {
    this.scheduleType = scheduleTypeMode;

    switch (this.scheduleType) {
      case ScheduleItemType.Book:
        this.scheduleFormConfig = BookFormConfig;
        this.scheduleForm = this.createScheduleService.createBookForm();
        this.watchForControls();
        this.patchBookForm();
        this.patchBookForSingleCandidate();
        break;
      case ScheduleItemType.Unavailability:
        this.scheduleFormConfig = UnavailabilityFormConfig;
        this.scheduleForm = this.createScheduleService.createUnavailabilityForm();
        break;
      case ScheduleItemType.Availability:
        this.scheduleFormConfig = AvailabilityFormConfig;
        this.scheduleForm = this.createScheduleService.createAvailabilityForm();
        break;
    }

    this.watchForShiftControl();
  }

  private watchForShiftControl(): void {
    if (this.shiftControlSubscription) {
      this.shiftControlSubscription.unsubscribe();
      this.shiftControlSubscription = null;
    }

    this.shiftControlSubscription = this.scheduleForm.get('shiftId')?.valueChanges
      .pipe(
        map((shiftId: number) => this.scheduleShifts.find((shift: ScheduleShift) => shift.id === shiftId)),
        filter(Boolean),
        takeUntil(this.componentDestroy()),
      )
      .subscribe((shift: ScheduleShift) => {
        this.scheduleForm.patchValue(GetShiftTimeControlsValue(shift.startTime, shift.endTime));
        this.setHours();
      }) as Subscription;
  }

  private isCandidatesFiltered(): boolean {
    return !!this.selectedScheduleFilters?.regionIds?.length && !!this.selectedScheduleFilters?.locationIds?.length;
  }

  private patchBookForm(): void {
    if (this.isCandidatesFiltered()) {
      this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Regions] = this.scheduleFilterData.regionIds.dataSource;
      this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Locations] = this.scheduleFilterData.locationIds.dataSource;
      this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Departments] = this.scheduleFilterData.departmentsIds.dataSource;
      this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Skills] = this.scheduleFilterData.skillIds.dataSource;

      this.scheduleForm.get('regionId')?.setValue(((this.selectedScheduleFilters.regionIds as number[])[0]));
      this.scheduleForm.get('locationId')?.setValue((this.selectedScheduleFilters.locationIds as number[])[0]);
      this.scheduleForm.get('departmentId')?.setValue((this.selectedScheduleFilters.departmentsIds as number[])[0]);
      if (this.selectedScheduleFilters.skillIds) {
        this.scheduleForm.get('skillId')?.setValue((this.selectedScheduleFilters.skillIds as number[])[0]);
      }

      DisableScheduleControls(this.scheduleForm, ['regionId', 'locationId', 'departmentId']);
    }
  }

  private watchForControls(): void {
    if (!this.selectedScheduleFilters?.regionIds?.length && !this.selectedScheduleFilters?.locationIds?.length) {
      this.scheduleForm.get('regionId')?.valueChanges.pipe(
        filter(Boolean),
        takeUntil(this.componentDestroy())
      ).subscribe((value: number) => {
        this.scheduleForm.get('locationId')?.patchValue([], { emitEvent: false, onlySelf: true });
        this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Locations] = this.scheduleFiltersService
          .getSelectedLocatinOptions(this.scheduleStructureList, [value]);
        this.cdr.markForCheck();
      });

      this.scheduleForm.get('locationId')?.valueChanges.pipe(
        filter(Boolean),
        takeUntil(this.componentDestroy())
      ).subscribe((value: number) => {
        this.scheduleForm.get('departmentsId')?.patchValue([], { emitEvent: false, onlySelf: true });
        this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Departments] = this.scheduleFiltersService
          .getSelectedDepartmentOptions(this.scheduleStructureList, [value], false);

        this.cdr.markForCheck();
      });

      this.scheduleForm.get('departmentId')?.valueChanges.pipe(
        filter(Boolean),
        switchMap((value: number) => {
          return this.scheduleApiService.getSkillsByEmployees(value, this.scheduleSelectedSlots.candidates[0].id);
        }),
        takeUntil(this.componentDestroy())
      ).subscribe((skills: Skill[]) => {
        const skillOption = ScheduleFilterHelper.adaptMasterSkillToOption(skills);
        this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Skills] = skillOption;

        if(this.firstLoadDialog && this.isSelectedCandidateWithoutFilters()) {
          this.scheduleForm?.get('skillId')?.setValue(skillOption[0]?.value);
          this.firstLoadDialog = false;
        }
        this.cdr.markForCheck();
      });
    }
  }

  private setScheduleStructure(structure: ScheduleFilterStructure): void {
    this.scheduleStructureList = structure;
    this.scheduleFormSourcesMap[ScheduleFormSourceKeys.Regions] =
      ScheduleFilterHelper.adaptRegionToOption(structure.regions);
  }

  private patchBookForSingleCandidate(): void {
    if(this.isSelectedCandidateWithoutFilters()) {
      const region = this.scheduleStructureList.regions[0];
      this.scheduleFormSourcesMap.locations = this.scheduleFiltersService
      .getSelectedLocatinOptions(this.scheduleStructureList, [region.id as number]);
      this.scheduleFormSourcesMap.departments = this.scheduleFiltersService
      .getSelectedDepartmentOptions(this.scheduleStructureList, [this.scheduleFormSourcesMap.locations[0].value as number]);

      this.scheduleForm?.get('regionId')?.setValue(region.id);
      this.scheduleForm?.get('locationId')?.setValue(this.scheduleFormSourcesMap.locations[0]?.value);
      this.scheduleForm?.get('departmentId')?.setValue(this.scheduleFormSourcesMap.departments[0]?.value);
      this.scheduleForm?.get('skillId')?.setValue(this.scheduleFormSourcesMap.skill[0]?.value);
    }
  }

  private isSelectedCandidateWithoutFilters(): boolean {
    return !this.isCandidatesFiltered() && this.scheduleSelectedSlots.candidates?.length === 1;
  }

  private watchForScheduleType(): void {
    this.scheduleTypesControl.valueChanges.pipe(
      map((type: number) => {
        if (type === ScheduleItemType.Book) {
          this.watchForControls();
        }
        return type;
      }),
      takeUntil(this.componentDestroy())
    ).subscribe((type: number) => {
      this.scheduleType = type;
    });
  }

  private handleCloseDialog(): void {
    this.closeDialog();
    this.scheduleItemsService.setErrors([]);
  }

  private saveAvailabilityUnavailability(): void {
    const schedule = this.createScheduleService.createAvailabilityUnavailability(
      this.scheduleForm,
      this.scheduleItemsComponent.scheduleItems,
      this.scheduleTypesControl.value,
      this.customShiftId
    );
    const successMessage = CreateScheduleSuccessMessage(schedule);

    this.scheduleApiService.createSchedule(schedule)
      .pipe(
        catchError((error: HttpErrorResponse) => this.createScheduleService.handleError(error)),
        takeUntil(this.componentDestroy())
      )
      .subscribe(() => {
        this.handleSuccessSaveDate(successMessage);
      });
  }

  private handleSuccessSaveDate(message: string): void {
    this.updateScheduleGrid.emit();
    this.scheduleForm.markAsUntouched();
    this.closeDialog();
    this.store.dispatch(new ShowToast(MessageTypes.Success, message));
  }

  private setScheduleTypesPermissions(): void {
    this.scheduleTypes = this.createScheduleService.getScheduleTypesWithPermissions(this.scheduleTypes, this.userPermission);
    this.scheduleType = this.createScheduleService.getFirstAllowedScheduleType(this.scheduleTypes);
    this.scheduleTypesControl.setValue(this.scheduleType);
    this.updateScheduleDialogConfig(this.scheduleType);
  }

  private checkBookingsOverlaps(): void {
    this.scheduleToBook = this.createScheduleService.createBooking(
      this.scheduleForm,
      this.scheduleItemsComponent.scheduleItems,
      this.customShiftId,
    );
    const request: BookingsOverlapsRequest = {
      employeeScheduledDays: this.scheduleToBook.employeeBookedDays,
      shiftId: this.scheduleToBook.shiftId,
      startTime: this.scheduleToBook.startTime,
      endTime: this.scheduleToBook.endTime,
    };

    this.scheduleApiService.checkBookingsOverlaps(request).pipe(
      catchError((error: HttpErrorResponse) => this.createScheduleService.handleError(error)),
      takeUntil(this.componentDestroy())
    ).subscribe((response: BookingsOverlapsResponse[]) => {
      if (!response.length && this.scheduleToBook) {
        this.saveBooking(false);
      } else {
        this.openReplacementOrderDialog(response);
      }
    });
  }
}
