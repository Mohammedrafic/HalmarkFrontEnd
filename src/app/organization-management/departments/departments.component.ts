import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormGroup, Validators } from '@angular/forms';

import { Actions, ofActionDispatched, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { filter, Observable, Subject, switchMap, takeUntil, throttleTime, of, tap, debounceTime, take } from 'rxjs';
import { ChangeEventArgs, FieldSettingsModel } from '@syncfusion/ej2-angular-dropdowns';
import { GridComponent, PagerComponent } from '@syncfusion/ej2-angular-grids';
import { DatePicker, MaskedDateTimeService, RenderDayCellEventArgs } from '@syncfusion/ej2-angular-calendars';

import { ShowBulkLocationActionDialog, ShowExportDialog, ShowFilterDialog, ShowSideDialog, ShowToast } from '../../store/app.actions';
import { Department, DepartmentFilter, DepartmentFilterOptions, DepartmentsPage } from '@shared/models/department.model';
import {

  BulkDeleteDepartment,
  BulkDeleteDepartmentFailed,
  BulkDeleteDepartmentsucceeded,
  BulkUpdateDepartment,
  BulkUpdateDepartmentFailed,
  BulkUpdateDepartmentsucceeded,
  ClearDepartmentList,
  ClearLocationList,
  DeleteDepartmentById,
  ExportDepartments,
  GetAssignedSkillsByOrganization,
  GetDepartmentFilterOptions,
  GetDepartmentsByLocationId,
  GetLocationsByRegionId,
  GetOrganizationById,
  GetRegions,
  SaveDepartment,
  SaveDepartmentConfirm,
  SaveDepartmentSucceeded,
  UpdateDepartment,
} from '../store/organization-management.actions';
import { Region } from '@shared/models/region.model';
import { Location } from '@shared/models/location.model';
import { OrganizationManagementState } from '../store/organization-management.state';
import { MessageTypes } from '@shared/enums/message-types';
import {
  Bulk_Delete_Department,
  Bulk_Update_Department,
  CANCEL_CONFIRM_TEXT,
  DELETE_CONFIRM_TITLE,
  IRP_DEPARTMENT_CHANGE_WARNING,
  OrganizationalHierarchy,
  OrganizationSettingKeys,
  RECORD_ADDED,
  RECORD_MODIFIED,
} from '@shared/constants';
import { ConfirmService } from '@shared/services/confirm.service';
import { ExportColumn, ExportOptions, ExportPayload } from '@shared/models/export.model';
import { DatePipe } from '@angular/common';
import { ExportedFileType } from '@shared/enums/exported-file-type';
import { UserState } from 'src/app/store/user.state';
import { FilterService } from '@shared/services/filter.service';
import { FilterColumnsModel, FilteredItem } from '@shared/models/filter.model';
import { DepartmentService } from '@organization-management/departments/services/department.service';
import { TakeUntilDestroy } from '@core/decorators';
import { AppState } from '../../store/app.state';
import { DepartmentsExportCols } from '@organization-management/departments/constants';
import { DepartmentsAdapter } from '@organization-management/departments/adapters/departments.adapter';
import { endDateValidator, startDateValidator } from '@shared/validators/date.validator';
import { DateTimeHelper } from '@core/helpers';
import { ListOfSkills } from '@shared/models/skill.model';
import { difference } from 'lodash';
import { SystemType } from '@shared/enums/system-type.enum';
import { SettingsViewService } from '@shared/services';
import { AbstractPermissionGrid } from '@shared/helpers/permissions/abstract-permission-grid';
import { GetOrganizationStructure } from 'src/app/store/user.actions';

export const MESSAGE_REGIONS_OR_LOCATIONS_NOT_SELECTED = 'Region or Location were not selected';
enum BulkDepartmentActionConfig {
  'Ediit',
  'Delete'
}
@TakeUntilDestroy
@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss'],
  providers: [MaskedDateTimeService],
})
export class DepartmentsComponent extends AbstractPermissionGrid implements OnInit, OnDestroy {
  @Select(UserState.lastSelectedOrganizationId)
  private organizationId$: Observable<number>;

  @Select(OrganizationManagementState.departments)
  public departments$: Observable<DepartmentsPage>;

  @Select(OrganizationManagementState.departmentFilterOptions)
  private departmentFilterOptions$: Observable<DepartmentFilterOptions>;

  @Select(OrganizationManagementState.sortedRegions)
  public regions$: Observable<Region[]>;

  @Select(OrganizationManagementState.sortedLocationsByRegionId)
  public locations$: Observable<Location[]>;

  @Select(OrganizationManagementState.assignedSkillsByOrganization)
  skills$: Observable<ListOfSkills[]>;

  @ViewChild('grid') grid: GridComponent;
  @ViewChild('gridPager') pager: PagerComponent;
  @ViewChild('reactivationDatepicker') reactivationDatepicker: DatePicker;
  @ViewChild('inactivationDatepicker') inactivationDatepicker: DatePicker;

  departmentsDetailsFormGroup: FormGroup;
  fieldsSettings: FieldSettingsModel = { text: 'name', value: 'id' };
  irpFieldsSettings: FieldSettingsModel = { text: 'text', value: 'value' };
  skillFields: FieldSettingsModel = { text: 'name', value: 'masterSkillId' };

  defaultValue: number | undefined;
  isLocationsDropDownEnabled = false;
  columnsToExport: ExportColumn[];
  fileName: string;
  defaultLocationValue: number;
  DepartmentFilterFormGroup: FormGroup;
  filterColumns: FilterColumnsModel;
  importDialogEvent: Subject<boolean> = new Subject<boolean>();
  isIRPFlagEnabled = false;
  isLocationIRPEnabled = false;
  isOrgUseIRPAndVMS = false;
  isInvoiceDepartmentIdFieldShow = true;
  primarySkills: ListOfSkills[] = [];
  secondarySkills: ListOfSkills[] = [];
  areSkillsAvailable: boolean;
  isPrimarySkillRequired: boolean;

  protected componentDestroy: () => Observable<unknown>;

  private initialIrpValue: boolean;
  private selectedRegion: Region;
  public selectedLocation: Location;
  private editedDepartmentId?: number;
  public isEdit: boolean;
  private defaultFileName: string;
  private filters: DepartmentFilter = {
    pageNumber: this.currentPage,
    pageSize: this.pageSizePager,
  };
  private pageSubject = new Subject<number>();

  public isVMSEnabled: boolean;
  public isIRPEnabled: boolean;
  public minReactivateDate: string | null;
  public maxInactivateDate: string | null;

  public showSkillConfirmDialog = false;
  public irpDepartmentChangeWarning = IRP_DEPARTMENT_CHANGE_WARNING;
  public replaceOrder = false;
  public departmentChangeConfirm$ = new Subject<boolean>();

  constructor(
    protected override store: Store,
    private confirmService: ConfirmService,
    private datePipe: DatePipe,
    private filterService: FilterService,
    private departmentService: DepartmentService,
    private action$: Actions,
    private settingsViewService: SettingsViewService
  ) {
    super(store);

    this.idFieldName = 'departmentId';
    this.checkIRPFlag();
  }

  public bulkaction: BulkDepartmentActionConfig = 0;
  public isbulkedit=false;
  public isbulkdelete=false;
  public bulkactionmessage:string;
  public bulkactionnotvalidlocationnmaes:string[];
  public isDepartment=true;

  get dialogHeader(): string {
    return this.isEdit ? 'Edit' : 'Add';
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.watchForDepartmentUpdate();
    this.createDepartmentsForm();

    this.filterColumns = this.departmentService.initFilterColumns(this.isIRPFlagEnabled);

    this.startDepartmentOptionsWatching();
    this.startPageNumberWatching();
    this.startOrgIdWatching();
    this.getSkills();
    this.listenPrimarySkill();
    this.getDepartmentSkillConfig();
  }

  ngOnDestroy(): void {
    this.store.dispatch(new ClearLocationList());
    this.store.dispatch(new ClearDepartmentList());
  }

  public override updatePage(): void {
    this.getDepartments();
  }

  public onFilterClose() {
    this.departmentService.populateFilterForm(this.DepartmentFilterFormGroup, this.filters, this.isIRPFlagEnabled);

    this.filteredItems = this.filterService.generateChips(
      this.DepartmentFilterFormGroup,
      this.filterColumns,
      this.datePipe
    );
  }

  public showFilters(): void {
    this.store.dispatch(new ShowFilterDialog(true));
  }

  public onFilterDelete(event: FilteredItem): void {
    this.filterService.removeValue(event, this.DepartmentFilterFormGroup, this.filterColumns);
  }

  public onFilterClearAll(): void {
    this.clearFilters();
    this.getDepartments();
  }

  public onFilterApply(): void {
    const { inactiveDate, ...formValue } = this.DepartmentFilterFormGroup.getRawValue();

    this.filters = formValue;
    this.filters.inactiveDate = inactiveDate ? DateTimeHelper.setUtcTimeZone(inactiveDate) : '';
    this.filteredItems = this.filterService.generateChips(
      this.DepartmentFilterFormGroup,
      this.filterColumns,
      this.datePipe
    );

    this.getDepartments();
    this.store.dispatch(new ShowFilterDialog(false));
  }

  public override customExport(): void {
    this.defaultFileName = 'Organization Departments ' + this.generateDateTime(this.datePipe);
    this.fileName = this.defaultFileName;
    this.store.dispatch(new ShowExportDialog(true));
  }

  public closeExport() {
    this.fileName = '';
    this.store.dispatch(new ShowExportDialog(false));
  }

  public export(event: ExportOptions): void {
    this.closeExport();
    this.defaultExport(event.fileType, event);
  }

  public override defaultExport(fileType: ExportedFileType, options?: ExportOptions): void {
    this.defaultFileName = 'Organization Departments ' + this.generateDateTime(this.datePipe);
    this.store.dispatch(
      new ExportDepartments(
        new ExportPayload(
          fileType,
          { ...this.filters, offset: Math.abs(new Date().getTimezoneOffset()) },
          options ? options.columns.map((val) => val.column) : this.columnsToExport.map((val) => val.column),
          this.selectedItems.length ? this.selectedItems.map((val) => val[this.idFieldName]) : null,
          options?.fileName || this.defaultFileName,
          this.selectedItems.length ? 180 : null
        )
      )
    );
    this.clearSelection(this.grid);
  }

  public handleInactivationDatepickerRenderCell(event: RenderDayCellEventArgs): void {
    const { inactiveDate, reactivateDate } = this.selectedLocation;
    const start = inactiveDate ? DateTimeHelper.setCurrentTimeZone(inactiveDate) : null;
    const end = reactivateDate ? DateTimeHelper.setCurrentTimeZone(reactivateDate) : null;

    if (!event.date || !start) {
      return;
    }

    if (!reactivateDate && start < event.date) {
      event.isDisabled = true;
      return;
    }

    if (start < event.date && end && end > event.date) {
      event.isDisabled = true;
    }
  }

  private watchForDepartmentUpdate(): void {
    this.action$.pipe(ofActionDispatched(SaveDepartmentSucceeded), takeUntil(this.componentDestroy())).subscribe(() => {
      this.store.dispatch([new ShowSideDialog(false), new GetOrganizationStructure()]);
      this.removeActiveCssClass();
      this.departmentsDetailsFormGroup.reset();
      if (this.isEdit) {
        this.isEdit = false;
        this.editedDepartmentId = undefined;
        this.store.dispatch(new ShowToast(MessageTypes.Success, RECORD_MODIFIED));
      } else {
        this.store.dispatch(new ShowToast(MessageTypes.Success, RECORD_ADDED));
      }
    });
    this.action$.pipe(ofActionDispatched(SaveDepartmentConfirm), takeUntil(this.componentDestroy())).subscribe(() => {
      this.confirmService
        .confirm('Department has active orders past the inactivation date. Do you want to proceed?', {
          title: 'Confirmation',
          okButtonLabel: 'Yes',
          cancelButtonLabel: 'No',
          okButtonClass: 'delete-button',
        })
        .pipe(filter(Boolean), takeUntil(this.componentDestroy()))
        .subscribe(() => {
          this.onDepartmentFormSaveClick(true);
        });
    });
    this.action$
    .pipe(
      ofActionSuccessful(BulkUpdateDepartmentsucceeded),
      takeUntil(this.componentDestroy())
    ).subscribe((payload) => {
      this.departmentsDetailsFormGroup.reset();

      this.clearSelection(this.grid);

      let locationNames=payload.payload.names;
      if(locationNames && locationNames.length > 0){
        this.bulkaction=0;
        this.bulkactionnotvalidlocationnmaes=locationNames;
        this.bulkactionmessage = payload.payload.message.replace(/;/g,'; ');
        const departmentName= this.bulkactionnotvalidlocationnmaes.join(', ');
        this.bulkactionmessage='Following Department cannot be Updated: '+departmentName +' '+ this.bulkactionmessage;
       this.store.dispatch(new ShowToast(MessageTypes.Error, this.bulkactionmessage));

      }
      else{
        this.store.dispatch(new ShowToast(MessageTypes.Success, Bulk_Update_Department));
      }
      this.getDepartments();
      this.store.dispatch(new ShowSideDialog(false));
      this.isbulkedit=false;
      this.isbulkdelete=false;

    });
    this.action$
    .pipe(
      ofActionSuccessful(BulkUpdateDepartmentFailed),
      takeUntil(this.componentDestroy())
    ).subscribe((payload) => {
        this.bulkactionmessage = payload.payload.message.replace(/;/g,'; ');
        this.bulkactionnotvalidlocationnmaes=[];
        this.bulkaction=0;
        this.clearSelection(this.grid);
        this.bulkactionmessage='Selected Records are not updated. They have '+ this.bulkactionmessage;
        this.store.dispatch(new ShowToast(MessageTypes.Error, this.bulkactionmessage));
        this.getDepartments();
        this.isbulkedit=false;

        this.store.dispatch(new ShowSideDialog(false));
        this.isbulkedit=false;
        this.isbulkdelete=false;

    });
    this.action$
    .pipe(
      ofActionSuccessful(BulkDeleteDepartmentsucceeded),
      takeUntil(this.componentDestroy())
    ).subscribe((payload) => {
      this.departmentsDetailsFormGroup.reset();
      this.clearSelection(this.grid);
      let locationNames=payload.payload.names;
      if(locationNames && locationNames.length > 0){
        this.bulkaction=1;
        this.bulkactionnotvalidlocationnmaes=locationNames;
        this.bulkactionmessage = payload.payload.message.replace(/;/g,'; ');
        const departmentName= this.bulkactionnotvalidlocationnmaes.join(', ');
        this.bulkactionmessage='This Department cannot be deleted. '+departmentName +' This Department was used in  '+ this.bulkactionmessage;
       this.store.dispatch(new ShowToast(MessageTypes.Error, this.bulkactionmessage));
      }
      else{
        this.store.dispatch(new ShowToast(MessageTypes.Success, Bulk_Delete_Department));
      }
      this.getDepartments();
      this.isbulkedit=false;
      this.isbulkdelete=false;
    });
    this.action$
    .pipe(
      ofActionSuccessful(BulkDeleteDepartmentFailed),
      takeUntil(this.componentDestroy())
    ).subscribe((payload) => {
      let locationNames=payload.payload.names;
        this.bulkactionmessage = payload.payload.message.replace(/;/g,'; ');
        this.bulkactionnotvalidlocationnmaes=locationNames;
        this.bulkaction=1;
        this.clearSelection(this.grid);
        const departmentName= this.bulkactionnotvalidlocationnmaes.join(', ');
        this.bulkactionmessage='This Department cannot be deleted. '+departmentName +' This Department was used in  '+ this.bulkactionmessage;
       this.store.dispatch(new ShowToast(MessageTypes.Error, this.bulkactionmessage));
        this.getDepartments();
        this.isbulkedit=false;
        this.isbulkdelete=false;
    });
  }

  onRegionDropDownChanged(event: ChangeEventArgs): void {
    this.selectedRegion = event.itemData as Region;
    if (this.selectedRegion?.id) {
      this.store
        .dispatch(new GetLocationsByRegionId(this.selectedRegion.id))
        .pipe(takeUntil(this.componentDestroy()))
        .subscribe((data) => {
          if (data.organizationManagement.locations.length > 0) {
            this.defaultLocationValue = data.organizationManagement.locations[0].id;
          }
        });
      this.isLocationsDropDownEnabled = true;
    } else {
      this.store.dispatch(new ClearLocationList());
      this.store.dispatch(new ClearDepartmentList());
    }
    this.clearSelection(this.grid);
  }

  onLocationDropDownChanged(event: ChangeEventArgs): void {
    this.selectedLocation = event.itemData as Location;
    if (this.selectedLocation?.id) {
      this.getDepartments();
      this.clearSelection(this.grid);
      this.isLocationIRPEnabled = this.selectedLocation.includeInIRP;
    } else {
      this.grid.dataSource = [];
    }
  }

  formatPhoneNumber(field: string, department: Department): string {
    const departmentValue = department[field as keyof Department] as string;
    return departmentValue?.toString().length === 10
      ? departmentValue.replace(/^(\d{3})(\d{3})(\d{4}).*/, '$1-$2-$3')
      : departmentValue;
  }

  onRowsDropDownChanged(): void {
    this.pageSize = parseInt(this.activeRowsPerPageDropDown);
    this.grid.pageSettings.pageSize = this.pageSize;
  }

  changeTablePagination(event: { currentPage?: number; value: number }): void {
    if (event.currentPage || event.value) {
      this.pageSubject.next(event.currentPage || event.value);
    }
  }

  onEditDepartmentClick(department: Department, event: MouseEvent): void {
    this.addActiveCssClass(event);
    this.departmentService.populateDepartmentDetailsForm(
      this.departmentsDetailsFormGroup,
      department,
      this.isIRPFlagEnabled
    );
    this.initialIrpValue = !!department.includeInIRP;
    this.editedDepartmentId = department.departmentId;
    this.isLocationIRPEnabled = !!department.locationIncludeInIRP;
    this.isEdit = true;
    this.reactivationDateHandler();
    this.store.dispatch(new ShowSideDialog(true));
    this.inactivateDateHandler(
      this.departmentsDetailsFormGroup.controls['inactiveDate'],
      department.inactiveDate,
      department.reactivateDate
    );
  }
  OnBulkEdit(){
    this.isbulkedit=true;
    this.bulkaction=0;
    this.isEdit = true;
    let departmentsDetail: Department[] = this.selectedItems.map(val => ({
      id: val.id,
      editedLocationId: val.id,
      departmentId: val.departmentId,
      locationId: val.locationId,
      extDepartmentId: val.extDepartmentId,
      invoiceDepartmentId: val.invoiceDepartmentId,
      departmentName: val.departmentName,
      facilityContact: val.facilityContact,
      facilityEmail: val.facilityEmail,
      facilityPhoneNo: val.facilityPhoneNo,
      inactiveDate: val.inactiveDate ,
      reactivateDate: val.reactivateDate,
      unitDescription: val.unitDescription,
      locationIncludeInIRP: val.locationIncludeInIRP,
      isDeactivated:val.isDeactivated,
      ignoreValidationWarning: val.ignoreValidationWarning,
      primarySkills: val.primarySkills,
      secondarySkills: val.secondarySkills,
      primarySkillNames: val.primarySkillNames,
      secondarySkillNames: val.secondarySkillNames,
      createReplacement:val.createReplacement,
     includeInIRP: val.includeInIRP,
    }));
    let includeInIRPStatus=  departmentsDetail.every(x=>x.includeInIRP==true);
    this.departmentsDetailsFormGroup.controls['includeInIRP'].setValue(includeInIRPStatus);
    this.store.dispatch(new ShowSideDialog(true));
  }

  private inactivateDateHandler(field: AbstractControl, value: string | null, reactivateValue: string | null): void {
    if (value) {
      const inactiveDate = new Date(DateTimeHelper.formatDateUTC(value, 'MM/dd/yyyy'));
      const reactivateDate = reactivateValue
        ? new Date(DateTimeHelper.formatDateUTC(reactivateValue, 'MM/dd/yyyy'))
        : null;
      inactiveDate.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const inactiveInPast = DateTimeHelper.hasDateBefore(inactiveDate, now);
      const areDatesInThePast = (reactivateDate && DateTimeHelper.hasDateBefore(reactivateDate, now)) &&
      inactiveInPast;
      if (areDatesInThePast || inactiveInPast) {
        field.disable();
      } else {
        field.enable();
      }
    } else {
      field.enable();
    }
  }

  onRemoveDepartmentClick(department: Department, event: Event): void {
    this.addActiveCssClass(event);
    this.confirmService
      .confirm('Are you sure you want to delete this department?', {
        title: 'Delete Department',
        okButtonLabel: 'Delete',
        okButtonClass: 'delete-button',
      })
      .pipe(takeUntil(this.componentDestroy()))
      .subscribe((confirm) => {
        if (confirm && department.departmentId) {
          this.store.dispatch(new DeleteDepartmentById(department, this.filters));
        }
        this.removeActiveCssClass();
      });
  }

  private reactivationDateHandler(): void {
    if (this.selectedLocation) {
      const reactivationDateField = this.departmentsDetailsFormGroup.controls['reactivateDate'];
      const reactivateDate = this.selectedLocation.reactivateDate
        ? new Date(this.selectedLocation.reactivateDate)
        : null;
      const inactiveDate = this.selectedLocation.inactiveDate ? new Date(this.selectedLocation.inactiveDate) : null;
      this.minReactivateDate = reactivateDate
        ? DateTimeHelper.formatDateUTC(reactivateDate.toISOString(), 'MM/dd/yyyy')
        : null;
      this.maxInactivateDate = inactiveDate
        ? DateTimeHelper.formatDateUTC(inactiveDate.toISOString(), 'MM/dd/yyyy')
        : null;
      if (!this.selectedLocation.reactivateDate && this.selectedLocation.isDeactivated) {
        reactivationDateField.disable();
      } else {
        reactivationDateField.enable();
        this.reactivationDatepicker.refresh();
        this.inactivationDatepicker.refresh();
      }
    }
  }

  onAddDepartmentClick(): void {
    if (this.selectedLocation && this.selectedRegion) {
      this.departmentsDetailsFormGroup.controls['inactiveDate'].enable();
      this.departmentsDetailsFormGroup.controls['includeInIRP']?.setValue(
        this.isIRPFlagEnabled && !this.isOrgUseIRPAndVMS
      );
      this.isLocationIRPEnabled = this.selectedLocation.includeInIRP;
      this.reactivationDateHandler();
      this.store.dispatch(new ShowSideDialog(true));
    } else {
      this.store.dispatch(new ShowToast(MessageTypes.Error, MESSAGE_REGIONS_OR_LOCATIONS_NOT_SELECTED));
    }
  }

  onDepartmentFormCancelClick(): void {
    if (this.departmentsDetailsFormGroup.dirty) {
      this.confirmService
        .confirm(CANCEL_CONFIRM_TEXT, {
          title: DELETE_CONFIRM_TITLE,
          okButtonLabel: 'Leave',
          okButtonClass: 'delete-button',
        })
        .pipe(filter(Boolean), takeUntil(this.componentDestroy()))
        .subscribe(() => {
          this.closeDepartmentWindow();
        });
    } else {
      this.closeDepartmentWindow();
    }
    this.isbulkedit=false;
    this.isbulkdelete=false;
  }

  onDepartmentFormSaveClick(ignoreWarning = false): void {
    const inactiveDate = this.departmentsDetailsFormGroup.controls['inactiveDate'].value;
    if(this.isbulkedit)
    {
      let departments: Department[];
      let departmentsDetails: Department[] = this.selectedItems.map(val => ({


        id: val.id,
        editedLocationId: val.id,
        departmentId: val.departmentId,
        locationId: val.locationId,
        extDepartmentId: val.extDepartmentId,
        invoiceDepartmentId: val.invoiceDepartmentId,
        departmentName: val.departmentName,
        facilityContact: val.facilityContact,
        facilityEmail: val.facilityEmail,
        facilityPhoneNo: val.facilityPhoneNo,
        inactiveDate: inactiveDate ? DateTimeHelper.setInitHours(DateTimeHelper.setUtcTimeZone(inactiveDate)) : null,
        reactivateDate: val.reactivateDate,
        unitDescription: val.unitDescription,
        locationIncludeInIRP: val.locationIncludeInIRP,
        isDeactivated:val.isDeactivated,
        ignoreValidationWarning: val.ignoreValidationWarning,

        primarySkills: val.primarySkills,
        secondarySkills: val.secondarySkills,
        primarySkillNames: val.primarySkillNames,
        secondarySkillNames: val.secondarySkillNames,
        createReplacement:val.createReplacement,
       includeInIRP: this.departmentsDetailsFormGroup.controls['includeInIRP'].value,
      }));
     this.store.dispatch(new BulkUpdateDepartment(departmentsDetails));
    }
    else
    {
      if (this.departmentsDetailsFormGroup.valid) {
        const department: Department = DepartmentsAdapter.prepareToSave(
          this.editedDepartmentId,
          this.selectedLocation.id,
          this.departmentsDetailsFormGroup,
          this.areSkillsAvailable
        );
        this.saveOrUpdateDepartment(department, ignoreWarning);
      } else {
        this.departmentsDetailsFormGroup.markAllAsTouched();
      }
    }
  }

  onImportDataClick(): void {
    this.importDialogEvent.next(true);
  }

  private closeDepartmentWindow(): void {
    this.store.dispatch(new ShowSideDialog(false));
    this.isEdit = false;
    this.editedDepartmentId = undefined;
    this.departmentsDetailsFormGroup.reset();
    this.removeActiveCssClass();
  }

  private saveDepartment(department: Department, ignoreWarning: boolean): void {
    this.store.dispatch(new UpdateDepartment(department, this.filters, ignoreWarning, this.replaceOrder));
  }

  private showDepartmentChangeConfirmation(department: Department, ignoreWarning: boolean): void {
    this.showSkillConfirmDialog = true;
    this.departmentChangeConfirm$
      .pipe(
        take(1),
        tap(() => (this.showSkillConfirmDialog = false)),
        filter(Boolean)
      )
      .subscribe(() => {
        this.saveDepartment(department, ignoreWarning);
      });
  }

  private updateDepartment(department: Department, ignoreWarning: boolean): void {
    if ((this.isIRPFlagEnabled && this.isSkillChanged()) || this.isExcludedFromIrp()) {
      this.showDepartmentChangeConfirmation(department, ignoreWarning);
    } else {
      this.saveDepartment(department, ignoreWarning);
    }
  }

  private saveOrUpdateDepartment(department: Department, ignoreWarning: boolean): void {

    if (this.isEdit) {
      this.updateDepartment(department, ignoreWarning);
    } else {
      this.store.dispatch(new SaveDepartment(department, this.filters));
    }
  }
  OnBulkDelete(){
      this.isbulkdelete=true;
      this.bulkaction=1;
      this.confirmService
        .confirm('Are you sure you want to delete these departments?', {
          title: 'Delete Departments',
          okButtonLabel: 'Delete',
          okButtonClass: 'delete-button',
        }).pipe(
          take(1)
        ).subscribe((confirm) => {
          if (confirm) {

            let selecteddepartmentstodelete = this.selectedItems.map((val) => (val?.departmentId
              ?? 0));

            this.store.dispatch(new BulkDeleteDepartment(selecteddepartmentstodelete));
          }
          this.removeActiveCssClass();
        });
    }
  private checkIRPFlag(): void {
    this.isIRPFlagEnabled = this.store.selectSnapshot(AppState.isIrpFlagEnabled);
  }

  private checkOrgPreferences(): void {
    const { isIRPEnabled, isVMCEnabled } =
      this.store.selectSnapshot(OrganizationManagementState.organization)?.preferences || {};

    this.isOrgUseIRPAndVMS = !!(isVMCEnabled && isIRPEnabled);
    this.isInvoiceDepartmentIdFieldShow = !this.isIRPFlagEnabled || !!isVMCEnabled || !(!isVMCEnabled && isIRPEnabled);

    if (!this.isInvoiceDepartmentIdFieldShow) {
      this.departmentsDetailsFormGroup.removeControl('invoiceDepartmentId');
    }

    this.grid.getColumnByField('invoiceDepartmentId').visible = this.isInvoiceDepartmentIdFieldShow;
    this.grid.getColumnByField('includeInIRP').visible = this.isIRPFlagEnabled && this.isOrgUseIRPAndVMS;
    this.grid.getColumnByField('primarySkillNames').visible = this.isIRPFlagEnabled && !!isIRPEnabled;
    this.grid.getColumnByField('secondarySkillNames').visible = this.isIRPFlagEnabled && !!isIRPEnabled;

    this.columnsToExport = DepartmentsExportCols(
      this.isIRPFlagEnabled && this.isOrgUseIRPAndVMS,
      this.isInvoiceDepartmentIdFieldShow
    );
    this.grid.refreshColumns();
  }

  private createDepartmentsForm(): void {
    this.departmentsDetailsFormGroup = this.departmentService.createDepartmentDetailForm(
      this.isIRPFlagEnabled,
      this.isOrgUseIRPAndVMS
    );
    this.DepartmentFilterFormGroup = this.departmentService.createDepartmentFilterForm(this.isIRPFlagEnabled);
    this.addDatesValidation();
  }

  private addDatesValidation(): void {
    const inactiveDate = this.departmentsDetailsFormGroup.controls['inactiveDate'];
    const reactivateDate = this.departmentsDetailsFormGroup.controls['reactivateDate'];
    inactiveDate.addValidators(startDateValidator(this.departmentsDetailsFormGroup, 'reactivateDate'));
    reactivateDate.addValidators(endDateValidator(this.departmentsDetailsFormGroup, 'inactiveDate'));
    inactiveDate.valueChanges
      .pipe(takeUntil(this.componentDestroy()))
      .subscribe(() => reactivateDate.updateValueAndValidity({ onlySelf: true, emitEvent: false }));
    reactivateDate.valueChanges
      .pipe(takeUntil(this.componentDestroy()))
      .subscribe(() => inactiveDate.updateValueAndValidity({ onlySelf: true, emitEvent: false }));
  }

  private startDepartmentOptionsWatching(): void {
    this.departmentFilterOptions$.pipe(filter(Boolean), takeUntil(this.componentDestroy())).subscribe((options) => {
      this.departmentService.populateDataSources(this.filterColumns, options as any, this.isIRPFlagEnabled);
    });
  }

  private startPageNumberWatching(): void {
    this.pageSubject.pipe(throttleTime(1), takeUntil(this.componentDestroy())).subscribe((page) => {
      this.currentPage = page;
      this.getDepartments();
    });
  }

  private startOrgIdWatching(): void {
    this.organizationId$.pipe(takeUntil(this.componentDestroy())).subscribe((id) => {
      this.clearFilters();
      this.getOrganization(id);
      this.store
        .dispatch(new GetRegions())
        .pipe(takeUntil(this.componentDestroy()))
        .subscribe(() => {
          const regions = this.store.selectSnapshot(OrganizationManagementState.regions);
          this.defaultValue = regions[0]?.id;
        });
    });
  }

  private getOrganization(businessUnitId: number) {
    const id = businessUnitId || (this.store.selectSnapshot(UserState.user)?.businessUnitId as number);

    this.store
      .dispatch(new GetOrganizationById(id))
      .pipe(takeUntil(this.componentDestroy()))
      .subscribe(() => {
        this.checkOrgPreferences();
      });
  }

  private getDepartments(): void {
    this.filters.locationId = this.selectedLocation.id;
    this.filters.pageNumber = this.currentPage;
    this.filters.pageSize = this.pageSize;
    this.filters.orderBy = this.orderBy;
    this.store.dispatch([
      new GetDepartmentsByLocationId(this.selectedLocation.id, this.filters),
      new GetDepartmentFilterOptions(this.selectedLocation.id as number),
    ]);
  }

  private clearFilters(): void {
    this.DepartmentFilterFormGroup.reset();
    this.filteredItems = [];
    this.currentPage = 1;
    this.filters = {};
  }

  private getSkills(): void {
    this.store.dispatch(new GetAssignedSkillsByOrganization({ params: { SystemType: SystemType.IRP } }));
    this.skills$.pipe(takeUntil(this.componentDestroy())).subscribe((skills) => {
      this.primarySkills = skills;
      this.secondarySkills = skills;
    });
  }

  private listenPrimarySkill(): void {
    this.departmentsDetailsFormGroup
      .get('primarySkills')
      ?.valueChanges.pipe(takeUntil(this.componentDestroy()))
      .subscribe((formValue) => {
        const diff = difference(
          this.primarySkills.map(({ masterSkillId }: ListOfSkills) => masterSkillId),
          formValue
        );
        this.secondarySkills = this.primarySkills.filter(({ masterSkillId }: ListOfSkills) =>
          diff.includes(masterSkillId)
        );
        this.departmentsDetailsFormGroup.get('secondarySkills')?.reset();
      });
  }

  private getIrpToggleStream(): Observable<boolean> {
    const includeInIRPControl$ = this.departmentsDetailsFormGroup.get('includeInIRP')?.valueChanges;

    if (this.isVMSEnabled && this.isIRPEnabled && includeInIRPControl$) {
      return includeInIRPControl$;
    } else {
      return of(this.isIRPFlagEnabled && this.isIRPEnabled);
    }
  }

  private isSkillChanged(): boolean {
    return !!(
      this.departmentsDetailsFormGroup.get('primarySkills')?.dirty ||
      this.departmentsDetailsFormGroup.get('secondarySkills')?.dirty
    );
  }

  /**
   * Detects if inactivation date was changed or reactivation date was deleted
   * @returns boolean
   */
  private isDateChanged(): boolean {
    return !!(
      this.departmentsDetailsFormGroup.get('inactiveDate')?.dirty ||
      (this.departmentsDetailsFormGroup.get('reactivateDate')?.dirty &&
        !this.departmentsDetailsFormGroup.get('reactivateDate')?.value)
    );
  }

  private isExcludedFromIrp(): boolean {
    const wasIncludedInIrp = this.initialIrpValue === true;
    return !!(
      wasIncludedInIrp &&
      this.departmentsDetailsFormGroup.get('includeInIRP')?.dirty &&
      !this.departmentsDetailsFormGroup.get('includeInIRP')?.value
    );
  }

  private configureSkillDropdowns(isIRP: boolean): void {
    const primarySkillsControl = this.departmentsDetailsFormGroup.get('primarySkills');
    const secondarySkillsControl = this.departmentsDetailsFormGroup.get('secondarySkills');

    if (this.isPrimarySkillRequired && isIRP) {
      primarySkillsControl?.setValidators(Validators.required);
      primarySkillsControl?.enable();
      secondarySkillsControl?.enable();
    } else if (!this.isPrimarySkillRequired && isIRP) {
      primarySkillsControl?.removeValidators(Validators.required);
      primarySkillsControl?.disable();
      secondarySkillsControl?.disable();
    } else {
      primarySkillsControl?.removeValidators(Validators.required);
      primarySkillsControl?.updateValueAndValidity();
    }
  }

  private getDepartmentSkillConfig(): void {
    this.organizationId$
      .pipe(
        filter((id) => !!id),
        debounceTime(100),
        switchMap((id) => {
          return this.settingsViewService.getViewSettingKey(
            OrganizationSettingKeys.DepartmentSkillRequired,
            OrganizationalHierarchy.Organization,
            id,
            id,
            true
          );
        }),
        tap((data) => {
          const { preferences } = this.store.selectSnapshot(OrganizationManagementState.organization) || {};
          const areSkillsRequired = data[OrganizationSettingKeys[OrganizationSettingKeys.DepartmentSkillRequired]];

          this.isPrimarySkillRequired = areSkillsRequired === 'true';
          this.isIRPEnabled = !!preferences?.isIRPEnabled;
          this.isVMSEnabled = !!preferences?.isVMCEnabled;
        }),
        switchMap(() => this.getIrpToggleStream()),
        takeUntil(this.componentDestroy())
      )
      .subscribe((state) => {
        const isIncludedInIRP = !!(state && this.isIRPFlagEnabled && this.isIRPEnabled);
        this.areSkillsAvailable = isIncludedInIRP;
        this.configureSkillDropdowns(isIncludedInIRP);
      });
  }
}
