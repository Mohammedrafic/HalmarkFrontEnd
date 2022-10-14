import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { LogiReportTypes } from '@shared/enums/logi-report-type.enum';
import { LogiReportFileDetails } from '@shared/models/logi-report-file';
import { Location, LocationsByRegionsFilter } from '@shared/models/location.model';
import { Region, regionFilter } from '@shared/models/region.model';
import { Department, DepartmentsByLocationsFilter } from '@shared/models/department.model';
import { ChangeEventArgs, FieldSettingsModel } from '@syncfusion/ej2-angular-dropdowns';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { SetHeaderState, ShowFilterDialog } from 'src/app/store/app.actions';
import { ControlTypes, ValueType } from '@shared/enums/control-types.enum';
import { UserState } from 'src/app/store/user.state';
import { BUSINESS_DATA_FIELDS } from '@admin/alerts/alerts.constants';
import { SecurityState } from 'src/app/security/store/security.state';
import { BusinessUnit } from '@shared/models/business-unit.model';
import { GetBusinessByUnitType } from 'src/app/security/store/security.actions';
import { BusinessUnitType } from '@shared/enums/business-unit-type';
import { GetDepartmentsByLocations, GetLocationsByRegions, GetLogiReportUrl, GetRegionsByOrganizations } from '@organization-management/store/logi-report.action';
import { LogiReportState } from '@organization-management/store/logi-report.state';
import { startDateValidator } from '@shared/validators/date.validator';
import { formatDate } from '@angular/common';
import { LogiReportComponent } from '@shared/components/logi-report/logi-report.component';
import { FilteredItem } from '@shared/models/filter.model';
import { FilterService } from '@shared/services/filter.service';
import { accrualReportTypesList, analyticsConstants } from '../constants/analytics.constant';
import { AppSettings, APP_SETTINGS } from 'src/app.settings';

@Component({
  selector: 'app-client-finance-accrual-report',
  templateUrl: './client-finance-accrual-report.component.html',
  styleUrls: ['./client-finance-accrual-report.component.scss']
})
export class ClientFinanceAccrualReportComponent implements OnInit,OnDestroy {
  public paramsData: any = {
    "OrganizationParamACCR": "",
    "StartDateParamACCR": "",
    "EndDateParamACCR": "",
    "RegionParamACCR": "",
    "LocationParamACCR": "",
    "DepartmentParamACCR": "",
    "BearerParamACCR":"",
    "BusinessUnitIdParamACCR":"",
    "HostName":"",
    "AccrualReportFilterACCR":""
  };
  public reportName: LogiReportFileDetails = { name: "/JsonApiReports/AccrualReport/ClientFinanceAccrualReport.cls" };
  public catelogName: LogiReportFileDetails = { name: "/JsonApiReports/AccrualReport/Accrual.cat" };
  public title: string = "Client Finance Accrual";
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
  departmentFields: FieldSettingsModel = { text: 'departmentName', value: 'departmentId' };

  @Select(LogiReportState.logiReportUrl)
  public logiReportUrl$: Observable<string>;

  accrualReportTypeFields:FieldSettingsModel = { text: 'name', value: 'id' };
  selectedDepartments: Department[];
  @Select(UserState.lastSelectedOrganizationId)
  private organizationId$: Observable<number>;
  private agencyOrganizationId:number;
  @Select(SecurityState.bussinesData)
  public businessData$: Observable<BusinessUnit[]>;
  selectedOrganizations: BusinessUnit[];

  public bussinesDataFields = BUSINESS_DATA_FIELDS;
  private unsubscribe$: Subject<void> = new Subject();
  public filterColumns: any;
  public accrualReportForm: FormGroup;
  public bussinessControl: AbstractControl;
  public regionIdControl: AbstractControl;
  public locationIdControl: AbstractControl;
  public departmentIdControl: AbstractControl;
  public regions: Region[] = [];
  public locations: Location[] = [];
  public departments: Department[] = [];
  public organizations: BusinessUnit[] = [];
  public defaultOrganizations: number[] = [];
  public defaultRegions: (number | undefined)[] = [];
  public defaultLocations: (number | undefined)[] = [];
  public defaultDepartments: (number | undefined)[] = [];
  public today = new Date();
  public filteredItems: FilteredItem[] = [];
  public isClearAll: boolean = false;
  public isInitialLoad: boolean = false;  
  public baseUrl:string='';
  @ViewChild(LogiReportComponent, { static: true }) logiReportComponent: LogiReportComponent;

  constructor(private store: Store,
    private formBuilder: FormBuilder,
    private filterService: FilterService,@Inject(APP_SETTINGS) private appSettings: AppSettings) {
      this.baseUrl = this.appSettings.host.replace("https://","").replace("http://","");
      this.store.dispatch(new SetHeaderState({ title: "Analytics", iconName: '' }));
    this.initForm();
    const user = this.store.selectSnapshot(UserState.user);
    if (user?.businessUnitType != null) {
      this.store.dispatch(new GetBusinessByUnitType(BusinessUnitType.Organization));
    }
    this.SetReportUrl();    
  }

  ngOnInit(): void {
    
    this.organizationId$.pipe(takeUntil(this.unsubscribe$)).subscribe((data:number) => { 
      this.SetReportUrl();
      this.logiReportUrl$.pipe(takeUntil(this.unsubscribe$)).subscribe((data:string)=>{
        this.logiReportComponent.SetReportUrl(data);
     });  
      this.agencyOrganizationId=data;   
      this.isInitialLoad = true;
      this.orderFilterColumnsSetup();
      this.accrualReportForm.get(analyticsConstants.formControlNames.accrualReportTypes)?.setValue(0);
      this.onFilterControlValueChangedHandler();
    });
  }
  
  private initForm(): void {
    let startDate = new Date(Date.now());
    startDate.setDate(startDate.getDate() - 90);
    this.accrualReportForm = this.formBuilder.group(
      {
        businessIds: new FormControl({value:[],disabled:true}, [Validators.required]),
        startDate: new FormControl(startDate, [Validators.required]),
        endDate: new FormControl(new Date(Date.now()), [Validators.required]),
        regionIds: new FormControl([], [Validators.required]),
        locationIds: new FormControl([], [Validators.required]),
        departmentIds: new FormControl([], [Validators.required]),
        accrualReportTypes:new FormControl(null,[Validators.required])
      }
    );
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  public onFilterControlValueChangedHandler(): void {
    this.bussinessControl = this.accrualReportForm.get(analyticsConstants.formControlNames.BusinessIds) as AbstractControl;
    this.businessData$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      this.organizations = data;
      this.filterColumns.businessIds.dataSource = data;
      this.defaultOrganizations = data.map((list) => list.id).filter(i=>i==this.agencyOrganizationId);
    });
    this.bussinessControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => { 
      if (!this.isClearAll) {
        this.selectedOrganizations = this.organizations?.filter((x) => data?.includes(x.id));
        let regionFilter: regionFilter = {
          ids: data,
          getAll: true
        };
        this.store.dispatch(new GetRegionsByOrganizations(regionFilter));
      }
      else {
        this.isClearAll = false;
      }
    });
    this.regionIdControl = this.accrualReportForm.get(analyticsConstants.formControlNames.RegionIds) as AbstractControl;
    this.regionIdControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      if (this.regionIdControl.value.length > 0) {
        this.selectedRegions = this.regions?.filter((object) => data?.includes(object.id));
        let locationFilter: LocationsByRegionsFilter = {
          ids: data,
          getAll: true
        };
        this.store.dispatch(new GetLocationsByRegions(locationFilter));
      }
    });
    this.locationIdControl = this.accrualReportForm.get(analyticsConstants.formControlNames.LocationIds) as AbstractControl;
    this.locationIdControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      if (this.locationIdControl.value.length > 0) {
        this.selectedLocations = this.locations?.filter((object) => data?.includes(object.id));
        let departmentFilter: DepartmentsByLocationsFilter = {
          ids: data,
          getAll: true
        };
        this.store.dispatch(new GetDepartmentsByLocations(departmentFilter));
      }
    });
    this.departmentIdControl = this.accrualReportForm.get(analyticsConstants.formControlNames.DepartmentIds) as AbstractControl;
    this.departmentIdControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      this.selectedDepartments = this.departments?.filter((object) => data?.includes(object.departmentId));
      if (this.isInitialLoad) {
        this.SearchReport();
        this.isInitialLoad = false;
      }
    });
    this.onOrganizationsChange();
    this.onRegionsChange();
    this.onLocationsChange();
  }

  public SearchReport(): void {
    let auth="Bearer ";
    for(let x=0;x<window.localStorage.length;x++)
    { 
      if(window.localStorage.key(x)!.indexOf('accesstoken')>0)
      {
        auth=auth+ JSON.parse(window.localStorage.getItem(window.localStorage.key(x)!)!).secret
      }
    }
    let { startDate, endDate } = this.accrualReportForm.getRawValue();
    this.paramsData =
    {
      "OrganizationParamACCR": this.selectedOrganizations?.map((list) => list.id),
      "StartDateParamACCR": formatDate(startDate, 'MM/dd/yyyy', 'en-US'),
      "EndDateParamACCR": formatDate(endDate, 'MM/dd/yyyy', 'en-US'),
      "RegionParamACCR": this.selectedRegions?.map((list) => list.id),
      "LocationParamACCR": this.selectedLocations?.map((list) => list.id),
      "DepartmentParamACCR": this.selectedDepartments?.map((list) => list.departmentId),
      "BearerParamACCR":auth,
      "BusinessUnitIdParamACCR":window.localStorage.getItem("lastSelectedOrganizationId") == null 
      ?this.organizations!=null &&this.organizations[0]?.id!=null?
      this.organizations[0].id.toString():"1": 
      window.localStorage.getItem("lastSelectedOrganizationId"),
      "HostName":this.baseUrl,
      "AccrualReportFilterACCR":this.accrualReportForm.controls['accrualReportTypes'].value.toString()
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
        valueField: 'departmentName',
        valueId: 'departmentId',
      },
      startDate: { type: ControlTypes.Date, valueType: ValueType.Text },
      endDate: { type: ControlTypes.Date, valueType: ValueType.Text },
      accrualReportTypes:{
        type:ControlTypes.Dropdown,
        valueType: ValueType.Id,
        dataSource:  accrualReportTypesList  ,
        valueField: 'name',
        valueId: 'id',
      }
    }
  }
  private SetReportUrl(){
    const logiReportUrl = this.store.selectSnapshot(LogiReportState.logiReportUrl);
      if(logiReportUrl=='')
      {
        this.store.dispatch(new GetLogiReportUrl());
      }
      else{
        this.logiReportComponent?.SetReportUrl(logiReportUrl);
      }
  }
  private onOrganizationsChange(): void {
    this.regions$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: Region[]) => {
        if (data != undefined) {
          this.regions = data;
          this.filterColumns.regionIds.dataSource = this.regions;
          this.defaultRegions = data.map((list) => list.id);
          this.defaultLocations = [];
          this.defaultDepartments = [];
        }
      });
  }
  private onRegionsChange(): void {
    this.locations$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: Location[]) => {
        if (data != undefined) {
          this.locations = data;
          this.filterColumns.locationIds.dataSource = this.locations;
          this.defaultLocations = data.map((list) => list.id);
          this.defaultDepartments = [];
        }
      });
  }
  private onLocationsChange(): void {
    this.departments$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: Department[]) => {
        if (data != undefined) {
          this.departments = data;
          this.filterColumns.departmentIds.dataSource = this.departments;
          this.defaultDepartments = data.map((list) => list.departmentId);
        }
      });
  }
  public showFilters(): void {
    this.onFilterControlValueChangedHandler();
    this.store.dispatch(new ShowFilterDialog(true));
  }
  public onFilterDelete(event: FilteredItem): void {
    this.filterService.removeValue(event, this.accrualReportForm, this.filterColumns);
  }
  public onFilterClearAll(): void {
    this.isClearAll = true;
    let startDate = new Date(Date.now());
    startDate.setDate(startDate.getDate() - 90);
    this.accrualReportForm.get(analyticsConstants.formControlNames.BusinessIds)?.setValue([]);
    this.accrualReportForm.get(analyticsConstants.formControlNames.RegionIds)?.setValue([]);
    this.accrualReportForm.get(analyticsConstants.formControlNames.LocationIds)?.setValue([]);
    this.accrualReportForm.get(analyticsConstants.formControlNames.DepartmentIds)?.setValue([]);
    this.accrualReportForm.get(analyticsConstants.formControlNames.StartDate)?.setValue(startDate);
    this.accrualReportForm.get(analyticsConstants.formControlNames.EndDate)?.setValue(new Date(Date.now()));
    this.accrualReportForm.get(analyticsConstants.formControlNames.accrualReportTypes)?.setValue(0);
    this.filteredItems = [];
  }
  public onFilterApply(): void {
    this.accrualReportForm.markAllAsTouched();
    if (this.accrualReportForm?.invalid) {
      return;
    }
    this.filteredItems = this.filterService.generateChips(this.accrualReportForm, this.filterColumns);
    this.SearchReport();
    this.store.dispatch(new ShowFilterDialog(false));
  }
}
