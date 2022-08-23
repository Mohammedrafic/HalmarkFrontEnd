import { ChangeDetectorRef, Directive, EventEmitter, Inject, Input, Output } from '@angular/core';

import { Store } from '@ngxs/store';
import { takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';

import { OrganizationDepartment, OrganizationLocation, OrganizationRegion } from '@shared/models/organization.model';
import { FilteredItem } from '@shared/models/filter.model';
import { FilterService } from '@shared/services/filter.service';
import { Destroyable } from '@core/helpers/destroyable.helper';
import { FiltersDialogHelperService } from '@core/services/filters-dialog-helper.service';
import { CustomFormGroup } from '@core/interface';
import { leftOnlyValidValues } from '@core/helpers/validators.helper';
import { APP_FILTERS_CONFIG, filterOptionFields } from '@core/constants/filters-helper.constant';

import { findSelectedItems } from './functions.helper';

@Directive()
export class FiltersDialogHelper<T, F, S> extends Destroyable {
  @Input() activeTabIdx: number;

  @Output() readonly updateTableByFilters: EventEmitter<F> = new EventEmitter<F>();
  @Output() readonly appliedFiltersAmount: EventEmitter<number> = new EventEmitter<number>();
  @Output() readonly resetFilters: EventEmitter<void> = new EventEmitter<void>();

  public allRegions: OrganizationRegion[] = [];
  public orgRegions: OrganizationRegion[] = [];
  public filteredItems: FilteredItem[] = [];
  public filterOptionFields = filterOptionFields;
  public filterColumns: T;
  public formGroup: CustomFormGroup<T>;

  constructor(
    @Inject(APP_FILTERS_CONFIG) protected readonly filtersConfig: Record<string, string>,
    protected store: Store,
    protected filterService: FilterService,
    protected cdr: ChangeDetectorRef,
    private filtersHelperService: FiltersDialogHelperService,
  ) {
    super();
  }

  public applyFilters(): void {
    const filters: F = leftOnlyValidValues(this.formGroup);

    this.updateTableByFilters.emit(filters);
    this.filteredItems = this.filterService.generateChips(this.formGroup, this.filterColumns);
    this.appliedFiltersAmount.emit(this.filteredItems.length);
  }

  public clearAllFilters(eventEmmit = true): void {
    this.formGroup.reset();
    this.filteredItems = [];
    this.appliedFiltersAmount.emit(this.filteredItems.length);
    if (eventEmmit) {
      this.resetFilters.emit();
    }
  }

  public deleteFilter(event: FilteredItem): void {
    this.filterService.removeValue(event, this.formGroup, this.filterColumns);
    this.appliedFiltersAmount.emit(this.filteredItems.length);
  }

  protected initFormGroup(): void {
    this.formGroup = this.filtersHelperService.createForm() as CustomFormGroup<T>;
  }

  protected initFiltersColumns(stateKey: (state: S) => T): void {
    this.store.select(stateKey)
      .pipe(
        filter(Boolean),
        takeUntil(this.componentDestroy()),
      ).subscribe((filters: T | any) => {
      const { dataSource } = filters.regionsIds;
      this.orgRegions = dataSource || [];
      this.allRegions = [...this.orgRegions];
      this.filterColumns = filters;
      this.cdr.detectChanges();
    });
  }

  protected startRegionsWatching(): void {
    this.formGroup.get(this.filtersConfig['RegionsIds'])?.valueChanges
      .pipe(takeUntil(this.componentDestroy()))
      .subscribe((val: number[]) => {
        if (val?.length) {
          const selectedRegions: OrganizationRegion[] = findSelectedItems(val, this.orgRegions);

          const res: OrganizationLocation[] = [];
          selectedRegions.forEach(region => {
            region.locations?.forEach(location => location.regionName = region.name);
            res.push(...region.locations as []);
          });
          this.filtersHelperService.setDataSourceByFormKey(this.filtersConfig['LocationIds'], res);
        } else {
          this.resetDataSourceAndChips(this.filtersConfig['LocationIds']);
        }
      });
  }

  protected startLocationsWatching(): void {
    this.formGroup.get(this.filtersConfig['LocationIds'])?.valueChanges
      .pipe(takeUntil(this.componentDestroy()))
      .subscribe((locationIds: number[]) => {
        if (locationIds?.length) {
          const res: OrganizationDepartment[] = [];
          locationIds.forEach(id => {
            const selectedLocation = (this.filterColumns as any).locationIds.dataSource.find((location: OrganizationLocation) => location.id === id);
            res.push(...selectedLocation?.departments as []);
          });
          this.filtersHelperService.setDataSourceByFormKey(this.filtersConfig['DepartmentIds'], res);
        } else {
          this.resetDataSourceAndChips(this.filtersConfig['DepartmentIds']);
        }
      });
  }

  private resetDataSourceAndChips(key: string): void {
    this.filtersHelperService.setDataSourceByFormKey(key, []);
    this.formGroup.get(key)?.setValue([]);
    if (this.filteredItems.length) {
      this.filteredItems = this.filterService.generateChips(this.formGroup, this.filterColumns);
    }
    this.appliedFiltersAmount.emit(this.filteredItems.length);
  }
}
