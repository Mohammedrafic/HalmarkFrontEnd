import { DatePipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Actions, ofActionDispatched, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { MultiSelectComponent } from '@syncfusion/ej2-angular-dropdowns';
import { GridComponent } from '@syncfusion/ej2-angular-grids';
import { SelectionSettingsModel } from '@syncfusion/ej2-grids/src/grid/base/grid-model';
import { isNil } from 'lodash';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  takeWhile,
  tap,
} from 'rxjs';

import { GetAllSkills, SaveCandidateSucceeded } from '@agency/store/candidate.actions';
import { CandidateState } from '@agency/store/candidate.state';
import { DepartmentHelper } from '@client/candidates/departments/helpers/department.helper';
import { OutsideZone } from '@core/decorators';
import { UserPermissions } from '@core/enums';
import { FilterPageName } from '@core/enums/filter-page-name.enum';
import { DateTimeHelper } from '@core/helpers';
import { getIRPOrgItems } from '@core/helpers/org-structure.helper';
import { CustomFormGroup, Permission } from '@core/interface';
import { PreservedFiltersByPage } from '@core/interface/preserved-filters.interface';
import { ScrollRestorationService } from '@core/services/scroll-restoration.service';
import { GlobalWindow } from '@core/tokens';
import {
  ClearAssignedSkillsByOrganization,
  GetAssignedSkillsByOrganization,
} from '@organization-management/store/organization-management.actions';
import { OrganizationManagementState } from '@organization-management/store/organization-management.state';
import { END_DATE_REQUIRED, ERROR_START_LESS_END_DATE, GRID_CONFIG, optionFields, regionFields } from '@shared/constants';
import { ApplicantStatus } from '@shared/enums/applicant-status.enum';
import { ExportedFileType } from '@shared/enums/exported-file-type';
import { MessageTypes } from '@shared/enums/message-types';
import { CandidatesStatusText, CandidateStatus, EmployeeStatus, STATUS_COLOR_GROUP } from '@shared/enums/status';
import { SystemType } from '@shared/enums/system-type.enum';
import { CredentialParams } from '@shared/models/candidate-credential.model';
import { Candidate } from '@shared/models/candidate.model';
import { ExportColumn, ExportOptions } from '@shared/models/export.model';
import { FilteredItem } from '@shared/models/filter.model';
import { OrganizationDepartment, OrganizationLocation, OrganizationStructure } from '@shared/models/organization.model';
import { ListOfSkills, MasterSkill } from '@shared/models/skill.model';
import { ConfirmService } from '@shared/services/confirm.service';
import { FilterService } from '@shared/services/filter.service';
import { AppState } from 'src/app/store/app.state';
import * as PreservedFilters from 'src/app/store/preserved-filters.actions';
import { PreservedFiltersState } from 'src/app/store/preserved-filters.state';
import { SetHeaderState, ShowExportDialog, ShowFilterDialog, ShowToast } from '../../../../../store/app.actions';
import { UserState } from '../../../../../store/user.state';
import { adaptToNameEntity } from '@shared/helpers/dropdown-options.helper';
import {
  AbstractGridConfigurationComponent,
} from '../../../abstract-grid-configuration/abstract-grid-configuration.component';
import { CandidateListService } from '../../services/candidate-list.service';
import * as CandidateListActions from '../../store/candidate-list.actions';
import{ GetMasterCredentials } from '@agency/store/candidate.actions';
import { CandidateListState } from '../../store/candidate-list.state';
import {
  CandidateList,
  CandidateListExport,
  CandidateListFilters,
  CandidateListFiltersColumn,
  CandidateListRequest,
  CandidateRow,
  IRPCandidate,
  IRPCandidateList,
  CandidatePagingState,
  CandidateListStateModel,
  EmployeeInactivateData,
  InactivateEmployeeDto,
  InactivationEvent,
} from '../../types/candidate-list.model';
import {
  CandidatesExportCols,
  CandidatesTableFilters,
  filterColumns,
  IrpCandidateExportCols,
  IRPCandidates, IRPFilterColumns,
  IrpSourcingCandidateExportCols,
  ProfileStatusField,
  VMSCandidates,
} from './candidate-list.constants';
import { CandidateListScroll } from './candidate-list.enum';
import { CredentialType } from '@shared/models/credential-type.model';
import { GetInactivationReasons, GetSourcingReasons } from '@organization-management/store/reject-reason.actions';
import { RejectReasonState } from '@organization-management/store/reject-reason.state';
import { ProfileStatuses, ProfileStatusesEnum } from '@client/candidates/candidate-profile/candidate-profile.constants';
import { Credential } from '@shared/models/credential.model';
import { CredentialTypeFilter } from '@shared/models/credential.model';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
import { RejectReasonPage } from '@shared/models/reject-reason.model';
import { endTimeValidator } from '@shared/validators/date.validator';

@Component({
  selector: 'app-candidate-list',
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateListComponent extends AbstractGridConfigurationComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid: GridComponent;
  @ViewChild('regionMultiselect') public readonly regionMultiselect: MultiSelectComponent;
  @ViewChild('inactivationDialog') inactivationDialog: DialogComponent;

  @Select(CandidateListState.candidates)
  private _candidates$: Observable<CandidateList>;

  @Select(CandidateListState.IRPCandidates)
  private _IRPCandidates$: Observable<IRPCandidateList>;

  @Select(RejectReasonState.sourcingReasons)
  public sourcing$: Observable<any>;

  @Select(CandidateState.skills)
  private skills$: Observable<MasterSkill[]>;

  @Select(UserState.lastSelectedAgencyId)
  lastSelectedAgencyId$: Observable<number>;

  @Select(UserState.lastSelectedOrganizationId)
  lastSelectedOrgId$: Observable<number>;

  @Select(CandidateListState.listOfRegions)
  regions$: Observable<string[]>;

  @Select(UserState.organizationStructure)
  organizationStructure$: Observable<OrganizationStructure>;

  @Select(OrganizationManagementState.assignedSkillsByOrganization)
  assignedSkills$: Observable<ListOfSkills[]>;

  @Select(AppState.getMainContentElement)
  public readonly targetElement$: Observable<HTMLElement | null>;

  @Select(CandidateListState.listOfCredentialTypes)
  credentialTypes$: Observable<CredentialType[]>;

  @Select(CandidateState.masterCredentials)
  masterCredentials$: Observable<Credential[]>;

  @Select(PreservedFiltersState.preservedFiltersByPageName)
  private readonly preservedFiltersByPageName$: Observable<PreservedFiltersByPage<CandidateListFilters>>;
  public filterType: string = 'Contains';

  @Select(RejectReasonState.inactivationReasons)
  public inactivationReasons$: Observable<RejectReasonPage>;

  @Input() public credEndDate: string;
  @Input() public credStartDate: string;
  @Input() public credType: number;
  @Input() public filteredItems$: Subject<number>;
  @Input() public export$: Subject<ExportedFileType>;
  @Input() public search$: Subject<string>;
  @Input() public includeDeployedCandidates$: Subject<boolean>;
  @Input() public isAgency: boolean;
  @Input() public agencyActionsAllowed: boolean;
  @Input() public userPermission: Permission;
  @Input() public isIRP: boolean;
  @Input() public redirectedFromDashboard: boolean;
  @Input() public disableNonlinkedagency:boolean;
  @Input()
  public set tab(tabIndex: number) {
    if (!isNil(tabIndex)) {
      this.activeTab = tabIndex;
      this.dispatchNewPage();
    }
  }

  @Input() public isMobileScreen = false;
  public filters: CandidateListFilters = CandidatesTableFilters;
  public CandidateFilterFormGroup: FormGroup;
  public filterColumns: CandidateListFiltersColumn;
  public allLocations: OrganizationLocation[];
  public readonly statusEnum = CandidateStatus;
  public readonly employeeStatusEnum = EmployeeStatus;
  public readonly candidateStatus = CandidatesStatusText;
  public candidates$: Observable<CandidateList | IRPCandidateList>;
  public readonly userPermissions = UserPermissions;
  public selecteditmesids: any[] = [];
  public columnsToExport = CandidatesExportCols;
  public columnsToExportIrp = IrpCandidateExportCols;
  public columnsToExportIrpSourcing = IrpSourcingCandidateExportCols;
  public defaultFileName: string;
  public fileName: string;
  public selectionOptions: SelectionSettingsModel = {
    type: 'Single',
    mode: 'Row',
    checkboxMode: 'ResetOnRowClick',
    persistSelection: true,
  };
  public readonly optionFields = optionFields;
  public readonly regionFields = regionFields;
  public unassignedworkCommitment: any;
  public animationSettings: Object = { effect: 'Zoom', duration: 400, delay: 0 };
  public inactivationForm: CustomFormGroup<EmployeeInactivateData>;
  public reasonFields = {
    text: 'reason',
    value: 'id',
  };
  private pageSubject = new Subject<number>();
  private includeDeployedCandidates = true;
  private unsubscribe$: Subject<void> = new Subject();
  private isAlive = true;
  private activeTab: number;
  private scrollSubscription: Subscription;
  private redirectfromDashboard: boolean;
  private inactivationData: InactivationEvent = {
    id: null,
    hireDate: null,
  };
  public isSourcingEnabled = false;
  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private actions$: Actions,
    private confirmService: ConfirmService,
    private filterService: FilterService,
    private datePipe: DatePipe,
    private candidateListService: CandidateListService,
    private scrollService: ScrollRestorationService,
    private readonly ngZone: NgZone,
    private cd: ChangeDetectorRef,
    @Inject(GlobalWindow) protected readonly globalWindow: WindowProxy & typeof globalThis
  ) {
    super();
    this.unassignedworkCommitment = JSON.parse(localStorage.getItem('unassignedworkcommitment') || 'false') as boolean;
    this.inactivationForm = this.candidateListService.createInactivateForm();
  }

  ngOnInit(): void {
    this.initCandidateFilterForm();
    this.getRegions();
    this.getCredentialTypes();
    this.dispatchInitialIcon();
    this.subscribeOnSaveState();
    this.subscribeOnPageSubject();
    this.subscribeOnActions();
    this.subscribeOnDeploydCandidates();
    this.subscribeOnSkills();
    this.subscribeOnExportAction();
    this.setFileName();
    this.filterColumns = !this.isIRP ? filterColumns : IRPFilterColumns;
    this.subscribeOnRegions();
    this.subscribeOnMasterCredentials();
    this.subscribeOnOrgStructure();
    this.subscribeOnLocationChange();
    this.syncFilterTagsWithControls();
    this.getSourcingConfig();
  }


  ngOnDestroy(): void {
    this.isAlive = false;
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.store.dispatch(new PreservedFilters.ResetPageFilters());
  }

  private getSourcingConfig(): void {
    if (!this.isAgency) {
      this.store.dispatch(new GetSourcingReasons());
      this.sourcing$.pipe(filter(x => x != null), takeUntil(this.unsubscribe$)).subscribe((data) => {

        this.isSourcingEnabled = data.issourcing;
        if (this.isIRP && !this.isSourcingEnabled) {
          const sourcingStatuses = [
            ProfileStatusesEnum.Sourcing,
            ProfileStatusesEnum.Prospect,
            ProfileStatusesEnum.Onboarding,
            ProfileStatusesEnum.ClearedForOrientation,
            ProfileStatusesEnum.OrientationScheduled,
            ProfileStatusesEnum.DoNotHire,
            ProfileStatusesEnum.FallOffOnboarding,
            ProfileStatusesEnum.VerbalOfferMade,
          ];
          this.filterColumns.profileStatuses.dataSource = (ProfileStatuses.filter(f => !sourcingStatuses.includes(f.id)));
        } else {
          this.filterColumns.profileStatuses.dataSource = ProfileStatuses;
        }
        this.IRPVMSGridHandler();
      });
    }
  }

  public onFilterDelete(event: FilteredItem): void {
    this.filterService.removeValue(event, this.CandidateFilterFormGroup, this.filterColumns);
    this.CandidateFilterFormGroup.markAsDirty();
  }

  public onFilterClearAll(): void {
    this.store.dispatch(new PreservedFilters.ClearPageFilters(this.getPageName()));
    this.clearFilters();
    this.dispatchNewPage();
  }

  public onFilterApply(): void {
    if (this.isIRP) {
      if (this.CandidateFilterFormGroup.get("startDate") != null && this.CandidateFilterFormGroup.get("endDate") != null) {
        if (new Date(this.CandidateFilterFormGroup.get("endDate")?.value) >= new Date(this.CandidateFilterFormGroup.get("startDate")?.value)) {
          if (this.CandidateFilterFormGroup.dirty) {
            this.filters = this.CandidateFilterFormGroup.getRawValue();
            this.filters.profileStatuses = this.filters.profileStatuses || [];
            this.filters.regionsNames = this.filters.regionsNames || [];
            this.filters.skillsIds = this.filters.skillsIds || [];
            this.filters.firstNamePattern = this.filters.firstNamePattern || null;
            this.filters.lastNamePattern = this.filters.lastNamePattern || null;
            this.filters.expiry = {
              type: this.filters.credType || [],
              startDate: this.filters.startDate ? DateTimeHelper.setUtcTimeZone(
                DateTimeHelper.setInitDateHours(this.filters.startDate)) : null,
              endDate: this.filters.endDate ? DateTimeHelper.setUtcTimeZone(
                DateTimeHelper.setInitDateHours(this.filters.endDate)) : null,
            };
            this.filters.hireDate = this.filters.hireDate ? DateTimeHelper.setUtcTimeZone(
              DateTimeHelper.setInitDateHours(this.filters.hireDate)
            ) : null;
            this.saveFiltersByPageName(this.filters);
            this.dispatchNewPage();
            this.store.dispatch(new ShowFilterDialog(false));
            this.CandidateFilterFormGroup.markAsPristine();
          } else {
            this.store.dispatch(new ShowFilterDialog(false));
          }
        }
        else {
          this.store.dispatch(new ShowToast(MessageTypes.Error, ERROR_START_LESS_END_DATE));
        }
      }
      else {
        this.store.dispatch(new ShowToast(MessageTypes.Error, END_DATE_REQUIRED));
      }
    } else {
      if (this.CandidateFilterFormGroup.dirty) {
        this.filters = this.CandidateFilterFormGroup.getRawValue();
        this.filters.profileStatuses = this.filters.profileStatuses || [];
        this.filters.regionsNames = this.filters.regionsNames || [];
        this.filters.skillsIds = this.filters.skillsIds || [];
        this.filters.firstNamePattern = this.filters.firstNamePattern || null;
        this.filters.lastNamePattern = this.filters.lastNamePattern || null;
        this.filters.hireDate = this.filters.hireDate ? DateTimeHelper.setUtcTimeZone(this.filters.hireDate) : null,
          this.filters.expiry = {
            type: this.filters.credType || [],
            startDate: this.filters.startDate ? DateTimeHelper.setUtcTimeZone(this.filters.startDate) : null,
            endDate: this.filters.endDate ? DateTimeHelper.setUtcTimeZone(this.filters.endDate) : null,
          };

        this.saveFiltersByPageName(this.filters);
        this.dispatchNewPage();
        this.store.dispatch(new ShowFilterDialog(false));
        this.CandidateFilterFormGroup.markAsPristine();
      } else {
        this.store.dispatch(new ShowFilterDialog(false));
      }
    }
  }

  public onFilterClose(): void {
    this.candidateListService.refreshFilters(this.isIRP, this.CandidateFilterFormGroup, this.filters);
  }

  public showCandidateStatus(status: number): boolean {
    return [ApplicantStatus.OnBoarded, ApplicantStatus.Accepted].includes(status);
  }

  public dataBound(): void {
    this.grid.hideScroll();
    this.contentLoadedHandler(this.cd);
    this.createScrollSubscription();
    this.checkScroll();
  }

  public changePageSize(event: number): void {
    this.currentPage = 1;
    this.pageSize = event;
    this.pageSettings = { ...this.pageSettings, pageSize: this.pageSize };
  }

  public override updatePage(clearedFilters?: boolean): void {
    const isProfileStatus = this.orderBy?.split(' ')[0];

    if (isProfileStatus === ProfileStatusField) {
      this.filters.orderBy = this.orderBy;
      this.dispatchNewPage();
    }
  }

  public changePageNumber(page: number): void {
    this.pageSubject.next(page);
  }

  public getChipCssClass(status: string): string {
    const found = Object.entries(STATUS_COLOR_GROUP).find((item) => item[1].includes(status));
    return found ? found[0] : 'e-default';
  }

  public onEdit(data: CandidateRow | IRPCandidate): void {
    const credentialParams: CredentialParams = {
      isNavigatedFromOrganizationArea: false,
      candidateStatus: null,
      orderId: null,
    };
    this.setTableState();
    this.router.navigate(
      ['./edit', (data as CandidateRow).candidateProfileId || (data as IRPCandidate).id],
      { relativeTo: this.route, state: credentialParams }
    );
  }

  public onRemove(id: number, employeeHireData: string | null = null): void {
    if (!this.isIRP) {
      this.confirmService
        .confirm('Are you sure you want to inactivate the Candidate?', {
          okButtonLabel: 'Inactivate',
          okButtonClass: 'delete-button',
          title: 'Inactivate the Candidate',
        })
        .pipe(
          filter((confirm) => !!confirm),
          takeUntil(this.unsubscribe$)
        )
        .subscribe(() => {
          this.inactivateCandidate(id);
        });
    } else {
      this.store.dispatch(new GetInactivationReasons(1, 1000));
      this.inactivationData = { id: id, hireDate: employeeHireData};
      this.inactivationForm.get('hireDate')?.patchValue(employeeHireData);
      this.inactivationForm.get('inactivationDate')?.patchValue(new Date(new Date().setHours(0, 0, 0)));
      this.inactivationForm.get('inactivationDate')?.setValidators(endTimeValidator(this.inactivationForm, 'hireDate'));
      this.inactivationDialog.show();
    }
  }

  public closeExport(): void {
    this.setFileName();
    this.store.dispatch(new ShowExportDialog(false));
  }

  public export(event: ExportOptions): void {
    this.closeExport();
    this.defaultExport(event.fileType, event);
  }

  public override defaultExport(fileType: ExportedFileType, options?: ExportOptions): void {
    const columnMap = this.isIRP ? this.isSourcingEnabled ? this.columnsToExportIrpSourcing : this.columnsToExportIrp : this.columnsToExport;
    this.selecteditmesids = this.selectedItems.length ? this.selectedItems.map(val => val[this.idFieldName]) : [];
    const requestBody: CandidateListExport = {
      filterQuery: this.getFilterValues(),
      exportFileType: fileType,
      properties: options
        ? options.columns.map((val: ExportColumn) => val.column)
        : columnMap.map((val: ExportColumn) => val.column),
      filename: options?.fileName || this.defaultFileName,
    };
    let exportRequest;
    if (this.isIRP) {
      exportRequest = new CandidateListActions.ExportIRPCandidateList(requestBody);
    } else {
      exportRequest = new CandidateListActions.ExportCandidateList(requestBody);
    }

    this.store.dispatch(exportRequest);
    this.clearSelection(this.grid);
  }

  public dispatchNewPage(firstDispatch = false): void {
    const candidateListRequest: CandidateListRequest = {
      ...this.getFilterValues(),
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      orderBy: this.orderBy,
    };

    this.store.dispatch(
      this.isIRP
        ? new CandidateListActions.GetIRPCandidatesByPage(candidateListRequest)
        : new CandidateListActions.GetCandidatesByPage(candidateListRequest)
    ).pipe(take(1)).subscribe(() => {
      this.cd.detectChanges();
    });

    if (!firstDispatch) {
      this.onFilterClose();
    }
  }

  public regionTrackBy(index: number, region: string): string {
    return region;
  }

  public cancelInactivation(): void {
    this.inactivationData = { id: null, hireDate: null};
    this.inactivationForm.reset();
    this.inactivationDialog.hide();
  }

  public inactivateIrpEmployee(): void {
    if (!this.inactivationForm.valid || this.inactivationData.id === null) {
      this.inactivationForm.markAllAsTouched();
      return;
    }
    const data = this.inactivationForm.value;
    const dto: InactivateEmployeeDto = {
      id: this.inactivationData.id,
      inactivationDate: DateTimeHelper.setUtcTimeZone(data.inactivationDate),
      inactivationReasonId: data.inactivationReasonId,
      createReplacement: !!data.createReplacement,
    };

    this.store.dispatch(new CandidateListActions.DeleteIRPCandidate(dto));
    this.inactivationData = { id: null, hireDate: null};
    this.cancelInactivation();

    this.actions$.pipe(
      ofActionDispatched(CandidateListActions.EmployeeInactivationSuccessful),
      take(1),
    )
    .subscribe(() => {
      this.dispatchNewPage();
    });
  }

  private initCandidateFilterForm(): void {
    this.CandidateFilterFormGroup = !this.isIRP
      ? this.candidateListService.generateVMSCandidateFilterForm()
      : this.candidateListService.generateIRPCandidateFilterForm();
  }

  private updateCandidates(): void {
    if (this.isIRP) {
      this.candidates$ = this._IRPCandidates$.pipe(
        map((value: IRPCandidateList) => {
          return {
            ...value,
            items: this.addEmployeeSkillEllipsis(value?.items),
          };
        }),
      );
    } else {
      this.candidates$ = this._candidates$.pipe(
        map((value: CandidateList) => {
          return {
            ...value,
            items: this.addSkillRegionEllipsis(value?.items),
          };
        }),
      );
    }
  }

  private getFilterValues(): CandidateListRequest {
    if (this.redirectfromDashboard) {
      this.CandidateFilterFormGroup.reset();
    }
    const filter: CandidateListRequest = {
      profileStatuses: this.filters.profileStatuses!,
      skillsIds: this.filters.skillsIds!,
      regionsNames: this.filters.regionsNames!,
      tab: this.activeTab ?? 0,
      firstNamePattern: this.filters.firstNamePattern!,
      lastNamePattern: this.filters.lastNamePattern!,
      candidateId: this.filters.candidateId!,
      locationIds: this.filters.locationIds!,
      departmentIds: this.filters.departmentIds!,
      primarySkillIds: this.filters.primarySkillIds!,
      secondarySkillIds: this.filters.secondarySkillIds!,
      hireDate: this.filters.hireDate ? DateTimeHelper.setUtcTimeZone(this.filters.hireDate) : null,
      includeDeployedCandidates: this.includeDeployedCandidates,
      ids: this.selecteditmesids,
      expiry: {
        type: this.filters.credType! ? this.filters.credType! : [],
        startDate: this.filters.startDate! ? DateTimeHelper.setUtcTimeZone(this.filters.startDate!) : null,
        endDate: this.filters.endDate! ? DateTimeHelper.setUtcTimeZone(this.filters.endDate!) : null,
      },
      orderBy: this.orderBy,
      ShowNoWorkCommitmentOnly: this.unassignedworkCommitment
    };
    this.unassignedworkCommitment = false;
    this.globalWindow.localStorage.setItem("unassignedworkcommitment", JSON.stringify(false));

    return filter;
  }

  private addSkillRegionEllipsis(candidates: CandidateRow[]): CandidateRow[] {
    return (
      candidates &&
      candidates.map((candidate: CandidateRow) => {
        if (candidate.candidateProfileRegions.length > 2) {
          const [first, second] = candidate.candidateProfileRegions;
          candidate = {
            ...candidate,
            candidateProfileRegions: [first, second, { regionDescription: '...' }],
          };
        }

        return candidate;
      })
    );
  }

  private addEmployeeSkillEllipsis(candidates: IRPCandidate[]): IRPCandidate[] {
    return (
      candidates &&
      candidates.map((candidate: IRPCandidate) => {
        return candidate;
      })
    );
  }

  private inactivateCandidate(id: number) {
    this.store
      .dispatch(new CandidateListActions.ChangeCandidateProfileStatus(id, CandidateStatus.Inactive))
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.dispatchNewPage();
      });
  }

  private clearFilters(): void {
    this.CandidateFilterFormGroup.reset();
    this.filteredItems = [];
    this.currentPage = 1;
    this.filters = {};
  }

  private dispatchInitialIcon(): void {
    this.store.dispatch(new SetHeaderState({ title: this.isIRP ? 'Employees' : 'Candidates', iconName: 'users' }));
  }


  private IRPVMSGridHandler(): void {
    if (this.isIRP) {
      const columns = [...IRPCandidates];

      if (this.isSourcingEnabled) {
        const columnsToEnable = ['employeeSourceId', 'source', 'recruiter'];

        columns.forEach((column) => {
          if (columnsToEnable.includes(column.fieldName)) {
            column.visible = true;
          }
        });
      }

      this.refreshGridColumns(columns, this.grid);
    } else {
      this.refreshGridColumns(VMSCandidates, this.grid);
    }
    this.cd.detectChanges();
  }

  private subscribeOnSaveState(): void {
    const assignedSkillsStream: Observable<ListOfSkills[] | null> = this.isAgency ? of(null) : this.assignedSkills$
      .pipe(filter((assignedSkills) => !!assignedSkills.length));

    this.getLastSelectedBusinessUnitId().pipe(
      tap(() => {
        this.getFilterDataSource();
      }),
      switchMap(() => this.preservedFiltersByPageName$),
      filter(({ dispatch }) => dispatch),
      tap((filters) => {
        const tableState = (this.store.snapshot().candidateList as CandidateListStateModel).tableState;

        this.currentPage = tableState?.pageNumber || this.currentPage;
        this.pageSize = tableState?.pageSize || GRID_CONFIG.initialRowsPerPage;
        this.pageSettings.pageSize = tableState?.pageSize || GRID_CONFIG.initialRowsPerPage;

        if (!filters.isNotPreserved) {
          this.filters = { ...filters.state };
        }

        if (filters.isNotPreserved && tableState) {
          this.filters = { ...tableState };
        }

        if (this.credStartDate != undefined) {
          this.filters.startDate = DateTimeHelper.setUtcTimeZone(this.credStartDate);
        }

        if (this.credEndDate != undefined) {
          this.filters.endDate = DateTimeHelper.setUtcTimeZone(this.credEndDate);
        }

        if (this.credType != null) {
          this.filters.credType = [this.credType];
        }
        if (this.redirectedFromDashboard != null) {
          this.redirectfromDashboard = this.redirectedFromDashboard;
        }
        if (tableState) {
          this.includeDeployedCandidates = tableState.includeDeployedCandidates;
          this.includeDeployedCandidates$.next(tableState.includeDeployedCandidates);
        }

        this.dispatchNewPage(true);
        this.store.dispatch(new CandidateListActions.ClearTableState());
      }),
      switchMap(() => {
        return combineLatest([
          this.getStructure(),
          this.skills$,
          assignedSkillsStream,
        ]);
      }),
      filter(([structure, skills]) => {
        return !!structure && !!skills.length;
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      !this.isAgency && this.IRPVMSGridHandler();
      this.updateCandidates();
      this.candidateListService.refreshFilters(this.isIRP, this.CandidateFilterFormGroup, this.filters);
      this.cd.detectChanges();
    });
  }

  private subscribeOnPageSubject(): void {
    this.pageSubject
      .pipe(
        debounceTime(1),
        takeUntil(this.unsubscribe$)
      ).subscribe((page) => {
        this.currentPage = page;
        this.dispatchNewPage();
      });
  }

  private subscribeOnActions(): void {
    this.actions$
      .pipe(ofActionSuccessful(SaveCandidateSucceeded), takeUntil(this.unsubscribe$))
      .subscribe((agency: { payload: Candidate }) => {
        this.dispatchNewPage();
      });

    this.actions$.pipe(
      ofActionDispatched(ShowFilterDialog),
      debounceTime(300),
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.regionMultiselect?.refresh();
    });
  }

  private subscribeOnDeploydCandidates(): void {
    this.includeDeployedCandidates$.asObservable()
      .pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((isInclude: boolean) => {
        this.includeDeployedCandidates = isInclude;
        this.dispatchNewPage();
      });
  }

  private subscribeOnSkills(): void {
    this.skills$
      .pipe(
        filter((skills) => !!skills.length),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((skills) => {
        if (this.filterColumns?.skillsIds) {
          this.filterColumns.skillsIds.dataSource = skills;
        }
      });

    this.assignedSkills$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((skills) => {
        if (this.filterColumns?.primarySkillIds && this.filterColumns?.secondarySkillIds) {
          this.filterColumns.primarySkillIds.dataSource = skills;
          this.filterColumns.secondarySkillIds.dataSource = skills;
        }
      });
  }

  private subscribeOnRegions(): void {
    this.regions$
      .pipe(
        filter((region) => !!region),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((regions) => {
        if (this.filterColumns.regionsNames) {
          this.filterColumns.regionsNames.dataSource = adaptToNameEntity(regions);
        }
      });
  }
  private subscribeOnMasterCredentials(): void {
      this.masterCredentials$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((crdentialType) => {
        let credentialtypes:CredentialTypeFilter[]=crdentialType.map((obj)=>{
          return {id:obj.id=obj.credentialTypeId,name:obj.credentialTypeName!}
        })
       .reduce((acc:CredentialTypeFilter[], current:CredentialTypeFilter) => {
          if(!acc.some(el=> el.id === current.id)) acc.push(current)
          return acc
        }, [] as CredentialTypeFilter[])
        if (this.filterColumns?.credType) {
          this.filterColumns.credType.dataSource = credentialtypes;
        }
      });

  }

  private subscribeOnExportAction(): void {
    this.export$
      .pipe(
        takeWhile(() => this.isAlive),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((event: ExportedFileType) => {
        const type = this.isIRP ? 'Employees' : 'Candidates';
        this.defaultFileName = `${type} ${formatDate(Date.now(), 'MM/dd/yyyy HH:mm', 'en-US')}`;
        this.defaultExport(event);
      });
  }

  private setFileName(): void {
    const type = this.isIRP ? 'Employees' : 'Candidates';
    this.fileName = `${type} ${formatDate(Date.now(), 'MM/dd/yyyy HH:mm', 'en-US')}`;
  }

  private subscribeOnOrgStructure(): void {
    this.organizationStructure$
      .pipe(takeUntil(this.unsubscribe$), filter(Boolean))
      .subscribe((structure: OrganizationStructure) => {
        this.allLocations = [];
        structure.regions.forEach(region => {
          region.locations && this.allLocations.push(...getIRPOrgItems(region.locations));
        });
        if (this.filterColumns.locationIds) {
          this.filterColumns.locationIds.dataSource = this.allLocations;
        }
      });
  }

  private subscribeOnLocationChange(): void {
    this.CandidateFilterFormGroup.get('locationIds')?.valueChanges
      .pipe(filter(Boolean), takeUntil(this.unsubscribe$))
      .subscribe((val: number[]) => {
        if (this.filterColumns.departmentIds) {
          this.filterColumns.departmentIds.dataSource = [];
          if (val?.length) {
            const locationDataSource = this.filterColumns.locationIds?.dataSource as OrganizationLocation[];
            const selectedLocations: OrganizationLocation[] = DepartmentHelper.findSelectedItems(
              val,
              locationDataSource
            ) as OrganizationLocation[];
            const locationDepartments: OrganizationDepartment[] = selectedLocations.flatMap(
              (location) => location.departments
            );

            this.filterColumns.departmentIds.dataSource = getIRPOrgItems(locationDepartments);
          } else {
            this.CandidateFilterFormGroup.get('departmentIds')?.setValue([]);
          }
        }
      });
  }

  private getRegions(): void {
    this.getLastSelectedBusinessUnitId()
      .pipe(
        filter(Boolean),
        switchMap(() => this.store.dispatch(new CandidateListActions.GetRegionList())),
        takeUntil(this.unsubscribe$)
      ).subscribe();
  }
  private getCredentialTypes():void{
    this.store.dispatch(new GetMasterCredentials('', '', null, true));
  }

  private syncFilterTagsWithControls(): void {
    this.filterService
      .syncFilterTagsWithControls(this.CandidateFilterFormGroup, this.filterColumns)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((filteredItems) => {
        this.filteredItems = filteredItems;
        this.filteredItems$.next(this.filteredItems.length);
      });
  }

  private getFilterDataSource(): void {
    this.store.dispatch([
      new GetAllSkills(),
      new PreservedFilters.GetPreservedFiltersByPage(this.getPageName()),
    ]);

    if (!this.isAgency) {
      this.store.dispatch([
        new ClearAssignedSkillsByOrganization(),
        new GetAssignedSkillsByOrganization({ params: { SystemType: SystemType.IRP } }),
      ]);
    }
  }

  private saveFiltersByPageName(filters: CandidateListFilters): void {
    this.store.dispatch(new PreservedFilters.SaveFiltersByPageName(this.getPageName(), filters));
  }

  private getPageName(): FilterPageName {
    if (this.isIRP) {
      return FilterPageName.CandidatesIRPOrganization;
    }
    if (this.isAgency) {
      return FilterPageName.CandidatesVMSAgency;
    } else {
      return FilterPageName.CandidatesVMSOrganization;
    }
  }

  private getLastSelectedBusinessUnitId(): Observable<number> {
    const businessUnitId$ = this.isAgency ? this.lastSelectedAgencyId$ : this.lastSelectedOrgId$;
    return businessUnitId$;
  }

  private getStructure(): Observable<OrganizationStructure | string[]> {
    const structure$ = this.isAgency ? this.regions$ : this.organizationStructure$;
    return structure$;
  }

  @OutsideZone
  private checkScroll(): void {
    setTimeout(() => {
      this.checkScrollPosition();
    }, 500);
  }

  private createScrollSubscription(): void {
    if (!this.scrollSubscription) {
      const element = this.grid.element.querySelectorAll('.e-content')[0];

      this.scrollSubscription = fromEvent(element, 'scroll')
        .pipe(
          debounceTime(500),
          map(() => {
            return element.scrollTop;
          }),
          distinctUntilChanged(),
          takeUntil(this.unsubscribe$),
        )
        .subscribe((position) => {
          this.scrollService.setScrollPosition(CandidateListScroll.CandidateList, position);
        });
    }
  }

  private checkScrollPosition(): void {
    const scrollValue = this.scrollService.getScrollPosition(CandidateListScroll.CandidateList);

    if (scrollValue === undefined) {
      this.scrollService.createScrollPositionStorage(CandidateListScroll.CandidateList);
    } else {
      this.restoreScrollPosition(scrollValue);
    }
  }

  private restoreScrollPosition(position: number): void {
    this.grid.element.querySelectorAll('.e-content')[0].scrollTop = position;
  }

  private setTableState(): void {
    const paging: CandidatePagingState = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
    };

    const data = {
      ...this.filters,
      ...paging,
      includeDeployedCandidates: this.includeDeployedCandidates,
    };

    this.store.dispatch(new CandidateListActions.SetTableState(data));
  }
}
