import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { Select, Store } from '@ngxs/store';
import { filter, merge, Observable, switchMap, takeUntil, tap } from 'rxjs';
import { distinctUntilChanged, map, skip } from 'rxjs/operators';

import { SystemType } from '@shared/enums/system-type.enum';
import { AssignedSkillsByOrganization, Skill } from '@shared/models/skill.model';
import { SkillsService } from '@shared/services/skills.service';
import { Destroyable, isObjectsEqual } from '@core/helpers';
import { FieldType, FilterPageName } from '@core/enums';
import { ChipDeleteEvent, ChipDeleteEventType, ChipItem } from '@shared/components/inline-chips';
import { DropdownOption, PreservedFiltersByPage } from '@core/interface';
import { FilteredItem } from '@shared/models/filter.model';
import {
  OrganizationDepartment,
  OrganizationLocation,
  OrganizationRegion,
  OrganizationStructure,
} from '@shared/models/organization.model';
import { OrganizationStructureService } from '@shared/services';
import { FilterService } from '@shared/services/filter.service';
import { ShowFilterDialog } from 'src/app/store/app.actions';
import { UserState } from 'src/app/store/user.state';
import {
  ChipsStructureState,
  FilterChipsStructure,
  ScheduleFilterFormGroupConfig,
  ScheduleFilterFormSourceKeys,
  ScheduleFiltersColumns,
} from '../../constants';
import { GetStructureValue, ScheduleFilterHelper } from '../../helpers';
import {
  ChipSettings,
  ChipsFilterStructure,
  ChipsInitialState,
  ScheduleFilters,
  ScheduleFiltersData,
  ScheduleFilterStructure,
} from '../../interface';
import { ScheduleApiService, ScheduleFiltersService } from '../../services';
import { ClearPageFilters, SaveFiltersByPageName } from 'src/app/store/preserved-filters.actions';
import { TimeMask } from '@client/order-management/components/irp-tabs/order-details/constants';
import { getPreservedfilterTime, getPreservedTime, getTime } from '@shared/utils/date-time.utils';
import { PreservedFiltersState } from 'src/app/store/preserved-filters.state';
import { Query } from "@syncfusion/ej2-data";
import { FieldNames, FiledNamesSettings } from '@shared/constants/base-dropdown-fields-settings';
import { FilteringEventArgs } from '@syncfusion/ej2-angular-dropdowns';

@Component({
  selector: 'app-schedule-filters',
  templateUrl: './schedule-filters.component.html',
  styleUrls: ['./schedule-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleFiltersComponent extends Destroyable implements OnInit {
  @Input() public selectedCandidateId: number | undefined;
  @Input() public count: number;
  @Input() public chipsData: ChipItem[];
  @Output() public updateScheduleFilter: EventEmitter<ScheduleFiltersData> = new EventEmitter<ScheduleFiltersData>();

  @Select(UserState.organizationStructure)
  private readonly organizationStructure$: Observable<OrganizationStructure>;

  @Select(PreservedFiltersState.preservedFiltersByPageName)
  private readonly preservedFiltersByPageName$: Observable<PreservedFiltersByPage<ScheduleFilters>>;

  public useGroupingFilters = true;

  public filteredItems: FilteredItem[] = [];

  public readonly scheduleFilterFormGroup = this.scheduleFiltersService.createScheduleFilterForm();

  public readonly filterColumns = ScheduleFiltersColumns;

  public readonly optionFields = { text: 'text', value: 'value' };

  public readonly formConfig = ScheduleFilterFormGroupConfig;

  public readonly fieldTypes = FieldType;

  public readonly timeMask = TimeMask;
  public filterType = 'Contains';
  public maxDepartmentsLength = 1000;
  public query: Query = new Query().take(this.maxDepartmentsLength);
  public noValue = undefined;
  public allRecords: FiledNamesSettings = {
    'regionIds': false,
    'locationIds': false,
    'departmentIds': false,
  };

  private filters: ScheduleFilters = {};
  private isPreservedFilters = false;

  private filterStructure: ScheduleFilterStructure = {
    regions: [],
    locations: [],
    departments: [],
  };

  private chipsSettings: ChipSettings = {
    editedChips: false,
    preservedChipsSkills: [],
  };

  private isHomeCostCenterFilters = false;

  constructor(
    private store: Store,
    private filterService: FilterService,
    private scheduleFilterService: ScheduleFiltersService,
    private cdr: ChangeDetectorRef,
    private scheduleFiltersService: ScheduleFiltersService,
    private scheduleApiService: ScheduleApiService,
    private organizationStructureService: OrganizationStructureService,
    private skillsService: SkillsService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.watchForOrganizationStructure();
    this.watchForEmployeeOrganizationStructure();
    this.watchForControls();
    this.observeInlineChipDeleteEvent();
    this.applyPreservedFilters();
  }

  public getToggleValue(field: string): boolean {
    return this.allRecords[field as FieldNames];
  }

  public allRecordsChange(event: { checked: boolean }, field: string): void {
    field === 'regionIds' && this.allRegionsChange(event);
    field === 'locationIds' && this.allLocationsChange(event);
    field === 'departmentIds' && this.allDepartmentsChange(event);
  }

  public allRegionsChange(event: { checked: boolean }): void {
    this.allRecords[FieldNames.regionIds] = event.checked;
    const regionsControl = this.scheduleFilterFormGroup?.controls['regionIds'];
    if (this.allRecords[FieldNames.regionIds]) {
      regionsControl?.setValue(null, { emitEvent: false });
      regionsControl?.disable();
      const selectedRegionIds = this.filterStructure.regions.map(region => region.id) as number[];
      this.filterColumns.locationIds.dataSource = selectedRegionIds?.length
        ? this.scheduleFiltersService.getSelectedLocatinOptions(this.filterStructure, selectedRegionIds)
        : [];
    } else {
      regionsControl?.enable();
    }
  }

  public allLocationsChange(event: { checked: boolean }): void {
    this.allRecords[FieldNames.locationIds] = event.checked;
    const locationsControl = this.scheduleFilterFormGroup?.controls['locationIds'];
    if (this.allRecords[FieldNames.locationIds]) {
      locationsControl?.setValue(null, { emitEvent: false });
      locationsControl?.disable();
      const selectedLocationIds = this.filterStructure.locations.map(location => location.id) as number[];
      this.filterColumns.departmentIds.dataSource = selectedLocationIds?.length
        ? this.scheduleFiltersService.getSelectedDepartmentOptions(this.filterStructure, selectedLocationIds)
        : [];
    } else {
      locationsControl?.enable();
    }
  }

  public allDepartmentsChange(event: { checked: boolean }, emitEvent = true): void {
    this.allRecords[FieldNames.departmentIds] = event.checked;
    const departmentsControl = this.scheduleFilterFormGroup?.controls['departmentIds'];
    if (this.allRecords[FieldNames.departmentIds]) {
      departmentsControl?.setValue(null, {emitEvent: emitEvent});
      departmentsControl?.disable({emitEvent: false});
    } else {
      departmentsControl?.enable({emitEvent: false});
    }
  }

  public onDepartmentsFiltering(e: FilteringEventArgs): void {
    const char = e.text.length + 1;
    let query: Query = new Query();
    query =
      e.text !== ''
        ? query.where('text', 'contains', e.text, true).take(char * 15)
        : query;
    e.updateData(this.filterColumns.departmentIds.dataSource as [], query);
  }

  public deleteFilter(event: FilteredItem): void {
    this.filterService.removeValue(event, this.scheduleFilterFormGroup, this.filterColumns);
    this.cdr.markForCheck();
  }

  public clearAllFilters(clearPreservedFilters = true): void {
    this.scheduleFilterFormGroup.patchValue({
      regionIds: [],
      locationIds: [],
      departmentIds: [],
      skillIds: [],
      isAvailablity : true,
      isUnavailablity : true,
      isOnlySchedulatedCandidate : false,
      isExcludeNotOrganized : true,
      startTime: null,
      endTime : null,
    });
    this.filters = this.scheduleFilterFormGroup.getRawValue();
    this.filteredItems = this.filterService.generateChips(this.scheduleFilterFormGroup, this.filterColumns);
    this.filteredItems = this.filteredItems.filter(filterdata => filterdata.value === true);
    this.filters.employeeSortCategory =null;
    const chips = this.scheduleFiltersService.createChipsData(this.scheduleFilterFormGroup.getRawValue(), this.filterColumns);
    this.updateScheduleFilter.emit({ filters: this.filters, filteredItems: this.filteredItems, chipsData: chips });
    if (clearPreservedFilters) {
      this.store.dispatch(new ClearPageFilters(FilterPageName.SchedullerOrganization));
    }
    this.resetFilterToggles();
  }

  public applyFilter(): void {
    if (this.scheduleFilterFormGroup.valid) {
      this.filters.employeeSortCategory =null;
      this.setFilters();
      this.store.dispatch([
        new ShowFilterDialog(false),
        new SaveFiltersByPageName(FilterPageName.SchedullerOrganization, this.filters),
      ]);
    } else {
      this.scheduleFilterFormGroup.markAllAsTouched();
    }
  }

  public closeFilterDialog(): void {
    this.scheduleFilterFormGroup.markAsUntouched();
  }

  private resetFilterToggles(): void {
    this.allRecords.regionIds = false;
    this.allRecords.locationIds = false;
    this.allRecords.departmentIds = false;
    this.allRegionsChange({ checked: false });
    this.allLocationsChange({ checked: false });
    this.allDepartmentsChange({ checked: false });
  }

  private watchForOrganizationStructure(): void {
    this.organizationStructure$
      .pipe(
        filter(Boolean),
        map((structure: OrganizationStructure) =>
          this.organizationStructureService.getOrgStructureForIrp(structure.regions)),
        map((regions: OrganizationRegion[]) =>
          this.scheduleFiltersService.createFilterStructure(regions)),
        takeUntil(this.componentDestroy()),
      )
      .subscribe((structure: ScheduleFilterStructure) => {
        this.isHomeCostCenterFilters = false;
        this.setFilterStructure(structure);
        this.cdr.markForCheck();
      });
  }

  private watchForEmployeeOrganizationStructure(): void {
    this.scheduleFiltersService.getEmployeeOrganizationStructureStream()
      .pipe(
        skip(1), // skip init value
        map((structure: OrganizationStructure) => this.scheduleFiltersService.createFilterStructure(structure.regions)),
        takeUntil(this.componentDestroy()),
      )
      .subscribe((structure: ScheduleFilterStructure) => {
        this.isHomeCostCenterFilters = true;
        this.setFilterStructure(structure);
        this.preSelectHomeCostCenterFilters();
        this.cdr.markForCheck();
      });
  }

  // eslint-disable-next-line max-lines-per-function
  private watchForControls(): void {
    this.scheduleFilterFormGroup.get('regionIds')?.valueChanges
      .pipe(
        filter((value: number[]) => !!value),
        takeUntil(this.componentDestroy(),
      ))
      .subscribe((selectedRegionIds: number[]) => {
        if(selectedRegionIds.length === 0) {
          this.scheduleFilterFormGroup.get('locationIds')?.patchValue([]);
        }
        this.filterColumns.locationIds.dataSource = selectedRegionIds?.length
          ? this.scheduleFiltersService.getSelectedLocatinOptions(this.filterStructure, selectedRegionIds)
          : [];
        this.setFilteredItems();
      });

    this.scheduleFilterFormGroup.get('locationIds')?.valueChanges
      .pipe(
        filter((value: number[]) => !!value),
        takeUntil(this.componentDestroy()),
      )
      .subscribe((selectedLocationIds: number[]) => {
        if(selectedLocationIds.length === 0){
          this.scheduleFilterFormGroup.get('departmentIds')?.patchValue([]);
        }
        this.filterColumns.departmentIds.dataSource = selectedLocationIds?.length
          ? this.scheduleFiltersService.getSelectedDepartmentOptions(this.filterStructure, selectedLocationIds)
          : [];
        this.setFilteredItems();
      });

    this.scheduleFilterFormGroup.get('departmentIds')?.valueChanges
      .pipe(
        tap((departmentIds: number[] | null) => {
          if (!departmentIds?.length && departmentIds !== null) {
            this.resetSkillFilters();
            this.setFilteredItems();
          }
        }),
        filter((departmentIds: number[] | null) => departmentIds === null || !!departmentIds.length),
        switchMap((value: number[] | null) => {
          let departmentIds: number[];
          const locationIds = this.scheduleFilterFormGroup.get('locationIds')?.value;
          const regionIds = this.scheduleFilterFormGroup.get('regionIds')?.value;
          if (value === null) {
            departmentIds = this.scheduleFiltersService.filterDepartments(this.filterStructure, locationIds, regionIds);
          } else {
            departmentIds = value;
          }
          const params = { SystemType: SystemType.IRP, DepartmentIds: departmentIds, IsSchedulingContext: true };

          if (this.isHomeCostCenterFilters) {
            return this.scheduleApiService.getSkillsByEmployees(departmentIds, this.selectedCandidateId);
          }

          return this.skillsService.getAssignedSkillsByOrganization({ params });
        }),
        filter((skills: AssignedSkillsByOrganization[] | Skill[]) => !!skills.length),
        takeUntil(this.componentDestroy())
      ).subscribe((skills: AssignedSkillsByOrganization[] | Skill[]) => {
        if (skills.length) {
          const skillOption = this.isHomeCostCenterFilters
            ? ScheduleFilterHelper.adaptMasterSkillToOption(skills as Skill[])
            : ScheduleFilterHelper.adaptOrganizationSkillToOption(skills as AssignedSkillsByOrganization[]);

          this.filterColumns.skillIds.dataSource = skillOption;
          const skillIds = this.getSkillsIds(skillOption);
          this.chipsSettings.editedChips = false;
          this.scheduleFilterFormGroup.get("skillIds")?.patchValue(this.getSkillsPatchValue(skillIds));
        } else {
          this.resetSkillFilters();
        }

        if (this.isPreservedFilters) {
          this.setFilters();
          this.isPreservedFilters = false;
        } else {
          this.setFilters(this.isHomeCostCenterFilters);
        }
      });

      merge(
        this.scheduleFilterFormGroup.controls['isAvailablity'].valueChanges,
        this.scheduleFilterFormGroup.controls['skillIds'].valueChanges,
        this.scheduleFilterFormGroup.controls['isUnavailablity'].valueChanges,
        this.scheduleFilterFormGroup.controls['isOnlySchedulatedCandidate'].valueChanges,
        this.scheduleFilterFormGroup.controls['isExcludeNotOrganized'].valueChanges,
        this.scheduleFilterFormGroup.controls['startTime'].valueChanges,
        this.scheduleFilterFormGroup.controls['endTime'].valueChanges
      )
      .pipe(takeUntil(this.componentDestroy()))
      .subscribe(() => {this.setFilteredItems();});
  }

  private observeInlineChipDeleteEvent(): void {
    this.scheduleFiltersService.getDeleteInlineChipStream()
    .pipe(
      takeUntil(this.componentDestroy()),
    )
    .subscribe((event) => {
      if (event === null) {
        this.clearAllFilters();
        return;
      }

      const itemToDelete = this.filteredItems.find((item) => item.column === event.field && item.text === event.value);
      const itemToggleDelete = this.filteredItems.find((item) => item.column === event.field);
      const controlValue = this.scheduleFilterFormGroup.get(event.field)?.value;

      if (
        (controlValue || this.scheduleFilterService.fieldsWithAllToggle.indexOf(event.field) > -1) &&
        (itemToDelete || itemToggleDelete)
      ) {
        const updatedStructure = this.updateFiltersStructure(event);
        const hasEmptyState = !updatedStructure.regionIds?.length ||
          !updatedStructure.locationIds?.length ||
          !updatedStructure.departmentIds?.length ||
          !updatedStructure.skillIds?.length;

        this.scheduleFilterFormGroup?.patchValue(updatedStructure);
        this.chipsSettings.editedChips = true;

        if (hasEmptyState) {
          this.setFilters();
        }

        this.cdr.markForCheck();
      }
    });
  }

  private setFilters(skipDataUpdate = false): void {
    this.filters = this.scheduleFilterFormGroup.getRawValue();
    this.filteredItems = this.filterService.generateChips(this.scheduleFilterFormGroup, this.filterColumns);
    this.setUnfilteredItems(this.filteredItems);
    const chips = this.scheduleFiltersService
      .createChipsData(this.scheduleFilterFormGroup.getRawValue(), this.filterColumns);
      //Conversion of Datetime stamp into HH:MM:SS format
      if(typeof(this.filters.startTime) !== 'string' && this.filters.startTime !== null){
        const start_Time : any = this.filters.startTime
        this.filters.startTime = getTime(start_Time);
        chips.filter(data => data.groupField === 'startTime' ? data.data = [getTime(start_Time)] : data.data);
      } else {
        this.filters.startTime = getPreservedfilterTime(this.filters.startTime);
      }
      if(typeof(this.filters.endTime) !== 'string' && this.filters.endTime !== null){
        const end_Time : any = this.filters.endTime
        this.filters.endTime = (getTime(end_Time));
        chips.filter(data => data.groupField === 'endTime' ? data.data = [getTime(end_Time)] : data.data);
      } else {
        this.filters.endTime = getPreservedfilterTime(this.filters.endTime);
      }
      if(this.filters.departmentIds?.length){
        skipDataUpdate = false;
      }

    const user = this.store.selectSnapshot(UserState.user);
    if(user?.isEmployee){
      this.filters.isOnlySchedulatedCandidate = true;
    }
    this.updateScheduleFilter.emit({
      filters: this.filters,
      filteredItems: this.filteredItems,
      chipsData: chips,
      skipDataUpdate,
    });
  }

  // eslint-disable-next-line max-lines-per-function
  private updateFiltersStructure(event: ChipDeleteEvent): ChipsFilterStructure {
    const { regionIds, locationIds, departmentIds, skillIds } = this.scheduleFilterFormGroup.getRawValue();
    const initialState: ChipsInitialState = {...ChipsStructureState};
    const filterStructure: ChipsFilterStructure = {...FilterChipsStructure};

    if(event.field === ScheduleFilterFormSourceKeys.Regions) {
      const regionStructureState = this.scheduleFiltersService.getRegionChipsStructureState(
        this.filterStructure,
        initialState,
        regionIds,
        event.value
      );

      filterStructure.regionIds = regionStructureState.regionIds;
      initialState.regions = regionStructureState.regions;
    } else {
      initialState.regions = this.scheduleFiltersService.getRegionInitialChipsStructure(this.filterStructure.regions);
      filterStructure.regionIds = regionIds;
    }

    if(event.field === ScheduleFilterFormSourceKeys.Locations) {
      const locationStructureState = this.scheduleFiltersService.getLocationChipsStructureState(
        this.filterStructure,
        initialState,
        locationIds,
        event.value
      );

      initialState.locations = locationStructureState.locations;
      filterStructure.locationIds = locationStructureState.locationIds;
    } else {
      initialState.locations = this.scheduleFiltersService.getLocationInitialChipsStructure(initialState.regions);
      filterStructure.locationIds = filterStructure.regionIds?.length ? locationIds : [];
    }

    if(event.field === ScheduleFilterFormSourceKeys.Departments) {
      const departmentStructureState = this.scheduleFiltersService.getDepartmentChipsStructureState(
        this.filterStructure,
        initialState,
        departmentIds,
        event.value
      );

      initialState.departments = departmentStructureState.departments;
      filterStructure.departmentIds = departmentStructureState.departmentIds;
    } else {
      initialState.departments = this.scheduleFiltersService.getDepartmentInitialChipsStructure(initialState.locations);
      const hasPreviousState = filterStructure.regionIds?.length && filterStructure.locationIds?.length;
      const filteredDepartment = this.scheduleFiltersService.getFilteredDepartmentsIds(
        initialState.departments,
        departmentIds
      ) || null;

      filterStructure.departmentIds = hasPreviousState ? filteredDepartment : [];
    }

    if (this.scheduleFilterService.fieldsWithAllToggle.indexOf(event.field) > -1 && event.value === 'All') {
      filterStructure.departmentIds = 
      filterStructure.locationIds =
      filterStructure.regionIds = [];
      this.resetFilterToggles();
    }

    if(event.field === ScheduleFilterFormSourceKeys.Skills) {
      filterStructure.skillIds = this.scheduleFiltersService.getSkillsChipsStructure(
        this.filterColumns.skillIds.dataSource,
        skillIds,
        event.value
      );

    } else {
      const hasPreviousState = filterStructure.regionIds?.length &&
        filterStructure.locationIds?.length &&
        filterStructure.departmentIds?.length;
      filterStructure.skillIds =  hasPreviousState ? skillIds : [];
    }

    if((event.field === ScheduleFilterFormSourceKeys.isAvailablity ) ||
       (event.field === ScheduleFilterFormSourceKeys.isUnavailablity ) ||
       (event.field === ScheduleFilterFormSourceKeys.isExcludeNotOrganized) ||
       (event.field === ScheduleFilterFormSourceKeys.isOnlySchedulatedCandidate)) {
        this.scheduleFilterFormGroup.get(event.field)?.patchValue(false);
        this.setFilters();
    }

    if((event.field === ScheduleFilterFormSourceKeys.startTime ) ||
       (event.field === ScheduleFilterFormSourceKeys.endTime )) {
        this.scheduleFilterFormGroup.get(event.field)?.patchValue(null);
        this.setFilters();
       }

    this.chipsSettings.preservedChipsSkills = [...filterStructure.skillIds];

   return filterStructure;
  }

  private resetSkillFilters(): void {
    this.filterColumns.skillIds.dataSource = [];
    this.scheduleFilterFormGroup.get('skillIds')?.setValue([]);
  }

  private setFilteredItems(): void {
    this.filteredItems = this.filterService.generateChips(this.scheduleFilterFormGroup, this.filterColumns);
    this.setUnfilteredItems(this.filteredItems);
    this.filteredItems = [...this.filteredItems];
  }

  private setUnfilteredItems(filteredItems : FilteredItem[]) : void {
    filteredItems = filteredItems.filter((filter: {value: boolean}) => !!filter.value );
    this.filteredItems = [...filteredItems];
    this.cdr.markForCheck();
  }

  private setFilterStructure(structure: ScheduleFilterStructure): void {
    if (this.filteredItems.length) {
      this.clearAllFilters(false);
      this.applyPreservedFilters(); 
    }

    this.filterStructure = structure;
    this.filterColumns.regionIds.dataSource = ScheduleFilterHelper.adaptRegionToOption(this.filterStructure.regions);
  }

  private preSelectHomeCostCenterFilters(): void {
    const homeCostCenterDepartment = this.filterStructure.departments
      .find((department: OrganizationDepartment) => department.isHomeCostCenter);
    let regionId: number;
    let locationId: number;
    let departmentId: number;

    if (homeCostCenterDepartment) {
      departmentId = homeCostCenterDepartment.id;
      locationId = homeCostCenterDepartment.locationId as number;
      regionId = this.filterStructure.locations
        .find((location: OrganizationLocation) => location.id === locationId)?.regionId as number;

      this.filterColumns.locationIds.dataSource = this.scheduleFiltersService
        .getSelectedLocatinOptions(this.filterStructure, [regionId]);
      this.filterColumns.departmentIds.dataSource = this.scheduleFiltersService
        .getSelectedDepartmentOptions(this.filterStructure, [locationId]);

    } else {
      regionId = this.filterStructure.regions[0].id as number;
      locationId = this.scheduleFiltersService.getSelectedLocationByOrder(this.filterStructure, [regionId])[0]?.value as number;
      this.filterColumns.locationIds.dataSource = this.scheduleFiltersService
        .getSelectedLocatinOptions(this.filterStructure, [regionId]);

      this.filterColumns.departmentIds.dataSource = this.scheduleFiltersService
        .getSelectedDepartmentOptions(this.filterStructure, [locationId]);
      departmentId = this.filterColumns.departmentIds.dataSource[0]?.value as number;
    }

    this.scheduleFilterFormGroup?.get('regionIds')?.patchValue([regionId], { emitEvent: false, onlySelf: true });
    this.scheduleFilterFormGroup?.get('locationIds')?.patchValue([locationId], { emitEvent: false, onlySelf: true });
    this.scheduleFilterFormGroup?.get('departmentIds')?.patchValue([departmentId]);
  }

  private setTooglesState(preservFilters: ScheduleFilters): void {
    this.allRecords.regionIds = preservFilters.regionIds === null;
    this.allRecords.locationIds = preservFilters.locationIds === null;
    this.allRecords.departmentIds = preservFilters.departmentIds === null;
    this.allRegionsChange({ checked: this.allRecords.regionIds });
    this.allLocationsChange({ checked: this.allRecords.locationIds });
    this.allDepartmentsChange({ checked: this.allRecords.departmentIds });
  }

  private applyPreservedFilters(): void {
    this.organizationStructure$.pipe(
      switchMap((structure) => this.preservedFiltersByPageName$.pipe(
        filter(() => !!structure),
      )),
      filter(({ dispatch }) => dispatch),
      map((filters) => filters.state),
      distinctUntilChanged((prev, next) => isObjectsEqual(prev as Record<string, unknown>, next as Record<string, unknown>)),
      takeUntil(this.componentDestroy())
    )
      .subscribe((preservFilters) => {
        this.filters = preservFilters || {};
        this.setTooglesState(this.filters);
        this.isPreservedFilters = !!preservFilters;
        if(preservFilters != null){
          this.scheduleFilterFormGroup.patchValue({
            regionIds: GetStructureValue(this.filters.regionIds),
            locationIds: GetStructureValue(this.filters.locationIds),
            departmentIds: GetStructureValue(this.filters.departmentIds),
            skillIds : this.filters.skillIds ? [...this.filters.skillIds] : [],
            isAvailablity : !!this.filters.isAvailablity,
            isUnavailablity : !!this.filters.isUnavailablity,
            isExcludeNotOrganized : !!this.filters.isExcludeNotOrganized,
            isOnlySchedulatedCandidate : !!this.filters.isOnlySchedulatedCandidate,
            startTime : getPreservedTime(this.filters.startTime),
            endTime : getPreservedTime(this.filters.endTime),
          });
        }
         //Get only valid numeric values
         const skillIds = this.filters?.skillIds?.filter((skillId) => !isNaN(skillId as number)) as number[];
         if(skillIds){
           this.chipsSettings = {
             ...this.chipsSettings,
             preservedChipsSkills: [...skillIds],
           };
         }
        if (!this.filters.skillIds?.length) {
          this.setFilters();
        }
      });
  }

  deleteFilterItem(event: ChipDeleteEventType): void {
    this.scheduleFilterService.deleteInlineChip(event);
  }

  private getSkillsIds(skillOption: DropdownOption[]): number[] {
    if(this.isPreservedFilters) {
      return this.filters.skillIds as number[];
    }
    if(this.chipsSettings.editedChips) {
      return [];
    }
    return [skillOption[0]?.value as number];
  }


  private getSkillsPatchValue(skillIds: number[]): number [] {
    if (this.chipsSettings.preservedChipsSkills.length) {
      const selectedFilterSkills = this.scheduleFiltersService.getSelectedSkillFilterColumns(
        this.filterColumns.skillIds.dataSource,
        this.chipsSettings.preservedChipsSkills
      );
      return selectedFilterSkills;
    }

    return skillIds;
  }
}
