import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import type { FieldSettingsModel, PopupEventArgs } from '@syncfusion/ej2-angular-dropdowns';
import { takeUntil, distinctUntilChanged } from 'rxjs';

import { GRID_CONFIG } from '@shared/constants';
import { DestroyableDirective } from '@shared/directives/destroyable.directive';
import { PagerChangeEventModel } from '@shared/components/grid/grid-pagination/models/pager-change-event.model';
import { BreakpointObserverService } from '@core/services';
import { BulkActionConfig } from '@shared/models/bulk-action-data.model';
import { BulkTypeAction } from '@shared/enums/bulk-type-action.enum';

@Component({
  selector: 'app-grid-pagination',
  templateUrl: './grid-pagination.component.html',
  styleUrls: ['./grid-pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridPaginationComponent extends DestroyableDirective implements OnInit {
  @Input() public currentPage: number;
  @Input() public pageSize: number;
  @Input() public totalRecordsCount: number;
  @Input() public selectedTableRowsAmount: number = 0;
  @Input() public allowBulkSelection: boolean = false;
  @Input() public allowBulkButton: boolean = false;
  @Input() public disableBulkButton: boolean = false;
  @Input() public isDarkTheme?: boolean | null;
  @Input() public customRowsPerPageDropDownObject: { text: string; value: number }[];
  @Input() public disableRowsPerPageDropdown: boolean = false;
  @Input() public bulkActionConfig: BulkActionConfig = {};

  @Output() public navigateToPageEmitter: EventEmitter<number> = new EventEmitter<number>();
  @Output() public pageSizeChangeEmitter: EventEmitter<number> = new EventEmitter<number>();
  @Output() public bulkEventEmitter: EventEmitter<BulkTypeAction> = new EventEmitter<BulkTypeAction>();

  public paginationFormGroup: FormGroup;

  public readonly gridConfig: typeof GRID_CONFIG = GRID_CONFIG;
  public readonly perPageFieldsSettings: FieldSettingsModel = { text: 'text', value: 'value' };
  public readonly bulkTypeAction = BulkTypeAction;

  public isMobile = false;
  public isTablet = false;

  public constructor(
    private readonly formBuilder: FormBuilder,
    private readonly breakpointService: BreakpointObserverService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.getDeviceScreen();
    this.paginationFormGroup = this.getPaginationFormGroup();
    this.initPageSizeControlValueChangesListener();
    if (this.disableRowsPerPageDropdown) {
      this.paginationFormGroup.controls['pageSize'].disable();
    } else {
      this.paginationFormGroup.controls['pageSize'].enable();
    }
  }

  public handlePagerClickEvent({ currentPage }: PagerChangeEventModel): void {
    currentPage && this.navigateToPageEmitter.emit(currentPage);
  }

  private getPaginationFormGroup(): FormGroup {
    return this.formBuilder.group({ pageSize: [this.pageSize], navigateTo: [null] });
  }

  private initPageSizeControlValueChangesListener(): void {
    this.paginationFormGroup
      .get('pageSize')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((pageSize: number) => {
        this.pageSizeChangeEmitter.emit(pageSize);
      });
  }

  private getDeviceScreen(): void {
    this.breakpointService
      .getBreakpointMediaRanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ isMobile, isTablet }) => {
        this.isMobile = isMobile;
        this.isTablet = isTablet;
      });
  }

  public openDropdownPopup(args: PopupEventArgs): void {
    // reset default responsive functionality of dropdown popup
    if (this.isMobile || this.isTablet) {
      args.popup.element.classList.remove('e-ddl-device', 'e-ddl-device-filter');
      args.popup.collision = { X: 'flip', Y: 'flip' };
      args.popup.position = { X: 'left', Y: 'top' };
      args.popup.dataBind();
    }
  }
}
