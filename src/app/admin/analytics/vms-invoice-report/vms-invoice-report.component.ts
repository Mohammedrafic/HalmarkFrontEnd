import { ChangeDetectorRef, Component, Inject, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { LogiReportTypes } from '@shared/enums/logi-report-type.enum';
import { LogiReportFileDetails } from '@shared/models/logi-report-file';
import { Region, Location, Department } from '@shared/models/visibility-settings.model';
import { EmitType } from '@syncfusion/ej2-base';
import { ChangeEventArgs, FieldSettingsModel, AutoComplete, FilteringEventArgs } from '@syncfusion/ej2-angular-dropdowns';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { SetHeaderState, ShowFilterDialog, ShowToast } from 'src/app/store/app.actions';
import { ControlTypes, ValueType } from '@shared/enums/control-types.enum';
import { UserState } from 'src/app/store/user.state';
import { BUSINESS_DATA_FIELDS } from '@admin/alerts/alerts.constants';
import { SecurityState } from 'src/app/security/store/security.state';
import { BusinessUnit } from '@shared/models/business-unit.model';
import { GetBusinessByUnitType, GetOrganizationsStructureAll } from 'src/app/security/store/security.actions';
import { BusinessUnitType } from '@shared/enums/business-unit-type';
import { GetDepartmentsByLocations, GetCommonReportFilterOptions, GetLocationsByRegions, GetLogiReportData, GetRegionsByOrganizations, GetCommonReportCandidateSearch } from '@organization-management/store/logi-report.action';
import { LogiReportState } from '@organization-management/store/logi-report.state';
import { startDateValidator } from '@shared/validators/date.validator';
import { formatDate } from '@angular/common';
import { LogiReportComponent } from '@shared/components/logi-report/logi-report.component';
import { FilteredItem } from '@shared/models/filter.model';
import { FilterService } from '@shared/services/filter.service';
import { AppSettings, APP_SETTINGS } from 'src/app.settings';
import { ConfigurationDto } from '@shared/models/analytics.model';
import { User } from '@shared/models/user.model';
import { Organisation } from '@shared/models/visibility-settings.model';
import { uniqBy } from 'lodash';
import { MessageTypes } from '@shared/enums/message-types';
import { ORGANIZATION_DATA_FIELDS } from '../analytics.constant';
import { AgencyDto, CommonCandidateSearchFilter, CommonReportFilter, CommonReportFilterOptions, MasterSkillDto, SearchCandidate, SkillCategoryDto } from '../models/common-report.model';
import { OrderTypeOptions } from '@shared/enums/order-type';
import { OutsideZone } from "@core/decorators";
import { analyticsConstants, yearList, monthList, invoiceStatusList } from '../constants/analytics.constant';

@Component({
  selector: 'app-vms-invoice-report',
  templateUrl: './vms-invoice-report.component.html',
  styleUrls: ['./vms-invoice-report.component.scss']
})
export class VmsInvoiceReportComponent implements OnInit, OnDestroy {

  public paramsData: any = {
    "OrganizationParamACCR": "",
    "StartDateParamACCR": "",
    "EndDateParamACCR": "",
    "RegionParamACCR": "",
    "LocationParamACCR": "",
    "DepartmentParamACCR": "",
    "AgencyParamACCR": "",
    "YearParamACCR": "",
    "MonthParamACCR": "",
    "InvoiceStatusParamACCR": "",
    "InvoiceIdParamACCR": "",
    "OrderTypeACCR": "",
    "BearerParamACCR": "",
    "BusinessUnitIdParamACCR": "",
    "HostName": ""
  };
  public reportName: LogiReportFileDetails = { name: "/JsonApiReports/AccrualReport/ClientFinanceAccrualReport.cls" };
  public catelogName: LogiReportFileDetails = { name: "/JsonApiReports/AccrualReport/Accrual.cat" };
  public title: string = "VMS Invoice Report";
  public message: string = "";
  public reportType: LogiReportTypes = LogiReportTypes.PageReport;
  public allOption: string = "All";
  @Select(LogiReportState.regions)
  public regions$: Observable<Region[]>;
  regionFields: FieldSettingsModel = { text: 'name', value: 'id' };
  selectedRegions: Region[];

  @Select(LogiReportState.locations)
  public locations$: Observable<Location[]>;
  isLocationsDropDownEnabled: boolean = false;
  locationFields: FieldSettingsModel = { text: 'name', value: 'id' };
  selectedLocations: Location[];

  @Select(LogiReportState.departments)
  public departments$: Observable<Department[]>;
  isDepartmentsDropDownEnabled: boolean = false;
  departmentFields: FieldSettingsModel = { text: 'name', value: 'id' };

  @Select(LogiReportState.logiReportData)
  public logiReportData$: Observable<ConfigurationDto[]>;

  @Select(LogiReportState.commonReportFilterData)
  public CommonReportFilterData$: Observable<CommonReportFilterOptions>;

  @Select(SecurityState.organisations)
  public organizationData$: Observable<Organisation[]>;
  selectedOrganizations: Organisation[];

  accrualReportTypeFields: FieldSettingsModel = { text: 'name', value: 'id' };
  commonFields: FieldSettingsModel = { text: 'name', value: 'id' };
  remoteWaterMark: string = 'e.g. Andrew Fuller';
  agencyFields: FieldSettingsModel = { text: 'agencyName', value: 'agencyId' };
  yearFields: FieldSettingsModel = { text: 'name', value: 'name' };
  monthFields: FieldSettingsModel = { text: 'name', value: 'id' };
  invoiceStatusFields: FieldSettingsModel = { text: 'name', value: 'id' };
  selectedDepartments: Department[];
  selectedAgencies: AgencyDto[];
  @Select(UserState.lastSelectedOrganizationId)
  private organizationId$: Observable<number>;
  private agencyOrganizationId: number;

  public bussinesDataFields = BUSINESS_DATA_FIELDS;
  public organizationFields = ORGANIZATION_DATA_FIELDS;
  private unsubscribe$: Subject<void> = new Subject();
  public filterColumns: any;
  public vmsInvoiceReportForm: FormGroup;
  public bussinessControl: AbstractControl;
  public regionIdControl: AbstractControl;
  public locationIdControl: AbstractControl;
  public departmentIdControl: AbstractControl;
  public agencyIdControl: AbstractControl;
  public regions: Region[] = [];
  public locations: Location[] = [];
  public departments: Department[] = [];
  public organizations: Organisation[] = [];
  public regionsList: Region[] = [];
  public locationsList: Location[] = [];
  public departmentsList: Department[] = [];
  public defaultOrganizations: number;
  public defaultRegions: (number | undefined)[] = [];
  public defaultLocations: (number | undefined)[] = [];
  public defaultDepartments: (number | undefined)[] = [];
  public defaultAgencyIds: (number | undefined)[] = [];
  public defaultOrderTypes: (number | undefined)[] = [];
  public today = new Date();
  public filteredItems: FilteredItem[] = [];
  public isClearAll: boolean = false;
  public isInitialLoad: boolean = false;
  public baseUrl: string = '';
  public user: User | null;
  public isResetFilter: boolean = false;
  public filterOptionsData: CommonReportFilterOptions;
  @ViewChild(LogiReportComponent, { static: true }) logiReportComponent: LogiReportComponent;

  constructor(private store: Store,
    private formBuilder: FormBuilder,
    private filterService: FilterService,
    private changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    @Inject(APP_SETTINGS) private appSettings: AppSettings) {
    this.baseUrl = this.appSettings.host.replace("https://", "").replace("http://", "");
    this.store.dispatch(new SetHeaderState({ title: "Analytics", iconName: '' }));
    this.initForm();
    this.user = this.store.selectSnapshot(UserState.user);
    if (this.user?.id != null) {
      this.store.dispatch(new GetOrganizationsStructureAll(this.user?.id));
    }

    this.SetReportData();
  }

  ngOnInit(): void {
    this.orderFilterColumnsSetup();
    this.organizationId$.pipe(takeUntil(this.unsubscribe$)).subscribe((data: number) => {
      this.CommonReportFilterData$.pipe(takeUntil(this.unsubscribe$)).subscribe((data: CommonReportFilterOptions | null) => {
        if (data != null) {
          this.filterOptionsData = data;
          this.filterColumns.agencyIds.dataSource = data.agencies;
          this.defaultAgencyIds = data.agencies.map((list) => list.agencyId);
          this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.AgencyIds)?.setValue(this.defaultAgencyIds);
        }
      });
      this.SetReportData();
      this.logiReportData$.pipe(takeUntil(this.unsubscribe$)).subscribe((data: ConfigurationDto[]) => {
        if (data.length > 0) {
          this.logiReportComponent.SetReportData(data);
        }
      });
      this.agencyOrganizationId = data;
      this.isInitialLoad = true;
      this.onFilterControlValueChangedHandler();
      this.user?.businessUnitType == BusinessUnitType.Hallmark ? this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.BusinessIds)?.enable() : this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.BusinessIds)?.disable();
    });
  }

  private initForm(): void {
    let startDate = new Date(Date.now());
    startDate.setDate(startDate.getDate() - 30);
    let endDate = new Date(Date.now());
    endDate.setDate(endDate.getDate() + 30);
    this.vmsInvoiceReportForm = this.formBuilder.group(
      {
        businessIds: new FormControl([Validators.required]),
        startDate: new FormControl(startDate, [Validators.required]),
        endDate: new FormControl(endDate, [Validators.required]),
        regionIds: new FormControl([], [Validators.required]),
        locationIds: new FormControl([], [Validators.required]),
        departmentIds: new FormControl([], [Validators.required]),
        agencyIds: new FormControl([]),
        years: new FormControl(null),
        months: new FormControl(null),
        invoiceStatuses: new FormControl(null),
        invoiceID: new FormControl(null)
      }
    );
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  public onFilterControlValueChangedHandler(): void {
    this.bussinessControl = this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.BusinessIds) as AbstractControl;

    this.organizationData$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      this.organizations = uniqBy(data, 'organizationId');
      this.filterColumns.businessIds.dataSource = this.organizations;
      this.defaultOrganizations = this.agencyOrganizationId;

      this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.BusinessIds)?.setValue(this.agencyOrganizationId);
      this.changeDetectorRef.detectChanges();
    });

    this.bussinessControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      if (!this.isClearAll) {
        let orgList = this.organizations?.filter((x) => data == x.organizationId);
        this.selectedOrganizations = orgList;
        this.regionsList = [];
        this.locationsList = [];
        this.departmentsList = [];
        orgList.forEach((value) => {
          this.regionsList.push(...value.regions);
          value.regions.forEach((region) => {
            this.locationsList.push(...region.locations);
            region.locations.forEach((location) => {
              this.departmentsList.push(...location.departments);
            });
          });
        });
        if ((data == null || data <= 0) && this.regionsList.length == 0 || this.locationsList.length == 0 || this.departmentsList.length == 0) {
          this.showToastMessage(this.regionsList.length, this.locationsList.length, this.departmentsList.length);
        }
        else {
          this.isResetFilter = true;
        }
        let businessIdData = [];
        businessIdData.push(data);
        let filter: CommonReportFilter = {
          businessUnitIds: businessIdData
        };
        this.store.dispatch(new GetCommonReportFilterOptions(filter));
        this.regions = this.regionsList;
        this.filterColumns.regionIds.dataSource = this.regions;
        this.defaultRegions = this.regionsList.map((list) => list.id);
        this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.RegionIds)?.setValue(this.defaultRegions);
        this.changeDetectorRef.detectChanges();
      }
      else {
        this.isClearAll = false;
        this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.RegionIds)?.setValue([]);
      }
    });
    this.regionIdControl = this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.RegionIds) as AbstractControl;
    this.regionIdControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      if (this.regionIdControl.value.length > 0) {
        let regionList = this.regions?.filter((object) => data?.includes(object.id));
        this.selectedRegions = regionList;
        this.locations = this.locationsList.filter(i => data?.includes(i.regionId));
        this.filterColumns.locationIds.dataSource = this.locations;
        this.defaultLocations = this.locations.map((list) => list.id);
        this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.LocationIds)?.setValue(this.defaultLocations);
        this.changeDetectorRef.detectChanges();
      }
      else {
        this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.LocationIds)?.setValue([]);
      }
    });
    this.locationIdControl = this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.LocationIds) as AbstractControl;
    this.locationIdControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      if (this.locationIdControl.value.length > 0) {
        this.selectedLocations = this.locations?.filter((object) => data?.includes(object.id));
        this.departments = this.departmentsList.filter(i => data?.includes(i.locationId));
        this.filterColumns.departmentIds.dataSource = this.departments;
        this.defaultDepartments = this.departments.map((list) => list.id);
        this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.DepartmentIds)?.setValue(this.defaultDepartments);
        this.changeDetectorRef.detectChanges();
      }
      else {
        this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.DepartmentIds)?.setValue([]);
      }
    });
    this.departmentIdControl = this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.DepartmentIds) as AbstractControl;
    this.departmentIdControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      this.selectedDepartments = this.departments?.filter((object) => data?.includes(object.id));
      if (this.isInitialLoad) {

        this.SearchReport();
        this.isInitialLoad = false;
      }
    });
    this.agencyIdControl = this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.AgencyIds) as AbstractControl;
    this.agencyIdControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      if (this.agencyIdControl.value.length > 0) {
        let agencyData = this.filterOptionsData.agencies;
        this.selectedAgencies = agencyData?.filter((object) => data?.includes(object.agencyId));
      }
    });

  }

  public SearchReport(): void {

    this.filteredItems = [];
    let auth = "Bearer ";
    for (let x = 0; x < window.localStorage.length; x++) {
      if (window.localStorage.key(x)!.indexOf('accesstoken') > 0) {
        auth = auth + JSON.parse(window.localStorage.getItem(window.localStorage.key(x)!)!).secret
      }
    }
    let { businessIds, departmentIds, locationIds,
      regionIds, agencyIds, startDate, endDate,year,month,invoiceStatus,invoiceId } = this.vmsInvoiceReportForm.getRawValue();
    if (!this.vmsInvoiceReportForm.dirty) {
      this.message = "Default filter selected with all regions ,locations and departments for last 30 and next 30 days";
    }
    else {
      this.isResetFilter = false;
      this.message = ""
    }
    this.paramsData =
    {
      "OrganizationParamACCR": this.selectedOrganizations?.map((list) => list.organizationId),
      "StartDateParamACCR": formatDate(startDate, 'MM/dd/yyyy', 'en-US'),
      "EndDateParamACCR": formatDate(endDate, 'MM/dd/yyyy', 'en-US'),
      "RegionParamACCR": regionIds,
      "LocationParamACCR": locationIds,
      "DepartmentParamACCR": departmentIds,
      "AgencyParamACCR": agencyIds,
      "YearParamACCR": year,
      "MonthParamACCR": month,
      "InvoiceStatusParamACCR": invoiceStatus,
      "InvoiceIdParamACCR": invoiceId,
      "OrderTypeACCR": "",
      "BearerParamACCR": auth,
      "BusinessUnitIdParamACCR": window.localStorage.getItem("lastSelectedOrganizationId") == null
        ? this.organizations != null && this.organizations[0]?.id != null ?
          this.organizations[0].id.toString() : "1" :
        window.localStorage.getItem("lastSelectedOrganizationId"),
      "HostName": this.baseUrl
    };
    this.logiReportComponent.paramsData = this.paramsData;
    this.logiReportComponent.RenderReport();
  }
  private orderFilterColumnsSetup(): void {
    this.filterColumns = {
      businessIds: {
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
      departmentIds: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'name',
        valueId: 'id',
      },
      startDate: { type: ControlTypes.Date, valueType: ValueType.Text },
      endDate: { type: ControlTypes.Date, valueType: ValueType.Text },
      agencyIds: {
        type: ControlTypes.Multiselect,
        valueType: ValueType.Id,
        dataSource: [],
        valueField: 'agencyName',
        valueId: 'agencyId',
      },
      years: {
        type: ControlTypes.Dropdown,
        valueType: ValueType.Id,
        dataSource: yearList,
        valueField: 'name',
        valueId: 'id',
      },
      months: {
        type: ControlTypes.Dropdown,
        valueType: ValueType.Id,
        dataSource: monthList,
        valueField: 'name',
        valueId: 'id',
      },
      invoiceStatuses: {
        type: ControlTypes.Dropdown,
        valueType: ValueType.Id,
        dataSource: invoiceStatusList,
        valueField: 'name',
        valueId: 'id',
      }
    }
  }
  private SetReportData() {
    const logiReportData = this.store.selectSnapshot(LogiReportState.logiReportData);
    if (logiReportData != null && logiReportData.length == 0) {
      this.store.dispatch(new GetLogiReportData());
    }
    else {
      this.logiReportComponent?.SetReportData(logiReportData);
    }
  }

  public showFilters(): void {
    if (this.isResetFilter) {
      this.onFilterControlValueChangedHandler();
    }
    this.store.dispatch(new ShowFilterDialog(true));
  }
  public onFilterDelete(event: FilteredItem): void {
    this.filterService.removeValue(event, this.vmsInvoiceReportForm, this.filterColumns);
  }
  public onFilterClearAll(): void {
    this.isClearAll = true;
    let startDate = new Date(Date.now());
    startDate.setDate(startDate.getDate() - 30);
    let endDate = new Date(Date.now());
    endDate.setDate(endDate.getDate() + 30);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.RegionIds)?.setValue(this.defaultRegions);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.LocationIds)?.setValue([]);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.DepartmentIds)?.setValue([]);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.StartDate)?.setValue(startDate);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.EndDate)?.setValue(endDate);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.AgencyIds)?.setValue([]);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.Years)?.setValue(null);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.Months)?.setValue(null);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.InvoiceStatuses)?.setValue(null);
    this.vmsInvoiceReportForm.get(analyticsConstants.formControlNames.InvoiceID)?.setValue(null);
    this.filteredItems = [];
  }
  public onFilterApply(): void {
    this.vmsInvoiceReportForm.markAllAsTouched();
    if (this.vmsInvoiceReportForm?.invalid) {
      return;
    }
    this.filteredItems = [];
    this.SearchReport();
    this.store.dispatch(new ShowFilterDialog(false));
  }
  public showToastMessage(regionsLength: number, locationsLength: number, departmentsLength: number) {
    this.message = "";
    let error: any = regionsLength == 0 ? "Regions/Locations/Departments are required" : locationsLength == 0 ? "Locations/Departments are required" : departmentsLength == 0 ? "Departments are required" : "";

    this.store.dispatch([new ShowToast(MessageTypes.Error, error)]);
    return;
  }

  public onFiltering: EmitType<FilteringEventArgs> = (e: FilteringEventArgs) => {
    this.onFilterChild(e);
  }
  @OutsideZone
  private onFilterChild(e: FilteringEventArgs) {
 
  }

}
