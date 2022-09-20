import { OrderManagementState } from '@agency/store/order-management.state';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { FieldSettingsModel, MultiSelectComponent } from '@syncfusion/ej2-angular-dropdowns';
import { debounceTime, filter, forkJoin, Observable, takeUntil, tap } from 'rxjs';

import { isEmpty } from 'lodash';

import { ControlTypes, ValueType } from '@shared/enums/control-types.enum';
import { OrderTypeOptions } from '@shared/enums/order-type';
import { AgencyOrderFilteringOptions } from '@shared/models/agency.model';
import { GetOrganizationStructure } from '@agency/store/order-management.actions';
import { OrganizationLocation, OrganizationRegion } from '@shared/models/organization.model';
import { ShowFilterDialog } from 'src/app/store/app.actions';
import { getDepartmentFromLocations, getLocationsFromRegions } from './agency-order-filters.utils';
import { DestroyableDirective } from '@shared/directives/destroyable.directive';
import { AgencyOrderManagementTabs } from '@shared/enums/order-management-tabs.enum';
import { CandidatesStatusText, OrderStatusText } from '@shared/enums/status';
import { CandidatStatus } from '@shared/enums/applicant-status.enum';
import { ProjectSpecialData } from '@shared/models/project-special-data.model';
import { ProjectsService } from '@shared/services/projects.service';

enum RLDLevel {
  Orginization,
  Region,
  Location,
}

@Component({
  selector: 'app-agency-order-filters',
  templateUrl: './agency-order-filters.component.html',
  styleUrls: ['./agency-order-filters.component.scss'],
})
export class AgencyOrderFiltersComponent extends DestroyableDirective implements OnInit, AfterViewInit {
  @ViewChild('regionMultiselect') regionMultiselect: MultiSelectComponent;

  @Input() form: FormGroup;
  @Input() filterColumns: any;
  @Input() activeTab: AgencyOrderManagementTabs;

  public AgencyOrderManagementTabs = AgencyOrderManagementTabs;

  @Select(OrderManagementState.orderFilteringOptions)
  orderFilteringOptions$: Observable<AgencyOrderFilteringOptions>;

  @Select(OrderManagementState.gridFilterRegions)
  gridFilterRegions$: Observable<OrganizationRegion[]>;

  public readonly projectSpecialData$: Observable<ProjectSpecialData>;
  public readonly specialProjectCategoriesFields: FieldSettingsModel = { text: 'projectType', value: 'id' };
  public readonly projectNameFields: FieldSettingsModel = { text: 'projectName', value: 'id' };
  public readonly poNumberFields: FieldSettingsModel = { text: 'poNumber', value: 'id' };

  public optionFields = {
    text: 'name',
    value: 'id',
  };
  public statusFields = {
    text: 'statusText',
    value: 'status',
  };

  get regionIdsControl(): AbstractControl {
    return this.form.get('regionIds') as AbstractControl;
  }

  get locationIdsControl(): AbstractControl {
    return this.form.get('locationIds') as AbstractControl;
  }

  get departmentsIdsControl(): AbstractControl {
    return this.form.get('departmentsIds') as AbstractControl;
  }

  constructor(private store: Store, private actions$: Actions, private projectsService: ProjectsService) {
    super();
    this.projectSpecialData$ = this.projectsService.getProjectSpecialData();
  }

  ngOnInit(): void {
    this.onOrderFilteringOptionsChange();
  }

  ngAfterViewInit(): void {
    forkJoin([
      this.onShowFilterDialog(),
      this.onOrganizationIdsControlChange(),
      this.onGridFilterRegions(),
      this.onRegionIdsControlChange(),
      this.onLocationIdsControlChange(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private onOrganizationIdsControlChange(): Observable<number[]> {
    const organizationIdsControl = this.form.get('organizationIds') as AbstractControl;

    return organizationIdsControl.valueChanges.pipe(
      tap((value: number[]) => {
        if (isEmpty(value)) {
          this.clearRLDByLevel(RLDLevel.Orginization);
        } else {
          this.store.dispatch(new GetOrganizationStructure(value));
        }
      })
    );
  }

  private onRegionIdsControlChange(): Observable<number[]> {
    return this.regionIdsControl.valueChanges.pipe(
      tap((value: number[]) => {
        if (isEmpty(value)) {
          this.clearRLDByLevel(RLDLevel.Region);
        } else {
          const regions: OrganizationRegion[] = this.filterColumns.regionIds.dataSource.filter(
            ({ id }: { id: number }) => value.includes(id)
          );
          this.filterColumns.locationIds.dataSource = getLocationsFromRegions(regions);
        }
      })
    );
  }

  private onLocationIdsControlChange(): Observable<number[]> {
    return this.locationIdsControl.valueChanges.pipe(
      tap((value: number[]) => {
        if (isEmpty(value)) {
          this.clearRLDByLevel(RLDLevel.Location);
        } else {
          const locations: OrganizationLocation[] = this.filterColumns.locationIds.dataSource.filter(
            ({ id }: { id: number }) => value.includes(id)
          );
          this.filterColumns.departmentsIds.dataSource = getDepartmentFromLocations(locations);
        }
      })
    );
  }

  private onGridFilterRegions(): Observable<unknown> {
    return this.actions$.pipe(
      ofActionSuccessful(GetOrganizationStructure),
      tap(() => {
        this.filterColumns.regionIds.dataSource = this.store.selectSnapshot(OrderManagementState.gridFilterRegions);
      })
    );
  }

  private onShowFilterDialog(): Observable<unknown> {
    return this.actions$.pipe(
      ofActionSuccessful(ShowFilterDialog),
      debounceTime(100),
      tap(() => {
        this.regionMultiselect.refresh();
      })
    );
  }

  private clearRLDByLevel(level: RLDLevel): void {
    this.departmentsIdsControl.reset();
    this.filterColumns.departmentsIds.dataSource = [];

    if (level === RLDLevel.Orginization || level === RLDLevel.Region) {
      this.locationIdsControl.reset();
      this.filterColumns.locationIds.dataSource = [];
    }

    if (level === RLDLevel.Orginization) {
      this.regionIdsControl.reset();
      this.filterColumns.regionIds.dataSource = [];
    }
  }

  private onOrderFilteringOptionsChange(): void {
    this.orderFilteringOptions$
      .pipe(
        filter((options) => !!options),
        takeUntil(this.destroy$)
      )
      .subscribe(({ candidateStatuses, masterSkills, orderStatuses, partneredOrganizations }) => {
        let statuses = [];
        let candidateStatusesData = [];
        const statusesByDefault = [
          CandidatStatus.Applied,
          CandidatStatus.Shortlisted,
          CandidatStatus.Offered,
          CandidatStatus.Accepted,
          CandidatStatus.OnBoard,
          CandidatStatus.Withdraw,
          CandidatStatus.Offboard,
          CandidatStatus.Rejected,
        ];
        if (this.activeTab === AgencyOrderManagementTabs.ReOrders) {
          statuses = orderStatuses.filter((status) =>
            [OrderStatusText.Open, OrderStatusText.Filled, OrderStatusText.Closed].includes(status.status)
          );
          candidateStatusesData = candidateStatuses.filter((status) =>
            [
              CandidatesStatusText['Bill Rate Pending'],
              CandidatesStatusText['Offered Bill Rate'],
              CandidatesStatusText.Onboard,
              CandidatesStatusText.Rejected,
            ].includes(status.status)
          ); // TODO: after BE implementation also add Pending, Rejected
        } else if (this.activeTab === AgencyOrderManagementTabs.PerDiem) {
          statuses = orderStatuses.filter((status) =>
            [OrderStatusText.Open, OrderStatusText.Closed].includes(status.status)
          );
          candidateStatusesData = candidateStatuses.filter((status) => statusesByDefault.includes(status.status));
        } else {
          statuses = orderStatuses;
          candidateStatusesData = candidateStatuses.filter((status) => statusesByDefault.includes(status.status));
        }

        this.filterColumns.organizationIds.dataSource = partneredOrganizations;
        this.filterColumns.skillIds.dataSource = masterSkills;
        this.filterColumns.candidateStatuses.dataSource = candidateStatusesData;
        this.filterColumns.orderStatuses.dataSource = statuses;
      });
  }

  static generateFiltersForm(): FormGroup {
    return new FormGroup({
      orderPublicId: new FormControl(null),
      organizationIds: new FormControl([]),
      regionIds: new FormControl([]),
      locationIds: new FormControl([]),
      departmentsIds: new FormControl([]),
      skillIds: new FormControl([]),
      orderTypes: new FormControl([]),
      candidateStatuses: new FormControl([]),
      candidatesCountFrom: new FormControl(null),
      candidatesCountTo: new FormControl(null),
      orderStatuses: new FormControl([]),
      jobTitle: new FormControl(null),
      billRateFrom: new FormControl(null),
      billRateTo: new FormControl(null),
      openPositions: new FormControl(null),
      jobStartDate: new FormControl(null),
      jobEndDate: new FormControl(null),
      annualSalaryRangeFrom: new FormControl(null),
      annualSalaryRangeTo: new FormControl(null),
      creationDateFrom: new FormControl(null),
      creationDateTo: new FormControl(null),
      distributedOnFrom: new FormControl(null),
      distributedOnTo: new FormControl(null),
      candidateName: new FormControl(null),
      projectTypeId: new FormControl(null),
      projectNameId: new FormControl(null),
      poNumberId: new FormControl(null),
    });
  }

  static generateFilterColumns(): any {
    return {
      orderPublicId: { type: ControlTypes.Text, valueType: ValueType.Text },
      organizationIds: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'name',
        valueId: 'id',
      },
      regionIds: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'name',
        valueId: 'id',
      },
      locationIds: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'name',
        valueId: 'id',
      },
      departmentsIds: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'name',
        valueId: 'id',
      },
      skillIds: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'name',
        valueId: 'id',
      },
      orderTypes: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: OrderTypeOptions,
        valueField: 'name',
        valueId: 'id',
      },
      candidateStatuses: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'statusText',
        valueId: 'status',
      },
      candidatesCountFrom: { type: ControlTypes.Text, valueType: ValueType.Text },
      candidatesCountTo: { type: ControlTypes.Text, valueType: ValueType.Text },
      orderStatuses: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'statusText',
        valueId: 'status',
      },
      jobTitle: { type: ControlTypes.Text, valueType: ValueType.Text },
      billRateFrom: { type: ControlTypes.Text, valueType: ValueType.Text },
      billRateTo: { type: ControlTypes.Text, valueType: ValueType.Text },
      openPositions: { type: ControlTypes.Text, valueType: ValueType.Text },
      jobStartDate: { type: ControlTypes.Date, valueType: ValueType.Text },
      jobEndDate: { type: ControlTypes.Date, valueType: ValueType.Text },
      annualSalaryRangeFrom: { type: ControlTypes.Text, valueType: ValueType.Text },
      annualSalaryRangeTo: { type: ControlTypes.Text, valueType: ValueType.Text },
      creationDateFrom: { type: ControlTypes.Date, valueType: ValueType.Text },
      creationDateTo: { type: ControlTypes.Date, valueType: ValueType.Text },
      distributedOnFrom: { type: ControlTypes.Date, valueType: ValueType.Text },
      distributedOnTo: { type: ControlTypes.Date, valueType: ValueType.Text },
      candidateName: { type: ControlTypes.Text, valueType: ValueType.Text },
      projectTypeId: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'projectType',
        valueId: 'id',
      },
      projectNameId: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'projectName',
        valueId: 'id',
      },
      poNumberId: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'poNumber',
        valueId: 'id',
      },
    };
  }
}
