import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HtmlEditorService, ImageService, LinkService, RichTextEditorComponent, TableService, ToolbarService, ToolbarType } from '@syncfusion/ej2-angular-richtexteditor';
import { Observable, Subject, takeWhile, filter } from 'rxjs';
import { BusinessUnit } from '@shared/models/business-unit.model';
import { BUSINESS_DATA_FIELDS, DISABLED_GROUP, OPRION_FIELDS, toolsRichTextEditor, User_DATA_FIELDS } from '../../alerts.constants';
import { Actions, Select, Store } from '@ngxs/store';
import { GetBusinessByUnitType, GetAllUsersPage } from 'src/app/security/store/security.actions';
import { GetUserSubscriptionPage } from '@admin/store/alerts.actions';
import { AbstractGridConfigurationComponent } from '@shared/components/abstract-grid-configuration/abstract-grid-configuration.component';
import { UserState } from 'src/app/store/user.state';
import { FileInfo, SelectedEventArgs, UploaderComponent } from '@syncfusion/ej2-angular-inputs';
import { BusinessUnitType } from '@shared/enums/business-unit-type';
import { SecurityState } from 'src/app/security/store/security.state';
import { User, UsersPage } from '@shared/models/user.model';
import { AppState } from 'src/app/store/app.state';
import { AlertsState } from '@admin/store/alerts.state';
import { UserSubscriptionFilters, UserSubscriptionPage } from '@shared/models/user-subscription.model';
import { BUSINESS_UNITS_VALUES } from '@shared/constants/business-unit-type-list';
import { FieldSettingsModel } from '@syncfusion/ej2-angular-dropdowns';
import { AgencyUserType, OrganizationUserType } from '@admin/alerts/group-email.enum';

@Component({
  selector: 'app-send-group-email',
  templateUrl: './send-group-email.component.html',
  styleUrls: ['./send-group-email.component.scss'],
  providers: [ToolbarService, LinkService, ImageService, HtmlEditorService, TableService]

})
export class SendGroupEmailComponent extends AbstractGridConfigurationComponent implements OnInit, AfterViewInit, OnDestroy {
  public tools = toolsRichTextEditor;
  public form: FormGroup;
  @Input() groupEmailTemplateForm: FormGroup;
  @Input() title: string;
  @Input() emailSubject: string;
  @Input() emailBody: string;
  @Input() emailTo: string | null;
  @Input() emailCc: string | null;
  @Input() isSend: boolean = true;
  override selectedItems: any;

  @Output() formCancelClicked = new EventEmitter();
  @Output() formSaveClicked = new EventEmitter();

  @Select(SecurityState.bussinesData)
  public businessData$: Observable<BusinessUnit[]>;

  @Select(SecurityState.allUsersPage)
  public userData$: Observable<UsersPage>;

  @Select(AlertsState.UserSubscriptionPage)
  public userSubscriptionPage$: Observable<UserSubscriptionPage>;

  @Select(AlertsState.UpdateUserSubscription)
  public updateUserSubscription$: Observable<boolean>;

  @Select(AppState.isDarkTheme)
  isDarkTheme$: Observable<boolean>;

  @Select(AppState.shouldDisableUserDropDown)
  public shouldDisableUserDropDown$: Observable<boolean>;

  @ViewChild('RTEGroupEmail') public rteObj: RichTextEditorComponent;
  private listboxEle: HTMLElement;
  private editArea: HTMLElement;
  public userData: User[];
  public range: Range = new Range();
  public isBusinessFormDisabled = false;
  public businessUnits = BUSINESS_UNITS_VALUES;
  public optionFields = OPRION_FIELDS;
  public businessDataFields = BUSINESS_DATA_FIELDS;
  public userDataFields = User_DATA_FIELDS;
  public allOption:string="All";
  public placeholderValue: string = "Select User";
  public readonly maxFileSize = 2000000; // 2 mb
  private isAlive: boolean = true;
  defaultBusinessValue: any;
  defaultUserValue: any;
  defaultValue: number;
  defaultUserType: number = 1;
  public userGuid: string = "";
  private filters: UserSubscriptionFilters = {};
  public unsubscribe$: Subject<void> = new Subject();
  public orgStructureData: any;
  public dropElement: HTMLElement;
  public readonly allowedExtensions: string = '.pdf, .doc, .docx, .jpg, .jpeg, .png';
  public uploaderErrorMessageElement: HTMLElement;
  public file: any;
  public files: File[] = [];
  public commonFields: FieldSettingsModel = { text: 'name', value: 'value' };
  public userType: any = [];
  public filteredUserType: any = [];
  @ViewChild('filesUploaderGroupEmail') uploadObj: UploaderComponent;

  constructor(private actions$: Actions,
    private store: Store, private fb: FormBuilder) {

    super();
  }
  get businessUnitControl(): AbstractControl {
    return this.groupEmailTemplateForm.get('businessUnit') as AbstractControl;
  }

  get businessControl(): AbstractControl {
    return this.groupEmailTemplateForm.get('business') as AbstractControl;
  }
  get usersControl(): AbstractControl {

    return this.groupEmailTemplateForm.get('user') as AbstractControl;
  }
  get richTextControl(): AbstractControl {

    return this.groupEmailTemplateForm.get('emailBody') as AbstractControl;
  }
  private dispatchNewPage(user: any, sortModel: any = null, filterModel: any = null): void {
    const { businessUnit } = this.groupEmailTemplateForm?.getRawValue();
    if (user != 0 &&businessUnit!=null) {
      this.userGuid = user;
      this.store.dispatch(new GetUserSubscriptionPage(businessUnit || null, user, this.currentPage, this.pageSize, sortModel, filterModel, this.filters));
    }
  }

  receivedData(data: any) {

  }
  ngOnInit(): void {
    this.onBusinessUnitValueChanged();
    this.onBusinessValueChanged();
    this.onUserValueChanged();
    const user = this.store.selectSnapshot(UserState.user);
    this.businessUnitControl.patchValue(user?.businessUnitType);
    if (user?.businessUnitType) {
      this.isBusinessFormDisabled = DISABLED_GROUP.includes(user?.businessUnitType);
     // this.isBusinessFormDisabled && this.groupEmailTemplateForm.disable();
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

    this.businessData$.pipe(takeWhile(() => this.isAlive)).subscribe((data) => {
      if (data != undefined) {
        this.defaultBusinessValue = data[0]?.id;
        if (!this.isBusinessFormDisabled) {
          this.defaultValue = data[0]?.id;
        }
      }
    });
    this.userData$.pipe(takeWhile(() => this.isAlive)).subscribe((data) => {
      if (data != undefined) {
        this.userData = data.items;
     
      }
    });

    var agencyUserTypes = Object.keys(AgencyUserType);
    agencyUserTypes.forEach((v, i) => {
      if(i > (agencyUserTypes.length / 2) - 1) {
        var val = parseInt(agencyUserTypes[i - (agencyUserTypes.length / 2)]);
        this.userType.push({ name: v, value: val, isAgency: true})
      }
    });

    var orgUserTypes = Object.keys(OrganizationUserType);
    orgUserTypes.forEach((v, i) => {
      if(i > (orgUserTypes.length / 2) - 1) {
        var val = parseInt(orgUserTypes[i - (orgUserTypes.length / 2)]);
        this.userType.push({ name: v, value: val, isAgency: false})
      }
    });

    console.log(this.userType);
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.isAlive = false;
  }
  private dispatchUserPage(businessUnitIds: number[]) {
    if(this.businessUnitControl.value!=null)
    {
    this.store.dispatch(new GetAllUsersPage(this.businessUnitControl.value, businessUnitIds, this.currentPage, this.pageSize, null, null, true));
    }  
  }

  public onFileSelectedGroup(event: SelectedEventArgs): void {
    if (event.filesData[0].statusCode !== '1') {
      this.addFilesValidationMessage(event.filesData[0]);
    }
    else {
      this.files = [];
      this.file = event.filesData[0];
      this.files.push(this.file.rawFile);
      this.groupEmailTemplateForm.controls['fileUpload'].setValue(this.file.rawFile);
    }
  }

  public browseGroupEmail(): void {
    document
      .getElementById('group-attachment-files')
      ?.getElementsByClassName('e-file-select-wrap')[0]
      ?.querySelector('button')
      ?.click();
  }

  private addFilesValidationMessage(file: FileInfo) {
    requestAnimationFrame(() => {
      this.uploaderErrorMessageElement = document.getElementsByClassName('e-validation-fails')[0] as HTMLElement;
      if (this.uploaderErrorMessageElement) {
        this.uploaderErrorMessageElement.innerText =
          file.size > this.maxFileSize
            ? 'The file exceeds the limitation, max allowed 2 MB.'
            : 'The file should be in pdf, doc, docx, jpg, jpeg, png format.';
      }
    });
  }
  
  private onBusinessUnitValueChanged(): void {

    this.businessUnitControl.valueChanges.pipe(takeWhile(() => this.isAlive)).subscribe((value) => {
      if (this.isSend == true&&value!=null) {
        this.userData = [];
        this.dispatchNewPage(null);

        this.store.dispatch(new GetBusinessByUnitType(value));
        console.log(value);
        this.filteredUserType = [];
        if(value == 3) {
          this.filteredUserType = this.userType.filter((i:any)=>i.isAgency == false);
          //.map((j:any) => {j.name, j.value});
        }
        if(value == 4) {
          this.filteredUserType = this.userType.filter((i:any)=>i.isAgency == true);
          //.map((j:any) => {j.name, j.value});
        }
        console.log(this.filteredUserType);
        if (value == 1) {
          this.dispatchUserPage([]);
        }
        else {
          this.businessData$.pipe(takeWhile(() => this.isAlive)).subscribe((data) => {
            if (!this.isBusinessFormDisabled && data.length > 0) {
              if (this.groupEmailTemplateForm.controls['business'].value != data[0].id) {
                this.groupEmailTemplateForm.controls['business'].setValue(data[0].id);
              }
            }
          });

          this.userData$.pipe(takeWhile(() => this.isAlive)).subscribe((data) => {
           
          });
        }
      }
    });
  }
  private onBusinessValueChanged(): void {
    this.businessControl.valueChanges.pipe(takeWhile(() => this.isAlive)).subscribe((value) => {
      if (this.isSend == true) {
      this.userData = [];
      this.ResetForm();
      this.dispatchNewPage(null);
      let businessUnitIds = [];
      if (value != 0 && value != null) {
        businessUnitIds.push(this.businessControl.value);        
      }
      this.dispatchUserPage(businessUnitIds);
    }

    });
  }
  private onUserValueChanged(): void {
    this.usersControl.valueChanges.pipe(takeWhile(() => this.isAlive)).subscribe((value) => {
      if (this.isSend == true && value!=null && value!=undefined) {
      this.emailTo=this.userData?.filter(item => value.indexOf(item.id) !== -1)?.map(item=>item.email)?.join(", ")
      }
    });
  }

  rteCreated(): void {
    this.rteObj.toolbarSettings.type = ToolbarType.Scrollable;
    this.rteObj.toolbarSettings.enableFloating = true;
    this.rteObj.height = '300px';
  }
  disableControls(isSend:boolean):void
  {
    let ele=document.getElementById("richTextEditorDiv") as HTMLElement;
    if(isSend)
    {
      this.businessControl?.enable();
      this.businessUnitControl?.enable();
      this.groupEmailTemplateForm.controls['emailTo'].disable();
      this.groupEmailTemplateForm.controls['emailCc'].enable();
      this.groupEmailTemplateForm.controls['emailSubject'].enable();
      this.groupEmailTemplateForm.controls['user'].enable();
      this.rteObj.enabled=true;      
      ele.className="rich-text-container-edit";
    }
    else{
    this.businessControl?.disable();
    this.businessUnitControl?.disable();
    this.groupEmailTemplateForm.controls['emailTo'].disable();
      this.groupEmailTemplateForm.controls['emailCc'].disable();
      this.groupEmailTemplateForm.controls['emailSubject'].disable();
      this.groupEmailTemplateForm.controls['user'].disable();
    this.rteObj.enabled=false;    
    ele.className="rich-text-container-disable";
    }
  }
  
  static createForm(): FormGroup {
    return new FormGroup({
      businessUnit: new FormControl(),
      business: new FormControl(0),
      user: new FormControl([]),
      emailCc: new FormControl('', [Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]),
      emailTo: new FormControl('', [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]),
      emailSubject: new FormControl('', [Validators.required]),
      emailBody: new FormControl('', [Validators.required]),
      fileUpload: new FormControl(null),
    });
  }

  onFormCancelClick(): void {
    this.formCancelClicked.emit();
  }
  onFormSaveClick(): void {

    this.formSaveClicked.emit();
  }
  private ResetForm(): void {
    this.groupEmailTemplateForm.controls['emailTo'].setValue('');
      this.groupEmailTemplateForm.controls['emailCc'].setValue('');
      this.groupEmailTemplateForm.controls['emailSubject'].setValue('');  
      this.groupEmailTemplateForm.controls['emailBody'].setValue('');  
    this.groupEmailTemplateForm.controls['user'].setValue([]);

  }
  
  ngAfterViewInit() {
    
    setTimeout(() => {
      this.dropElement = document.getElementById('files-droparea') as HTMLElement;
    }, 4000);
    
  }
}
