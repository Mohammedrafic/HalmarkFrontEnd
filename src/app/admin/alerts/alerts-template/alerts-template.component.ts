import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Actions, Select, Store } from '@ngxs/store';
import { AbstractGridConfigurationComponent } from '@shared/components/abstract-grid-configuration/abstract-grid-configuration.component';
import { ExportedFileType } from '@shared/enums/exported-file-type';
import { Observable, Subject, takeUntil, takeWhile } from 'rxjs';
import { GridReadyEvent } from '@ag-grid-community/core';
import { GetAlertsTemplatePage, GetTemplateByAlertId, SaveTemplateByAlertId } from '@admin/store/alerts.actions';
import { AlertsTemplate, AlertsTemplateFilters, AlertsTemplatePage, EditAlertsTemplate, EditAlertsTemplateRequest } from '@shared/models/alerts-template.model';
import { AlertsState } from '@admin/store/alerts.state';
import { SetHeaderState, ShowEmailSideDialog, ShowSmsSideDialog, ShowOnScreenSideDialog, ShowSideDialog, ShowToast } from 'src/app/store/app.actions';
import { ButtonRendererComponent } from '@shared/components/button/button-renderer/button-renderer.component';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { AlertsEmailTemplateFormComponent } from './alerts-email-template-form/alerts-email-template-form.component';
import { BUSINESS_UNITS_VALUES, BUSSINES_DATA_FIELDS, DISABLED_GROUP, OPRION_FIELDS, toolsRichTextEditor } from '../alerts.constants';
import { RichTextEditorComponent } from '@syncfusion/ej2-angular-richtexteditor';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
import { AlertChannel } from '../alerts.enum';
import { AlertsSmsTemplateFromComponent } from './alerts-sms-template-from/alerts-sms-template-from.component';
import { AlertsOnScreenTemplateFormComponent } from './alerts-on-screen-template-form/alerts-on-screen-template-form.component';
import { BusinessUnitType } from '@shared/enums/business-unit-type';
import { SecurityState } from 'src/app/security/store/security.state';
import { BusinessUnit } from '@shared/models/business-unit.model';
import { GetBusinessByUnitType } from 'src/app/security/store/security.actions';
import { UserState } from 'src/app/store/user.state';
import { ConfirmService } from '@shared/services/confirm.service';
import { DELETE_RECORD_TEXT, DELETE_RECORD_TITLE, RECORD_MODIFIED } from '@shared/constants';
import { MessageTypes } from '@shared/enums/message-types';
@Component({
  selector: 'app-template',
  templateUrl: './alerts-template.component.html',
  styleUrls: ['./alerts-template.component.scss']
})
export class AlertsTemplateComponent extends AbstractGridConfigurationComponent implements OnInit, OnDestroy {
  @Output() editEmailTemplateEvent = new EventEmitter();
  @Output() editSmsTemplateEvent = new EventEmitter();
  @Output() editOnScreenTemplateEvent = new EventEmitter();
  public tools = toolsRichTextEditor;
  targetElement: HTMLElement = document.body;
  public alertTemplateType: string;
  @Select(SecurityState.bussinesData)
  public bussinesData$: Observable<BusinessUnit[]>;

  @Input() filterForm: FormGroup;
  public businessForm: FormGroup;
  public isBusinessFormDisabled = false;
  public businessUnits = BUSINESS_UNITS_VALUES;
  public optionFields = OPRION_FIELDS;
  public bussinesDataFields = BUSSINES_DATA_FIELDS;
  @ViewChild('RTE')
  public rteEle: RichTextEditorComponent;
  @ViewChild(AlertsEmailTemplateFormComponent, { static: true }) emailTemplateForm: AlertsEmailTemplateFormComponent;
  @ViewChild(AlertsSmsTemplateFromComponent, { static: true }) smsTemplateForm: AlertsSmsTemplateFromComponent;
  @ViewChild(AlertsOnScreenTemplateFormComponent, { static: true }) onScreenTemplateForm: AlertsOnScreenTemplateFormComponent;
  private subTitle: string;
  public emailTemplateFormGroup: FormGroup;
  public smsTemplateFormGroup: FormGroup;
  public onScreenTemplateFormGroup: FormGroup;
  @Select(AlertsState.AlertsTemplatePage)
  public alertsTemplatePage$: Observable<AlertsTemplatePage>;

  @Select(AlertsState.TemplateByAlertId)
  public editAlertsTemplate$: Observable<EditAlertsTemplate>;

  public editAlertTemplateData: EditAlertsTemplate = {
    id: 0,
    alertId: 0,
    alertChannel: AlertChannel.Email,
    businessUnitId: BusinessUnitType.Hallmark,
    alertTitle: '',
    alertBody: '',
    toList: '',
    cCList: '',
    bCCList: '',
    parameters: []
  };
  public templateParamsData: { [key: string]: Object }[] = [];
  public unsubscribe$: Subject<void> = new Subject();
  get templateEmailTitle(): string {
    return "Email Template for Alert : " + this.subTitle;
  }
  get templateSmsTitle(): string {
    return "SMS Template for Alert : " + this.subTitle;
  }
  get templateOnScreenTitle(): string {
    return "OnScreen Template for Alert : " + this.subTitle;
  }
  private gridApi: any;
  private gridColumnApi: any;
  private isAlive = true;
  private filters: AlertsTemplateFilters = {};
  public title: string = "Alerts Template";
  public export$ = new Subject<ExportedFileType>();

  modules: any[] = [ServerSideRowModelModule, RowGroupingModule];
  rowModelType: any;
  serverSideInfiniteScroll: any;
  cacheBlockSize: any;
  pagination: boolean;
  paginationPageSize: number;
  columnDefs: any;
  filterText: string | undefined;
  frameworkComponents: any;
  sideBar: any;
  serverSideStoreType: any;
  maxBlocksInCache: any;
  defaultColDef: any;
  itemList: Array<AlertsTemplate> | undefined;
  get businessUnitControl(): AbstractControl {
    return this.businessForm.get('businessUnit') as AbstractControl;
  }

  get businessControl(): AbstractControl {
    return this.businessForm.get('business') as AbstractControl;
  }

  constructor(private actions$: Actions,
    private confirmService: ConfirmService,
    private store: Store) {
    super();
    store.dispatch(new SetHeaderState({ title: this.title, iconName: '' }));
    this.frameworkComponents = {
      buttonRenderer: ButtonRendererComponent,
    }
    this.rowModelType = 'serverSide';
    this.serverSideInfiniteScroll = true,
      this.pagination = true;
    this.paginationPageSize = this.pageSize,
      this.cacheBlockSize = this.pageSize;
    this.serverSideStoreType = 'partial';
    this.maxBlocksInCache = 2;
    this.columnDefs = [
      {
        field: 'alertId',
        hide: true
      },
      {
        header: 'Alert',
        field: 'alertTitle',
        filter: 'agTextColumnFilter',
        filterParams: {
          buttons: ['reset'],
          debounceMs: 1000,
          suppressAndOrCondition: true,
        }
      },
      {
        header: 'Status',
        field: 'status',
        filter: false
      },
      {
        headerName: 'Email Template',
        cellRenderer: 'buttonRenderer',
        cellRendererParams: {
          onClick: this.onEmailTemplateEdit.bind(this),
          label: 'Edit',
          suppressMovable: true,
          filter: false,
          sortable: false,
          menuTabs: []
        },
      },
      {
        headerName: 'SMS Template',
        cellRenderer: 'buttonRenderer',
        cellRendererParams: {
          onClick: this.onSmsTemplateEdit.bind(this),
          label: 'Edit',
          suppressMovable: true,
          filter: false,
          sortable: false,
          menuTabs: []
        },
      },
      {
        headerName: 'OnScreen Template',
        cellRenderer: 'buttonRenderer',
        cellRendererParams: {
          onClick: this.onScreenTemplateEdit.bind(this),
          label: 'Edit',
          suppressMovable: true,
          filter: false,
          sortable: false,
          menuTabs: []
        },
      },
      {
        headerName: 'Action',
        cellRenderer: 'buttonRenderer',
        cellRendererParams: {
          onClick: this.onRemove.bind(this),
          label: 'Delete'
        },
        pinned: 'right',
        suppressMovable: true,
        filter: false,
        sortable: false,
        menuTabs: []
      }
    ];

    this.defaultColDef = {
      flex: 1,
      minWidth: 120,
      resizable: true,
      sortable: true,
      filter: false
    };
  }
  ngOnDestroy(): void {
    this.isAlive = false;
  }

  ngOnInit(): void {
    this.businessForm = this.generateBusinessForm();
    this.onBusinessUnitValueChanged();

    const user = this.store.selectSnapshot(UserState.user);
    this.businessUnitControl.patchValue(user?.businessUnitType);
    if (user?.businessUnitType) {
      this.isBusinessFormDisabled = DISABLED_GROUP.includes(user?.businessUnitType);
      this.isBusinessFormDisabled && this.businessForm.disable();
    }
    if (user?.businessUnitType === BusinessUnitType.MSP) {
      const [Hallmark, ...rest] = this.businessUnits;
      this.businessUnits = rest;
    }
    this.businessControl.patchValue(this.isBusinessFormDisabled ? user?.businessUnitId : 0);
    this.actions$
      .pipe(
        takeWhile(() => this.isAlive)
      );
    this.bussinesData$.pipe(takeWhile(() => this.isAlive)).subscribe((data) => {

    });
    this.emailTemplateFormGroup = AlertsEmailTemplateFormComponent.createForm();
    this.smsTemplateFormGroup = AlertsSmsTemplateFromComponent.createForm();
    this.onScreenTemplateFormGroup = AlertsOnScreenTemplateFormComponent.createForm();
  }
  public onEmailTemplateEdit(data: any): void {
    this.alertTemplateType = AlertChannel[AlertChannel.Email];
    this.onEdit(data.rowData);
  }
  public onSmsTemplateEdit(data: any): void {
    this.alertTemplateType = AlertChannel[AlertChannel.SMS];
    this.onEdit(data.rowData);
  }
  public onScreenTemplateEdit(data: any): void {
    this.alertTemplateType = AlertChannel[AlertChannel.OnScreen];
    this.onEdit(data.rowData);
  }
  public onRemove(data: AlertsTemplate): void {
    this.confirmService
      .confirm(DELETE_RECORD_TEXT, {
        title: DELETE_RECORD_TITLE,
        okButtonLabel: 'Delete',
        okButtonClass: 'delete-button',
      })
      .subscribe((confirm) => {
        if (confirm && data.alertId) {
          // this.store.dispatch(new RemoveRole(data.id))
        }
      });
  }
  public onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.showLoadingOverlay();
    var datasource = this.createServerSideDatasource();
    console.log(datasource);
    params.api.setServerSideDatasource(datasource);
  }
  createServerSideDatasource() {
    let self = this;
    return {
      getRows: function (params: any) {
        setTimeout(() => {
          let postData = {
            pageNumber: params.request.endRow / self.paginationPageSize,
            pageSize: self.paginationPageSize,
            sortFields: params.request.sortModel
          };
          var filter: any;
          let jsonString = JSON.stringify(params.request.filterModel);
          if (jsonString != "{}") {
            var updatedJson = jsonString.replace("operator", "logicalOperator");
            filter = JSON.parse(updatedJson);
          }
          else filter = null;

          var sort = postData.sortFields.length > 0 ? postData.sortFields : null;
          self.dispatchNewPage(sort, filter);

          self.alertsTemplatePage$.pipe(takeUntil(self.unsubscribe$)).subscribe((data: any) => {
            if (data != undefined) {
              self.itemList = data;
              params.successCallback(self.itemList, data.length || 1);
            }
          });
        }, 500);
      }
    }
  }
  private dispatchNewPage(sortModel: any = null, filterModel: any = null): void {
    this.store.dispatch(new GetAlertsTemplatePage(this.businessUnitControl.value, this.currentPage, this.pageSize, sortModel, filterModel, this.filters));
  }
  private dispatchEditAlertTemplate(alertId: number, alertChannelId: AlertChannel): void {
    this.store.dispatch(new GetTemplateByAlertId(alertId, alertChannelId));
  }
  onPageSizeChanged(event: any) {
    this.cacheBlockSize = Number(event.value.toLowerCase().replace("rows", ""));
    this.paginationPageSize = Number(event.value.toLowerCase().replace("rows", ""));
    if (this.gridApi != null) {
      this.gridApi.paginationSetPageSize(Number(event.value.toLowerCase().replace("rows", "")));
      this.gridApi.gridOptionsWrapper.setProperty('cacheBlockSize', Number(event.value.toLowerCase().replace("rows", "")));
      var datasource = this.createServerSideDatasource();
      this.gridApi.setServerSideDatasource(datasource);
    }
  }
  public onEdit({ index, column, foreignKeyData, alertId, ...alertsTemplate }: AlertsTemplate & { index: string; column: unknown; foreignKeyData: unknown }): void {
    this.subTitle = alertsTemplate.alertTitle;
    if (this.alertTemplateType === AlertChannel[AlertChannel.Email]) {
      this.SetEditData(alertId, AlertChannel.Email);
      this.emailTemplateForm.rteCreated();
      this.store.dispatch(new ShowEmailSideDialog(true));
    }
    else if (this.alertTemplateType === AlertChannel[AlertChannel.SMS]) {
      this.SetEditData(alertId, AlertChannel.SMS);
      this.smsTemplateForm.rteCreated();
      this.store.dispatch(new ShowSmsSideDialog(true));
    }
    else if (this.alertTemplateType === AlertChannel[AlertChannel.OnScreen]) {
      this.SetEditData(alertId, AlertChannel.OnScreen);
      this.onScreenTemplateForm.rteCreated();
      this.store.dispatch(new ShowOnScreenSideDialog(true));
    }

  }
  public onEmailTemplateAddCancel(): void {
    this.emailTemplateCloseDialog();
  }
  public onSmsTemplateAddCancel(): void {
    this.smsTemplateCloseDialog();
  }
  public onScreenTemplateAddCancel(): void {
    this.onScreenTemplateCloseDialog();
  }

  public onEmailTemplateSave(): void {
    this.emailTemplateFormGroup.markAllAsTouched();
    if (this.emailTemplateFormGroup.valid && this.emailTemplateFormGroup.errors == null) {
      const formValues = this.emailTemplateFormGroup.getRawValue();
      const emailTemplateDto: EditAlertsTemplateRequest = {
        id: this.editAlertTemplateData.id,
        alertBody: formValues.alertBody,
        alertChannel: this.editAlertTemplateData.alertChannel,
        alertTitle: formValues.alertTitle,
        toList: this.editAlertTemplateData.toList == undefined ? '' : this.editAlertTemplateData.toList,
        cCList: this.editAlertTemplateData.cCList == undefined ? '' : this.editAlertTemplateData.cCList,
        bCCList: this.editAlertTemplateData.bCCList == undefined ? '' : this.editAlertTemplateData.bCCList
      };
      this.store.dispatch(new SaveTemplateByAlertId(emailTemplateDto));
      this.emailTemplateCloseDialog();
      this.store.dispatch(new ShowToast(MessageTypes.Success, RECORD_MODIFIED));
    }
  }
  public onSmsTemplateSave(): void {
    this.smsTemplateFormGroup.markAllAsTouched();
    if (this.smsTemplateFormGroup.valid && this.smsTemplateFormGroup.errors == null) {
      const formValues = this.smsTemplateFormGroup.getRawValue();
      const smsTemplateDto: EditAlertsTemplateRequest = {
        id: this.editAlertTemplateData.id,
        alertBody: formValues.alertBody,
        alertChannel: this.editAlertTemplateData.alertChannel,
        alertTitle: this.editAlertTemplateData.alertTitle,
        toList: this.editAlertTemplateData.toList == undefined ? '' : this.editAlertTemplateData.toList,
        cCList: this.editAlertTemplateData.cCList == undefined ? '' : this.editAlertTemplateData.cCList,
        bCCList: this.editAlertTemplateData.bCCList == undefined ? '' : this.editAlertTemplateData.bCCList
      };
      this.store.dispatch(new SaveTemplateByAlertId(smsTemplateDto));
      this.smsTemplateCloseDialog();
      this.store.dispatch(new ShowToast(MessageTypes.Success, RECORD_MODIFIED));
    }

  }
  public onScreenTemplateSave(): void {
    this.onScreenTemplateFormGroup.markAllAsTouched();
    if (this.onScreenTemplateFormGroup.valid && this.onScreenTemplateFormGroup.errors == null) {
      const formValues = this.onScreenTemplateFormGroup.getRawValue();
      const onSCreenTemplateDto: EditAlertsTemplateRequest = {
        id: this.editAlertTemplateData.id,
        alertBody: formValues.alertBody,
        alertChannel: this.editAlertTemplateData.alertChannel,
        alertTitle: formValues.alertTitle,
        toList: this.editAlertTemplateData.toList == undefined ? '' : this.editAlertTemplateData.toList,
        cCList: this.editAlertTemplateData.cCList == undefined ? '' : this.editAlertTemplateData.cCList,
        bCCList: this.editAlertTemplateData.bCCList == undefined ? '' : this.editAlertTemplateData.bCCList
      };
      this.store.dispatch(new SaveTemplateByAlertId(onSCreenTemplateDto));
      this.onScreenTemplateCloseDialog();
      this.store.dispatch(new ShowToast(MessageTypes.Success, RECORD_MODIFIED));
    }

  }
  private emailTemplateCloseDialog(): void {
    this.store.dispatch(new ShowEmailSideDialog(false));
  }
  private smsTemplateCloseDialog(): void {
    this.store.dispatch(new ShowSmsSideDialog(false));
  }
  private onScreenTemplateCloseDialog(): void {
    this.store.dispatch(new ShowOnScreenSideDialog(false));
  }
  private SetEditData(alertId: number, alertChannel: AlertChannel): void {
    this.dispatchEditAlertTemplate(alertId, alertChannel);

    this.editAlertsTemplate$.pipe(takeUntil(this.unsubscribe$)).subscribe((data: any) => {
      this.templateParamsData = [];
      if (data != undefined) {
        this.editAlertTemplateData = data;
        if (data.parameters != undefined) {
          data.parameters.forEach((paramter: string) => {
            this.templateParamsData.push({
              text: paramter,
              id: paramter,
              "htmlAttributes": { draggable: true }
            })
          });
        }
      }
    });
  }
  private generateBusinessForm(): FormGroup {
    return new FormGroup({
      businessUnit: new FormControl(),
      business: new FormControl(0),
    });
  }
  private onBusinessUnitValueChanged(): void {
    this.businessUnitControl.valueChanges.pipe(takeWhile(() => this.isAlive)).subscribe((value) => {
      this.store.dispatch(new GetBusinessByUnitType(value));

      if (!this.isBusinessFormDisabled) {
        this.businessControl.patchValue(0);
      }
    });
  }

}
