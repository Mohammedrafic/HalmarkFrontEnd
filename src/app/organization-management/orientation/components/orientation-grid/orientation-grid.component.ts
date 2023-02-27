import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TakeUntilDestroy } from '@core/decorators';
import { findSelectedItems } from '@core/helpers';
import { BreakpointObserverService } from '@core/services';
import { Select, Store } from '@ngxs/store';
import { OrientationColumnDef } from '@organization-management/orientation/constants/orientation.constant';
import { OrientationConfiguration, OrientationConfigurationFilters, OrientationConfigurationPage } from '@organization-management/orientation/models/orientation.model';
import { OrientationService } from '@organization-management/orientation/services/orientation.service';
import { GetFilteringAssignedSkillsByOrganization } from '@organization-management/store/organization-management.actions';
import { OrganizationManagementState } from '@organization-management/store/organization-management.state';
import { ColumnDefinitionModel } from '@shared/components/grid/models';
import { mapperSelectedItems } from '@shared/components/tiers-dialog/helper';
import { DELETE_RECORD_TEXT, DELETE_RECORD_TITLE } from '@shared/constants';
import { SystemType } from '@shared/enums/system-type.enum';
import { AbstractPermissionGrid } from '@shared/helpers/permissions';
import { sortByField } from '@shared/helpers/sort-by-field.helper';
import { FilteredItem } from '@shared/models/filter.model';
import { OrganizationDepartment, OrganizationLocation, OrganizationRegion, OrganizationStructure } from '@shared/models/organization.model';
import { SkillCategory } from '@shared/models/skill-category.model';
import { Skill } from '@shared/models/skill.model';
import { ConfirmService } from '@shared/services/confirm.service';
import { FilterService } from '@shared/services/filter.service';
import { filter, Observable, takeUntil } from 'rxjs';
import { ShowFilterDialog } from 'src/app/store/app.actions';
import { UserState } from 'src/app/store/user.state';

@Component({
  selector: 'app-orientation-grid',
  templateUrl: './orientation-grid.component.html',
  styleUrls: ['./orientation-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
@TakeUntilDestroy
export class OrientationGridComponent extends AbstractPermissionGrid implements OnInit {
  @Input() public gridTitle: string;
  @Input() public dataSource: OrientationConfigurationPage;
  @Input('skillCategories') set skillCategories(value: SkillCategory[] | undefined) {
    if (value) {
      this.filterColumns.skillCategoryIds.dataSource = value as [];
    }
  };
  @Input('regions') set regions(value: OrganizationRegion[] | undefined) {
    if (value) {
      this.allRegions = this.filterColumns.regionIds.dataSource = value as [];
    }
  };
  @Output() public pageChange = new EventEmitter();
  @Output() public openDialog = new EventEmitter();
  @Output() public onEdit = new EventEmitter();
  @Output() public onDelete = new EventEmitter();

  public readonly targetElement: HTMLElement | null = document.body.querySelector('#main');

  public columnDef: ColumnDefinitionModel[];
  public allRegions: OrganizationRegion[];
  public locations: OrganizationLocation[];
  public isMobile = false;
  public isTablet = false;
  public isSmallDesktop = false;
  public isDesktop = false;
  public gridDomLayout: 'normal' | 'autoHeight' | 'print' | undefined;
  public filtersForm: FormGroup = this.orientationService.generateConfigurationFilterForm();
  public filterColumns = this.orientationService.filterColumns;
  public filters: OrientationConfigurationFilters = {
    pageNumber: 1, pageSize: this.pageSize
  };
  public optionFields = {
    text: 'name',
    value: 'id',
  };
  protected componentDestroy: () => Observable<unknown>;

  @Select(UserState.lastSelectedOrganizationId)
  public readonly organizationId$: Observable<number>;

  @Select(OrganizationManagementState.filteringAssignedSkillsByOrganization)
  public readonly skills$: Observable<Skill[]>;

  constructor(
    private cd: ChangeDetectorRef,
    protected override store: Store,
    private confirmService: ConfirmService,
    private filterService: FilterService,
    private breakpointService: BreakpointObserverService,
    private orientationService: OrientationService,
  ) {
    super(store);
    this.columnDef = OrientationColumnDef(this.edit.bind(this), this.delete.bind(this));;
  }

  public override ngOnInit(): void {
    super.ngOnInit();
    this.watchForOrgChange();
    this.watchForSkills();
    this.watchForRegions();
    this.watchForLocation();
    this.getDeviceScreen();
  }

  private watchForOrgChange(): void {
    this.organizationId$
      .pipe(
        takeUntil(this.componentDestroy()),
      ).subscribe(() => {
        this.getSkills();
        this.clearFilters();
      });
  }

  private watchForSkills(): void {
    this.skills$.pipe(
      takeUntil(this.componentDestroy()),
    ).subscribe((skills: Skill[]) => {
      this.filterColumns.skillIds.dataSource = skills as [];
    });
  }

  private watchForRegions(): void {
    this.filtersForm?.get('regionIds')?.valueChanges
      .pipe(
        filter((value: number[]) => !!value?.length),
        takeUntil(this.componentDestroy())
      )
      .subscribe((value: number[]) => {
        const selectedRegions: OrganizationRegion[] = findSelectedItems(value, this.allRegions);
        const selectedLocation: OrganizationLocation[] = mapperSelectedItems(selectedRegions, 'locations');
        this.locations = sortByField(selectedLocation, 'name');
        this.filterColumns.locationIds.dataSource = this.locations as [];
        this.cd.markForCheck();
      });
  }

  private watchForLocation(): void {
    this.filtersForm?.get('locationIds')?.valueChanges
      .pipe(
        filter((value: number[]) => !!value?.length),
        takeUntil(this.componentDestroy())
      )
      .subscribe((value: number[]) => {
        const selectedLocation: OrganizationLocation[] = findSelectedItems(value, this.locations);
        const selectedDepartment: OrganizationDepartment[] = mapperSelectedItems(selectedLocation, 'departments');
        this.filterColumns.departmentsIds.dataSource =  sortByField(selectedDepartment, 'name') as [];
        this.cd.markForCheck();
      });
  }

  private getSkills(): void {
    this.store.dispatch([new GetFilteringAssignedSkillsByOrganization({ params: { SystemType: SystemType.IRP } })]);
  }

  private dispatchNewPage(): void {
    this.pageChange.emit(this.filters);
  }

  private getDeviceScreen(): void {
    this.breakpointService.getBreakpointMediaRanges().pipe(takeUntil(this.componentDestroy())).subscribe((screen) => {
      this.isMobile = screen.isMobile;
      this.isTablet = screen.isTablet;
      this.isSmallDesktop = screen.isDesktopSmall;
      this.isDesktop = screen.isDesktopLarge;
      this.gridDomLayout = this.isMobile ? 'autoHeight' : 'normal';
      this.cd.markForCheck();
     });
  }

  private clearFilters(): void {
    this.filtersForm.reset();
    this.filteredItems = [];
    this.currentPage = 1;
    this.filters = { pageNumber: 1, pageSize: this.filters.pageSize };
  }

  public showFilters(): void {
    this.store.dispatch(new ShowFilterDialog(true));
  }

  public onFilterDelete(event: FilteredItem): void {
    this.filterService.removeValue(event, this.filtersForm, this.filterColumns);
  }

  public onFilterClearAll(): void {
    this.clearFilters();
    this.dispatchNewPage();
  }

  public onFilterApply(): void {
    this.filters = { pageNumber: this.filters.pageNumber, pageSize: this.filters.pageSize, ...this.filtersForm.getRawValue()} ;
    this.filteredItems = this.filterService.generateChips(this.filtersForm, this.filterColumns);
    this.dispatchNewPage();
    this.store.dispatch(new ShowFilterDialog(false));
  }

  public onFilterClose() {
    this.filteredItems = this.filterService.generateChips(this.filtersForm, this.filterColumns);
  }

  public handleChangePage(pageNumber: number): void {
    if (pageNumber && this.filters.pageNumber !== pageNumber) {
      this.filters.pageNumber = pageNumber;
      this.dispatchNewPage();
    }
  }

  public handleChangePageSize(pageSize: number): void {
    if (pageSize) {
      this.filters.pageSize = pageSize;
      this.dispatchNewPage();
    }
  }

  public addRecord(): void {
    this.openDialog.emit();
  }

  public edit(data: OrientationConfiguration): void {
    this.onEdit.emit(data);
  }

  public delete(data: OrientationConfiguration): void {
    this.confirmService
    .confirm(DELETE_RECORD_TEXT, {
      title: DELETE_RECORD_TITLE,
      okButtonLabel: 'Delete',
      okButtonClass: 'delete-button',
    }).pipe(
      filter(Boolean),
      takeUntil(this.componentDestroy()),
    )
    .subscribe(() => {
      this.onDelete.emit(data);
    });
  }
}