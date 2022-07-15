import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Observable, takeUntil } from 'rxjs';
import { filter, skip, take, tap, switchMap } from 'rxjs/operators';
import { Select, Store } from '@ngxs/store';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { TabComponent, SelectingEventArgs } from '@syncfusion/ej2-angular-navigations';
import { GridApi, GridReadyEvent, IClientSideRowModel, Module } from '@ag-grid-community/core';

import { Destroyable } from '@core/helpers';
import { RecordFields } from './../../enums/timesheet-common.enum';
import {
  TimesheetRecordsColdef,
  TimesheetRecordsColConfig,
  RecordsTabConfig,
} from './../../constants/timsheets-details.constant';
import { ConfirmService } from './../../../../shared/services/confirm.service';
import { TabConfig } from './../../interface/common.interface';
import { ConfirmTabChange } from './../../constants/confirm-delete-timesheet-dialog-content.const';
import { DialogActionPayload, TimesheetRecordsDto } from '../../interface';
import { TimesheetRecordsService } from '../../services/timesheet-records.service';
import { TimesheetsState } from '../../store/state/timesheets.state';
import { TimesheetDetails } from '../../store/actions/timesheet-details.actions';

/**
 * TODO: move tabs into separate component if possible
 */
@Component({
  selector: 'app-profile-timesheet-table',
  templateUrl: './profile-timesheet-table.component.html',
  styleUrls: ['./profile-timesheet-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileTimesheetTableComponent extends Destroyable implements AfterViewInit {
  @ViewChild('tabs') readonly tabs: TabComponent;

  @ViewChild('grid') readonly grid: IClientSideRowModel;

  @Input() candidateId: number;

  @Output() readonly openAddSideDialog: EventEmitter<void> = new EventEmitter<void>();

  @Output() readonly changesSaved: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Select(TimesheetsState.tmesheetRecords)
  public readonly timesheetRecords$: Observable<TimesheetRecordsDto>;

  @Select(TimesheetsState.isTimesheetOpen)
  public readonly isTimesheetOpen$: Observable<DialogActionPayload>;

  public isEditOn = false;

  public timesheetColDef = TimesheetRecordsColdef;

  public readonly modules: Module[] = [ClientSideRowModelModule];

  public tabsConfig: TabConfig[] = RecordsTabConfig;

  public records: TimesheetRecordsDto;

  public currentTab: RecordFields = RecordFields.Time;

  public isFirstSelected = true;

  private isChangesSaved = true;

  private formControls: Record<string, FormGroup> = {};

  private gridApi: GridApi;

  private slectingindex: number;

  constructor(
    private store: Store,
    private confirmService: ConfirmService,
    private timesheetRecordsService: TimesheetRecordsService,
    private cd: ChangeDetectorRef,
  ) {
    super();
  }

  ngAfterViewInit(): void {
    this.getRecords();
    this.watchForDialogState();
  }

  onTabSelect(selectEvent: SelectingEventArgs): void {
    this.isFirstSelected = false;

    if (!this.isChangesSaved && (this.slectingindex !== selectEvent.selectedIndex)) {
      this.confirmService.confirm(ConfirmTabChange, {
        title: 'Unsaved Progress',
        okButtonLabel: 'Proceed',
        okButtonClass: 'delete-button',
      })
      .pipe(
        take(1),
      )
      .subscribe((submitted) => {
        if (submitted) {
          this.isChangesSaved = true;
          this.selectTab(selectEvent.selectedIndex);
          this.setInitialTableState();
        } else {
          this.slectingindex = selectEvent.previousIndex;
          this.tabs.select(selectEvent.previousIndex);
        }
      });
    } else {
      if (this.isChangesSaved) {
        this.setInitialTableState();
      }
      this.selectTab(selectEvent.selectedIndex);
    }
  }

  public openAddDialog(): void {
    this.openAddSideDialog.emit()
  }

  public editTimesheets(): void {
    this.isEditOn = true;
    this.createForm();
    this.setEditModeColDef();
  }

  public onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  public cancelChanges(): void {
    this.changesSaved.emit(true);
    this.isChangesSaved = true;
    this.setInitialTableState();
  }

  public saveChanges(): void {
    const diffs = this.timesheetRecordsService.findDiffs(
      this.records[this.currentTab], this.formControls, this.timesheetColDef);

    if (diffs.length) {

      this.store.dispatch(new TimesheetDetails.PatchTimesheetRecords(this.candidateId, diffs))
      .pipe(
        takeUntil(this.componentDestroy()),
      )
      .subscribe(() => {
        this.changesSaved.emit(true);
        this.isChangesSaved = true;
        this.setInitialTableState();
      });
    }
  }

  public trackByIndex(index: number, item: TabConfig): number {
    return index;
  }

  private selectTab(index: number): void {
    this.changeColDefs(index);
  }

  private createForm(): void {
    this.formControls = this.timesheetRecordsService.createEditForm(
      this.records, this.currentTab, this.timesheetColDef);
    this.watchFormChanges();
  }

  private getRecords(): void {
    this.timesheetRecords$
    .pipe(
      tap((res) => { this.records = res; }),
      switchMap(() => this.timesheetRecordsService.getFormOptions(1,2,3, 4)),
      takeUntil(this.componentDestroy()),
    )
    .subscribe(([costCenters, billRates]) => {
      this.timesheetRecordsService.setCostOptions(this.timesheetColDef, costCenters);
      this.timesheetRecordsService.setBillRatesOptions(this.timesheetColDef, billRates);

      if (this.gridApi) {
        this.gridApi.setColumnDefs(this.timesheetColDef);
      }
    });
  }

  private setEditModeColDef(): void {
    this.timesheetColDef = this.timesheetColDef.map((def) => {
      if (def.cellRendererParams && def.cellRendererParams.editMode) {
        def.cellRendererParams.isEditable = this.isEditOn;
        def.cellRendererParams.formGroup = this.formControls;
      }
      return def;
    });

    this.gridApi.setColumnDefs(this.timesheetColDef);
  }

  private setInitialTableState(): void {
    this.isEditOn = false;
    this.formControls = {};
    this.setEditModeColDef();
  }

  private changeColDefs(idx: number): void {
    this.currentTab = this.timesheetRecordsService.getCurrentTabName(idx);
    this.timesheetColDef = TimesheetRecordsColConfig[this.currentTab];
    this.cd.markForCheck();
  }

  private watchForDialogState(): void {
    this.isTimesheetOpen$
    .pipe(
      skip(1),
      filter((payload) => !payload.dialogState),
      takeUntil(this.componentDestroy()),
    )
    .subscribe(() => {
      this.cancelChanges();
    })
  }

  private watchFormChanges(): void {
    this.timesheetRecordsService.watchFormChanges(this.formControls)
    .pipe(
      takeUntil(this.componentDestroy()),
    )
    .subscribe(() => {
      if (this.timesheetRecordsService.checkIfFormTouched(this.formControls)) {
        this.isChangesSaved = false;
        this.changesSaved.emit(false);
      }
    })
  }
}
