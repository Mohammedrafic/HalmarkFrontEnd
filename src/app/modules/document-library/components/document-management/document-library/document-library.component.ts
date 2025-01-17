import { GetDocumentsByCognitiveSearch, GetSharedDocumentInformation, GetSharedDocumentsByCognitiveSearch } from '../../../store/actions/document-library.actions';
import { CellClickedEvent, ColDef, FilterChangedEvent, GridApi, GridOptions, GridReadyEvent } from '@ag-grid-community/core';
import { DatePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Actions, ofActionDispatched, Select, Store } from '@ngxs/store';
import { AbstractGridConfigurationComponent } from '@shared/components/abstract-grid-configuration/abstract-grid-configuration.component';
import { debounceTime, distinctUntilChanged, map, Observable, Subject, take, takeUntil, takeWhile } from 'rxjs';
import { SpecialProjectMessages } from '@organization-management/specialproject/constants/specialprojects.constant';
import { ColumnDefinitionModel } from '@shared/components/grid/models';
import { SetHeaderState, ShowDocPreviewSideDialog, ShowSideDialog, ShowToast } from '../../../../../store/app.actions';
import {
  BUSSINES_DATA_FIELDS,
  DocumentLibraryColumnsDefinition,
  DocumentLibraryColumnsAgencyDefinition,
  UNIT_FIELDS
} from '../../../constants/documents.constant';
import {
  AssociateAgencyDto,
  DeleteDocumentsFilter,
  DocumentFolder,
  DocumentLibraryDto,
  Documents,
  DocumentsFilter,
  DocumentsLibraryPage,
  DocumentTags,
  DocumentTypeFilter,
  DocumentTypes,
  DownloadDocumentDetail,
  DownloadDocumentDetailFilter,
  LocationsByRegionsFilter,
  NodeItem,
  PreviewDocumentDetailFilter,
  regionFilter,
  SharedDocumentInformation,
  ShareDocumentDto,
  ShareDocumentInfoFilter,
  ShareDocumentInfoPage,
  ShareDocumentsFilter,
  ShareOrganizationsData,
  UnShareDocumentsFilter
} from '../../../store/model/document-library.model';
import { CustomNoRowsOverlayComponent } from '@shared/components/overlay/custom-no-rows-overlay/custom-no-rows-overlay.component';
import { DocumentLibraryState } from '../../../store/state/document-library.state';
import {
  DeletDocuments,
  GetDocumentById,
  GetDocumentDownloadDeatils,
  GetDocumentPreviewDeatils,
  GetDocuments,
  GetDocumentsSelectedNode,
  GetDocumentTypes,
  GetFoldersTree,
  GetLocationsByRegions,
  GetRegionsByOrganizations,
  GetShareAssociateAgencies,
  GetSharedDocuments,
  GetShareOrganizationsDtata,
  IsAddNewFolder,
  IsDeleteEmptyFolder,
  SaveDocumentFolder,
  SaveDocuments,
  SelectedBusinessType,
  ShareDocuments,
  UnShareDocuments
} from '../../../store/actions/document-library.actions';
import { ItemModel } from '@syncfusion/ej2-splitbuttons/src/common/common-model';
import { documentsColumnField, FileType, FormControlNames, FormDailogTitle, MoreMenuType, StatusEnum } from '../../../enums/documents.enum';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserState } from '../../../../../store/user.state';
import { SecurityState } from '../../../../../security/store/security.state';
import { BusinessUnit } from '@shared/models/business-unit.model';
import { Location } from '@shared/models/location.model';
import { Region } from '@shared/models/region.model';
import { GetBusinessByUnitType } from '../../../../../security/store/security.actions';
import { BusinessUnitType } from '@shared/enums/business-unit-type';
import { DOCUMENT_NAME_PATTERN, DELETE_RECORD_TEXT, DELETE_RECORD_TITLE, GRID_CONFIG } from '@shared/constants';
import { ConfirmService } from '@shared/services/confirm.service';
import { MessageTypes } from '@shared/enums/message-types';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  MagnificationService,
  NavigationService,
  PdfViewerComponent,
  TextSelectionService,
  ToolbarService
} from '@syncfusion/ej2-angular-pdfviewer';
import { DocumentEditorComponent, EditorHistoryService, EditorService, SearchService} from '@syncfusion/ej2-angular-documenteditor';
import { User } from '@shared/models/user-managment-page.model';
import { BUSINESS_UNITS_VALUES } from '@shared/constants/business-unit-type-list';
import { AgGridAngular } from '@ag-grid-community/angular';
import { SearchComponent } from '@shared/components/search/search.component';

@Component({
  selector: 'app-document-library',
  templateUrl: './document-library.component.html',
  styleUrls: ['./document-library.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToolbarService, NavigationService, TextSelectionService, MagnificationService, EditorHistoryService, EditorService, SearchService]
})
export class DocumentLibraryComponent extends AbstractGridConfigurationComponent implements OnInit, OnDestroy, AfterViewInit {

  public businessFilterForm: FormGroup;
  public user: User;
  get filterBusinessUnitControl(): AbstractControl {
    return this.businessFilterForm.get('filterBusinessUnit') as AbstractControl;
  }
  get filterBbusinessControl(): AbstractControl {
    return this.businessFilterForm.get('filterBusiness') as AbstractControl;
  }
  public readonly gridConfig: typeof GRID_CONFIG = GRID_CONFIG;
  public unitFields = UNIT_FIELDS;
  public businessUnits = BUSINESS_UNITS_VALUES;
  public businessUnitsDataset : Array<{id: number;text: string;}> = [];
  public bussinesDataFields = BUSSINES_DATA_FIELDS;
  private isAlive = true;
  public isBusinessFormDisabled = false;
  public title: string = "Documents";
  public isHalmarkSelected: boolean = false;
  private unsubscribe$: Subject<void> = new Subject();
  public selectedNodeText: string = '';
  public previousFolderId: number = 0;
  selectedDocumentNode: NodeItem | null;
  filterSelecetdBusinesType: number;
  filterSelectedBusinesUnitId: number | null;
  public isIncludeSharedWithMe: boolean = false;
  public dialogWidth: string = '434px';
  public previewTitle: string = "Document Preview";
  public isPdf: boolean = false;
  public previewUrl: SafeResourceUrl | null;
  public downloadedFileName: string = '';
  public service: string =
    'https://ej2services.syncfusion.com/production/web-services/api/pdfviewer';
  public pdfDocumentPath: string = '';
  public documentLibraryform: FormGroup;
  public isAddNewFolder: boolean = false;
  public isUpload: boolean = false;
  public isShowSharedWith: boolean = false;
  public isSharedByMe: boolean = false;
  public formDailogTitle: string = '';
  public today = new Date();
  public startDate: any = new Date();
  public selectedFile: Blob | null;
  public isEditDocument: boolean = false;
  public documentId: number = 0;
  public isShare: boolean = false;
  public shareDocumentIds: number[] = [];
  public regionIdControl: AbstractControl;
  public locationIdControl: AbstractControl;
  public isWordDoc: boolean = false;
  public isImage: boolean = false;
  public isExcel: boolean = false;
  public isAgency: boolean = false;
  public halmarkSwitch: boolean = false;
  public agencySwitch: boolean = false;
  public organizationSwitch: boolean = false;
  public businessUnitTypes = BusinessUnitType;
  public AssociateAgencyData: AssociateAgencyDto[] = [];
  public ShareOrganizationsData: ShareOrganizationsData[] = [];
  documentHeight: number;
  documentWidth: string;
  fileAsBase64: string;
  public allowedExtensions: string = '.pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png';
  public isSharedFolderClick: boolean = false;
  public totalRecordsCount: number = 0;
  @ViewChild('sharedWith') sharedWith:AgGridAngular
  @ViewChild('searchDocument') search: SearchComponent;
  public gridApi!: GridApi;
  public rowData: DocumentLibraryDto[] = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  public editMenuActiveItems: ItemModel[] = [
    { text: MoreMenuType[0], id: '0' },
    { text: MoreMenuType[1], id: '1' },
  ];
  public editMenuItems: ItemModel[] = [
    { text: MoreMenuType[0], id: '0' },
    { text: MoreMenuType[1], id: '1' },
    { text: MoreMenuType[2], id: '2' }
  ];
  public editMoreMenuItems: ItemModel[] = [
    { text: MoreMenuType[0], id: '0' },
    { text: MoreMenuType[1], id: '1' },
    { text: MoreMenuType[2], id: '2' },
    { text: MoreMenuType[3], id: '3' }
  ];

  public statusItems: ItemModel[] = [
    { text: StatusEnum[0], id: '1' },
    { text: StatusEnum[1], id: '0' }
  ];

  public actionCellrenderParams: any = {
    editMenuITems: this.editMenuItems,
    editMoreMenuITems: this.editMoreMenuItems,
    editMenuActiveItems: this.editMenuActiveItems,
    select: (event: any, params: DocumentLibraryDto) => {
      this.menuOptionSelected(event, params)
    },
    handleOnDownLoad: (params: DocumentLibraryDto) => {
      this.downloadDocument(params);
    }
  }
  public sharedDocumentInformation:BusinessUnit[]=[];
  public allOption: string = "All";
  public optionFields = {
    text: 'name',
    value: 'id',
  };
  public statusFields = {
    text: 'text',
    value: 'id',
  };
  public agencyFields = {
    text: 'agencyName',
    value: 'agencyId',
  };

  public columnDefs:ColDef[] = [
    { field: 'name', headerName:"Shared With",width:400},
  ];
 @ViewChild('pdfViewer', { static: true })
  public pdfViewer: PdfViewerComponent;

  @ViewChild('wordDocPreview', { static: true })
  public documentEditor!: DocumentEditorComponent;


  public searchText: string = "";
  editLocationIds:any = [];

  @Select(SecurityState.businessUserData)
  public businessUserData$: Observable<(type: number) => BusinessUnit[]>;
  @Select(DocumentLibraryState.documentsPage)
  documentsPage$: Observable<DocumentsLibraryPage>;
  @Select(DocumentLibraryState.shareDocumentInfoPage)
  shareDocumentInfoPage$: Observable<ShareDocumentInfoPage>;
  @Select(DocumentLibraryState.documentsTypes)
  documentsTypes$: Observable<DocumentTypes[]>;
  @Select(DocumentLibraryState.documentsTags)
  documentsTags$: Observable<DocumentTags[]>;
  @Select(DocumentLibraryState.documentDownloadDetail)
  documentDownloadDetail$: Observable<DownloadDocumentDetail>;
  @Select(DocumentLibraryState.documentLibraryDto)
  documentLibraryDto$: Observable<DocumentLibraryDto>;
  @Select(DocumentLibraryState.regions)
  public regions$: Observable<Region[]>;
  selectedRegions: Region[];
  @Select(DocumentLibraryState.locations)
  public locations$: Observable<Location[]>;
  selectedLocations: Location[];
  @Select(DocumentLibraryState.savedDocumentLibraryDto)
  savedDocumentLibraryDto$: Observable<DocumentLibraryDto>;
  @Select(DocumentLibraryState.getShareAssociateAgencies)
  public shareAssociateAgencies$: Observable<AssociateAgencyDto[]>;
  @Select(DocumentLibraryState.getShareOrganizationsData)
  public shareOrganizationsData$: Observable<ShareOrganizationsData[]>;
  @Select(DocumentLibraryState.getSharedDocumentInformation)
  public sharedDocumentInformation$: Observable<BusinessUnit[]>;

  public IsSearchDone:boolean = false;
  allAgencies:boolean = false;
  allOrgnizations:boolean = false;
  currentDocumentData :DocumentLibraryDto;

  constructor(private store: Store, private datePipe: DatePipe,
    private changeDetectorRef: ChangeDetectorRef,
    private confirmService: ConfirmService,
    private sanitizer: DomSanitizer,
    private action$: Actions) {
    super();

  }

  ngOnInit(): void {
    this.store.dispatch(new SetHeaderState({ title: 'Documents', iconName: 'folder' }));
    this.createForm();
    this.businessFilterForm = this.generateFilterBusinessForm();
    this.onFilterBusinessUnitValueChanged();
    this.user = this.store.selectSnapshot(UserState.user) as User;
    if (this.user?.businessUnitType == BusinessUnitType.Hallmark) {
      this.isHalmarkSelected = true;
    }
    this.filterBusinessUnitControl.patchValue(this.user?.businessUnitType);
    this.store.dispatch(new GetShareAssociateAgencies());
    this.store.dispatch(new GetShareOrganizationsDtata());
    this.action$.pipe(ofActionDispatched(IsAddNewFolder), takeUntil(this.unsubscribe$)).subscribe((payload) => {
      if (payload.payload != undefined) {
        this.isAddNewFolder = payload.payload;
        if (this.isAddNewFolder) {
          this.addRemoveFormcontrols();
          this.dialogWidth = '434px';
          this.formDailogTitle = FormDailogTitle.AddNewFolder;
          this.changeDetectorRef.markForCheck();
          this.store.dispatch(new ShowSideDialog(true));
        }
        else {
          this.documentLibraryform.reset();
          this.isAddNewFolder = false;
          this.isUpload = false;
          this.isEditDocument = false;
          this.selectedFile = null;
          this.isShare = false;
          this.previousFolderId = -2;
          this.changeDetectorRef.markForCheck();
          this.store.dispatch(new ShowSideDialog(false));
        }
      }
    });

    this.locations$.pipe(takeUntil(this.unsubscribe$),distinctUntilChanged()).subscribe((locations: any) => {
      if(locations != null && locations.length > 0){
        if(this.editLocationIds.length > 0){
          this.documentLibraryform.get(FormControlNames.LocationIds)?.setValue(this.editLocationIds);
          this.changeDetectorRef.markForCheck();
        }
        const selectedLoactions = this.documentLibraryform.get(FormControlNames.LocationIds)?.value;
        if (selectedLoactions != null && selectedLoactions.length > 0) {
          let difference = locations.filter((x:any) => selectedLoactions.includes(x.id));
          if(difference.length === 0){
            this.documentLibraryform.get(FormControlNames.LocationIds)?.setValue(null);
          }
        }
      }else{
        this.documentLibraryform.get(FormControlNames.LocationIds)?.setValue(null);
      }
   });

    this.action$.pipe(ofActionDispatched(GetDocumentsSelectedNode), takeUntil(this.unsubscribe$)).subscribe((payload) => {
      this.selectedNodeText = '';
      this.isSharedFolderClick = false;
      if (payload.payload) {
        if (this.previousFolderId != payload.payload.id) {
          this.selectedNodeText = '';
          this.previousFolderId = payload.payload.id;
          this.selectedDocumentNode = payload.payload;
          this.gridApi?.setRowData([]);
          if (this.selectedDocumentNode?.text != undefined) {
            this.selectedNodeText = (this.selectedDocumentNode?.fileType != undefined && this.selectedDocumentNode?.fileType == 'folder') ? this.selectedDocumentNode?.text : '';
            setTimeout(() => {
              if (this.selectedDocumentNode?.id != -1 && this.selectedDocumentNode?.parentID != -1)
              {
                if(this.searchText.length>=2){
                  const businessUnitId = this.businessFilterForm.get('filterBusiness')?.value
                  const businessUnitType = this.businessFilterForm.get('filterBusinessUnit')?.value
                  let folderId = this.selectedDocumentNode?.fileType == FileType.Folder ? (this.selectedDocumentNode?.id != undefined ? this.selectedDocumentNode?.id : null) : null;
                  this.store.dispatch(new GetDocumentsByCognitiveSearch(this.searchText, businessUnitType, businessUnitId, folderId));
                }
                else
                this.getDocuments(this.filterSelectedBusinesUnitId);
              }
              else if (this.selectedDocumentNode?.id == -1 || this.selectedDocumentNode.parentID == -1) {
                this.isSharedFolderClick = true;
                this.store.dispatch(new IsDeleteEmptyFolder(false));
                if(this.searchText.length>=2){
                  const businessUnitId = this.businessFilterForm.get('filterBusiness')?.value
                  const businessUnitType = this.businessFilterForm.get('filterBusinessUnit')?.value
                  let folderId = this.selectedDocumentNode?.fileType == FileType.Folder ? (this.selectedDocumentNode?.id != undefined ? this.selectedDocumentNode?.id : null) : null;
                  this.store.dispatch(new GetSharedDocumentsByCognitiveSearch(this.searchText, businessUnitType, businessUnitId, folderId));
                }else{
                  this.getSharedDocuments(this.filterSelectedBusinesUnitId);
                }
              }
            }, 1000);
          }
          else {
            if (payload.payload.id = 0)
              this.selectedNodeText = 'Documents';
          }
        }
        this.changeDetectorRef.markForCheck();
      }

    });

    if (this.user?.businessUnitType === BusinessUnitType.MSP) {
      const [Hallmark, ...rest] = this.businessUnits;
      this.businessUnitsDataset = rest;
    }
    if (this.user?.businessUnitType === BusinessUnitType.Organization || this.user?.businessUnitType === BusinessUnitType.Agency) {
      this.businessFilterForm.disable();
      this.filterBbusinessControl.patchValue(this.user?.businessUnitId);
    }
    this.skipBusinessUnit();
      this.sharedDocumentInformation$.pipe(takeUntil(this.unsubscribe$))
          .subscribe((data: BusinessUnit[]) => {
            this.sharedDocumentInformation = data;
            if(data != null && data.length>0){
              if(data.length == 1 && data[0].id === -1 && data[0].name === 'All'){
                this.isShowSharedWith = false;
                if(this.agencySwitch) {
                    this.allAgencies = true;
                    this.documentLibraryform.get(FormControlNames.AllAgencies)?.setValue(true);
                }
                else if(this.organizationSwitch){
                    this.allOrgnizations = true;
                    this.documentLibraryform.get(FormControlNames.AllOrgnizations)?.setValue(true);
                }
              }else{
                if(this.agencySwitch) {
                  this.AssociateAgencyData = this.AssociateAgencyData.filter(item1 => !data.some(item2 => (item2.id === item1.agencyId && item2.name === item1.agencyName)));
                }
                if(this.organizationSwitch) {
                  this.ShareOrganizationsData = this.ShareOrganizationsData.filter(item1 => !data.some(item2 => (item2.id === item1.id && item2.name === item1.name)));
                }
                this.sharedWith?.gridOptions?.api?.setRowData(data);
              }
            }
            else{
              this.sharedWith?.gridOptions?.api?.setRowData(data);
            }
            this.changeDetectorRef.markForCheck();
          });
  }

  ngAfterViewInit(): void {
    this.documentHeight = window.outerHeight - 180;
    this.documentWidth = '100%';
    this.keywordToSearchDocument();
  }

  ngOnDestroy(): void {
    this.previousFolderId = -2;
    this.isAlive = false;
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  public columnDefinitions: ColumnDefinitionModel[] = DocumentLibraryColumnsDefinition(this.actionCellrenderParams, this.datePipe);
  public agencyColumnDefinitions: ColumnDefinitionModel[] = DocumentLibraryColumnsAgencyDefinition(this.actionCellrenderParams, this.datePipe);

  get bussinesUserData$(): Observable<BusinessUnit[]> {
    return this.businessUserData$.pipe(map((fn) => fn(this.filterBbusinessControl?.value)));
  }

  private skipBusinessUnit() {
    this.businessUnitsDataset = [];
    this.businessUnits.forEach((element, index) => {
      if (element.id != BusinessUnitType.Hallmark && element.id != BusinessUnitType.MSP) {
        this.businessUnitsDataset.push(element);
      }
    });
  }

  private generateFilterBusinessForm(): FormGroup {
    return new FormGroup({
      filterBusinessUnit: new FormControl(),
      filterBusiness: new FormControl(0),
    });
  }
  private onFilterBusinessUnitValueChanged(): void {
    //ToDo: To Check for Org User and Hallmark User while toggle
    this.filterBusinessUnitControl.valueChanges.pipe(takeWhile(() => this.isAlive)).subscribe((value) => {
      value && this.store.dispatch(new GetBusinessByUnitType(value));
      if (value) {
        this.search?.clear();
        this.filterSelecetdBusinesType = value;
        if (this.filterSelecetdBusinesType == BusinessUnitType.Hallmark) {
          this.isHalmarkSelected = true;
        }
        this.previousFolderId = -2;
        this.selectedNodeText = '';
        this.gridApi?.setRowData([]);
        this.selectedDocumentNode = null;
        this.store.dispatch(new SelectedBusinessType(value));
        if (!this.isBusinessFormDisabled) {
          this.filterBbusinessControl.patchValue(0);
        }
        if (this.filterSelecetdBusinesType == BusinessUnitType.Agency)
          this.isAgency = true;
        else
          this.isAgency = false;
      }
    });
    this.filterBbusinessControl.valueChanges.pipe(takeWhile(() => this.isAlive)).subscribe((value) => {
      if (value) {
        this.isHalmarkSelected = false;
        this.filterSelectedBusinesUnitId = value;
        this.loadRegionsAndLocations(value);
        this.getDocumentTypes(value);
        this.getFolderTree(value);
        this.search?.clear();
      }
    });
  }

  public loadRegionsAndLocations(selectedBusinessUnitId: number) {

    this.createForm();
    if (!this.isAgency) {
      this.regionIdControl = this.documentLibraryform.get(FormControlNames.RegionIds) as AbstractControl;
      let regionFilter: regionFilter = {
        businessUnitId: selectedBusinessUnitId,
        getAll: true,
        ids: [selectedBusinessUnitId]
      };
      this.store.dispatch(new GetRegionsByOrganizations(regionFilter));
      this.changeDetectorRef.markForCheck();

      this.regionIdControl?.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data: any) => {
        if (this.regionIdControl?.value?.length > 0) {
          let locationFilter: LocationsByRegionsFilter = {
            ids: data,
            getAll: true,
            businessUnitId: selectedBusinessUnitId,
            orderBy:'Name'
          };
          this.store.dispatch(new GetLocationsByRegions(locationFilter));
          this.changeDetectorRef.markForCheck();
        }
      });
    }
    else {
      this.clearRegionsLocations();
    }
  }

  public onRegionSelect(event: any) {
    this.regionIdControl = this.documentLibraryform.get(FormControlNames.RegionIds) as AbstractControl;
    this.regionIdControl?.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((data: any) => {
      if(data){
        if (this.regionIdControl?.value?.length > 0) {
          let locationFilter: LocationsByRegionsFilter = {
            ids: data,
            getAll: true,
            businessUnitId: this.filterSelectedBusinesUnitId != null ? this.filterSelectedBusinesUnitId : 0,
            orderBy:'Name'
          };
          this.store.dispatch(new GetLocationsByRegions(locationFilter));
          this.changeDetectorRef.markForCheck();
        }
        else{
          let locationFilter: LocationsByRegionsFilter = {
            ids: [data?.length],
            getAll: true,
            businessUnitId: this.filterSelectedBusinesUnitId != null ? this.filterSelectedBusinesUnitId : 0,
          };
          this.store.dispatch(new GetLocationsByRegions(locationFilter));
          this.documentLibraryform.get(FormControlNames.LocationIds)?.setValue([]);
        }
      }

    });
  }

  public clearRegionsLocations() {
    this.documentLibraryform.get(FormControlNames.RegionIds)?.setValue([]);
    this.documentLibraryform.get(FormControlNames.LocationIds)?.setValue([]);
  }

  get formAltaControls(): any {
    return this.documentLibraryform['controls'];
  }

  private getDocumentTypes(selectedBusinessUnitId: number | null) {
    let documentTypesFilter: DocumentTypeFilter = {
      businessUnitType: this.filterSelecetdBusinesType,
      businessUnitId: selectedBusinessUnitId
    }
    this.store.dispatch(new GetDocumentTypes(documentTypesFilter));
  }
  private getFolderTree(selectedBusinessUnitId: number | null) {
    this.store.dispatch(new GetFoldersTree({ businessUnitType: this.filterSelecetdBusinesType, businessUnitId: selectedBusinessUnitId }));
  }
  private getSharedDocumentInformation(documentId:number,busniessUnitType:number){
    let sharedDocumentInformation: SharedDocumentInformation = {
      businessUnitType: busniessUnitType,
      documentId: documentId
    }

    this.store.dispatch(new GetSharedDocumentInformation(sharedDocumentInformation));

  }

  public createForm(): void {
    this.documentLibraryform = new FormGroup({})
    this.addRemoveFormcontrols();
  }

  public addRemoveFormcontrols() {
    if (this.isAddNewFolder) {
      this.documentLibraryform.addControl(FormControlNames.FolderName, new FormControl(null, [Validators.required, Validators.maxLength(216), Validators.minLength(3)]));
      if (this.documentLibraryform.contains(FormControlNames.DocumentName)) this.documentLibraryform.removeControl(FormControlNames.DocumentName);
      if (this.documentLibraryform.contains(FormControlNames.RegionIds)) this.documentLibraryform.removeControl(FormControlNames.RegionIds);
      if (this.documentLibraryform.contains(FormControlNames.LocationIds)) this.documentLibraryform.removeControl(FormControlNames.LocationIds);
      if (this.documentLibraryform.contains(FormControlNames.TypeIds)) this.documentLibraryform.removeControl(FormControlNames.TypeIds);
      if (this.documentLibraryform.contains(FormControlNames.Tags)) this.documentLibraryform.removeControl(FormControlNames.Tags);
      if (this.documentLibraryform.contains(FormControlNames.StatusIds)) this.documentLibraryform.removeControl(FormControlNames.StatusIds);
      if (this.documentLibraryform.contains(FormControlNames.StartDate)) this.documentLibraryform.removeControl(FormControlNames.StartDate);
      if (this.documentLibraryform.contains(FormControlNames.EndDate)) this.documentLibraryform.removeControl(FormControlNames.EndDate);
      if (this.documentLibraryform.contains(FormControlNames.Comments)) this.documentLibraryform.removeControl(FormControlNames.Comments);
    }
    else if (this.isUpload || this.isEditDocument) {
      if (this.documentLibraryform.contains(FormControlNames.FolderName)) this.documentLibraryform.removeControl(FormControlNames.FolderName);
      this.documentLibraryform.addControl(FormControlNames.DocumentName, new FormControl(null, [Validators.required, Validators.maxLength(216), Validators.minLength(3), Validators.pattern(DOCUMENT_NAME_PATTERN)]));
      this.documentLibraryform.addControl(FormControlNames.RegionIds, new FormControl(null, [Validators.required]));
      this.documentLibraryform.addControl(FormControlNames.LocationIds, new FormControl(null, [Validators.required]));
      this.documentLibraryform.addControl(FormControlNames.TypeIds, new FormControl(null, [Validators.required]));
      this.documentLibraryform.addControl(FormControlNames.Tags, new FormControl('', []));
      this.documentLibraryform.addControl(FormControlNames.StatusIds, new FormControl(null, [Validators.required]));
      this.documentLibraryform.addControl(FormControlNames.StartDate, new FormControl(null, []));
      this.documentLibraryform.addControl(FormControlNames.EndDate, new FormControl(null, []));
      this.documentLibraryform.addControl(FormControlNames.Comments, new FormControl('', []));
      this.documentLibraryform.get(FormControlNames.StatusIds)?.setValue(this.statusItems[0].id);
    }
    else if (this.isShare) {
      if (this.documentLibraryform.contains(FormControlNames.RegionIds)) this.documentLibraryform.removeControl(FormControlNames.RegionIds);
      if (this.documentLibraryform.contains(FormControlNames.LocationIds)) this.documentLibraryform.removeControl(FormControlNames.LocationIds);
      this.documentLibraryform.addControl(FormControlNames.RegionIds, new FormControl(null, []));
      this.documentLibraryform.addControl(FormControlNames.LocationIds, new FormControl(null, []));

    }
    if (this.isAgency) {
      if (this.documentLibraryform.contains(FormControlNames.RegionIds)) this.documentLibraryform.removeControl(FormControlNames.RegionIds);
      if (this.documentLibraryform.contains(FormControlNames.LocationIds)) this.documentLibraryform.removeControl(FormControlNames.LocationIds);
    }
    this.documentLibraryform.addControl(FormControlNames.Agencies, new FormControl(null, []));
    this.documentLibraryform.addControl(FormControlNames.AllAgencies, new FormControl(false, []));
    this.documentLibraryform.addControl(FormControlNames.Orgnizations, new FormControl(null, []));
    this.documentLibraryform.addControl(FormControlNames.AllOrgnizations, new FormControl(false, []));

  }

  public uploadToFile(file: Blob | null) {
    this.selectedFile = file;
    const fileData: any = file;
    this.documentLibraryform.get(FormControlNames.DocumentName)?.setValue(fileData?.name);
    if(this.businessFilterForm.get('filterBusinessUnit')?.value===3 && !this.isEditDocument){
      this.onAgencyChanges();
      this.changeDetectorRef.markForCheck();
    }
    if(this.businessFilterForm.get('filterBusinessUnit')?.value===4 && !this.isEditDocument){
      this.onOrganizationChanges();
      this.changeDetectorRef.markForCheck();
    }
  }


  onPageSizeChanged(event: any) {
    this.gridOptions.cacheBlockSize = Number(event.value.toLowerCase().replace("rows", ""));
    this.gridOptions.paginationPageSize = Number(event.value.toLowerCase().replace("rows", ""));
    if (this.gridApi != null) {
      this.gridApi.paginationSetPageSize(Number(event.value.toLowerCase().replace("rows", "")));
      this.gridApi.setRowData(this.rowData);
    }
  }

  public noRowsOverlayComponentParams: any = {
    noRowsMessageFunc: () => SpecialProjectMessages.NoRowsMessage,
  };

  public sideBar = {
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
        toolPanelParams: {
          suppressRowGroups: true,
          suppressValues: true,
          suppressPivots: true,
          suppressPivotMode: true,
          suppressColumnFilter: true,
          suppressColumnSelectAll: true,
          suppressColumnExpandAll: true,
        },
      },
      {
        id: 'filters',
        labelDefault: 'Filters',
        labelKey: 'filters',
        iconKey: 'filters',
        toolPanel: 'agFiltersToolPanel',
        toolPanelParams: {
          suppressRowGroups: true,
          suppressValues: true,
          suppressPivots: true,
          suppressPivotMode: true,
          suppressColumnFilter: true,
          suppressColumnSelectAll: true,
          suppressColumnExpandAll: true,
        },
      },
    ],
  };

  gridOptions: GridOptions = {
    pagination: true,
    cacheBlockSize: this.pageSize,
    paginationPageSize: this.pageSize,
    columnDefs: this.columnDefinitions,
    rowData: this.rowData,
    sideBar: this.sideBar,
    rowSelection: this.rowSelection,
    noRowsOverlayComponent: CustomNoRowsOverlayComponent,
    noRowsOverlayComponentParams: this.noRowsOverlayComponentParams,
    onFilterChanged: (event: FilterChangedEvent) => {
      if (!event.api.getDisplayedRowCount()) {
        this.gridApi?.showNoRowsOverlay();
      }
      else {
        this.gridApi?.hideOverlay();
      }
    },
    suppressRowClickSelection: true,
    onCellClicked: (e: CellClickedEvent) => {
      const column: any = e.column;
      if (column?.colId == documentsColumnField.Name) {
        this.documentPreview(e.data);
      }
    }
  };

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.setRowData(this.rowData);
  }

  private getDocumentFilter(selectedBusinessUnitId: number | null) {
    const documentFilter: DocumentsFilter = {
      documentId: this.selectedDocumentNode?.fileType == FileType.File ? (this.selectedDocumentNode?.id != undefined ? this.selectedDocumentNode?.id : null) : null,
      businessUnitType: this.filterSelecetdBusinesType,
      businessUnitId: selectedBusinessUnitId,
      regionId: null,
      locationId: null,
      folderId: this.selectedDocumentNode?.fileType == FileType.Folder ? (this.selectedDocumentNode?.id != undefined ? this.selectedDocumentNode?.id : null) : null,
      includeSharedWithMe: this.isIncludeSharedWithMe,
      showAllPages: true
    }
    return documentFilter;
  }

  private getShareDocumentInfoFilter(selectedBusinessUnitId: number | null) {
    const documentFilter: ShareDocumentInfoFilter = {
      documentId: this.selectedDocumentNode?.fileType == FileType.File ? (this.selectedDocumentNode?.id != undefined ? this.selectedDocumentNode?.id : null) : null,
      businessUnitType: this.filterSelecetdBusinesType,
      businessUnitId: this.selectedDocumentNode?.businessUnitId != undefined ? this.selectedDocumentNode?.businessUnitId : selectedBusinessUnitId,
      regionId: null,
      locationId: null,
      folderId: this.selectedDocumentNode?.fileType == FileType.Folder ? (this.selectedDocumentNode?.id != undefined ? this.selectedDocumentNode?.id : null) : null,
      getAll: true
    }
    return documentFilter;
  }


  public onIncludeSharedWithMe(event: any) {
    this.isIncludeSharedWithMe = !this.isIncludeSharedWithMe;
    this.changeDetectorRef.markForCheck();
    this.getDocuments(this.filterSelectedBusinesUnitId);
  }

  public getSharedDocuments(selectedBusinessUnitId: number | null): void {
    this.IsSearchDone = false;
    this.store.dispatch(new GetSharedDocuments(this.getShareDocumentInfoFilter(selectedBusinessUnitId)));
    this.shareDocumentInfoPage$.pipe(takeWhile(() => this.isAlive)).subscribe((data) => {
      this.gridApi?.setRowData([]);
      if (!data || !data?.items.length) {
        this.gridApi?.showNoRowsOverlay();
        this.totalRecordsCount = 0;
      }
      else {
        this.gridApi?.hideOverlay();
        let documentData = [...new Set(data.items.map((item: ShareDocumentDto) => item.document))];
        if(this.filterSelecetdBusinesType == BusinessUnitType.Agency){
          this.agencyColumnDefinitions.forEach(element => {
            if(element.field == "businessUnitName"){
              element.headerName = 'Organization Name';
            }
          });
        }else{
          this.agencyColumnDefinitions.forEach(element => {
            if(element.field == "businessUnitName"){
              element.headerName = 'Agency Name';
            }
          });
        }
        if(documentData.filter(ele=>ele.isSharedWithMe).length == documentData.length){
          documentData = documentData.filter(data=>data.status === 'Active');
        }
        this.gridApi.setColumnDefs(this.agencyColumnDefinitions);
        this.rowData = documentData;
        this.totalRecordsCount = data.totalCount;
        this.gridApi?.setRowData(this.rowData);
      }
    });
  }



  public getDocuments(selectedBusinessUnitId: number | null) {
    this.store.dispatch(new GetDocuments(this.getDocumentFilter(selectedBusinessUnitId)));
    this.documentsPage$.pipe(takeWhile(() => this.isAlive)).subscribe((data) => {
      this.gridApi?.setRowData([]);
      let dataFilter = data;
      if (this.filterSelecetdBusinesType == BusinessUnitType.Organization) {
        if (dataFilter?.items.length) {
          dataFilter.items = data.items.filter((item) => { return !(item.regionName?.trim().length == 0 || item.locationName?.trim().length == 0) });
        }
      }

      if (!dataFilter || !dataFilter?.items.length) {
        this.gridApi?.showNoRowsOverlay();
        if (this.selectedDocumentNode?.id != undefined && this.selectedDocumentNode.id > 0 && dataFilter != null && !this.IsSearchDone) {
          this.store.dispatch(new IsDeleteEmptyFolder(true));
        }
        this.totalRecordsCount = 0;
      }
      else {
        this.gridApi?.hideOverlay();
        if(this.isAgency){
          if(this.filterSelecetdBusinesType == BusinessUnitType.Agency){
            this.agencyColumnDefinitions.forEach(element => {
              if(element.field == "businessUnitName"){
                element.headerName = 'Agency Name';
              }
            });
          }else{
            this.agencyColumnDefinitions.forEach(element => {
              if(element.field == "businessUnitName"){
                element.headerName = 'Organization Name';
              }
            });
          }
          this.gridApi.setColumnDefs(this.agencyColumnDefinitions);
        }else{
          this.gridApi.setColumnDefs(this.columnDefinitions);
        }
        this.rowData = dataFilter.items;
        this.gridApi?.setRowData(this.rowData);
        this.totalRecordsCount = data.totalCount;
        this.store.dispatch(new IsDeleteEmptyFolder(false));
      }
    });
  }

  public shareSelectedDocuments(event: any) {
    this.formDailogTitle = "";
    let selectedRows: any;
    selectedRows = this.gridApi.getSelectedRows();
    if (selectedRows.length > 0) {
      let selectedIds = selectedRows.map((item: any) => {
      return item.id;
    })
      this.isAddNewFolder = false;
      this.isUpload = false;
      this.isEditDocument = false;
      this.isShare = true;
      this.dialogWidth = '600px'
      this.shareDocumentIds = selectedIds;
      this.isShowSharedWith=false;
      if(this.businessFilterForm.get('filterBusinessUnit')?.value === this.businessUnitTypes.Organization)
      {
        let showSharedDoc = false;
        if(selectedIds.length == 1){
          this.documentId = selectedIds[0];
          showSharedDoc = true;
        }
        this.onAgencyChanges(showSharedDoc);
      }
      if(this.businessFilterForm.get('filterBusinessUnit')?.value === this.businessUnitTypes.Agency)
      {
        let showSharedDoc = false;
        if(selectedIds.length == 1){
          this.documentId = selectedIds[0];
          showSharedDoc = true;
        }
        this.onOrganizationChanges(showSharedDoc);
      }
      this.store.dispatch(new ShowSideDialog(true));
    }
    else {
      this.store.dispatch([
        new ShowToast(MessageTypes.Warning, "Please select atleast one document."),
      ]);
    }
  }


  public documentPreview(docItem: any) {
    this.closeDialog();
    this.downloadedFileName = '';
    const downloadFilter: PreviewDocumentDetailFilter = {
      documentId: docItem.id,
      businessUnitType: this.filterSelecetdBusinesType,
      businessUnitId: this.filterSelectedBusinesUnitId
    }

    this.store.dispatch(new GetDocumentPreviewDeatils(downloadFilter)).pipe(takeUntil(this.unsubscribe$)).subscribe((val) => {
      if (val) {
        var data = val?.documentLibrary?.documentPreviewDetail;
        if (data != null) {
          if (this.downloadedFileName != data.fileName) {
            this.downloadedFileName = data.fileName;
            if (data.fileAsBase64 && data.fileAsBase64 != '') {
              this.getPreviewUrl(data);
              this.dialogWidth = "1000px";
              this.store.dispatch(new ShowDocPreviewSideDialog(true));
            }
            this.changeDetectorRef.markForCheck();
          }
        }
      }
    });
  }


  load(url: string) {
    this.pdfViewer?.load(url, '');
  }

  getPreviewUrl(file: any) {
    let extension = (file != null) ? file.extension : null;
    switch (extension) {
      case '.pdf':
        this.previewUrl = '';
        this.isPdf = true;
        this.load(`data:application/pdf;base64,${file.fileAsBase64}`);
        break;
      case '.jpg':
        this.isImage = true;
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `data:image/jpg;base64,${file.fileAsBase64}`
        );
        break;
      case '.jpeg':
        this.isImage = true;
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `data:image/jpg;base64,${file.fileAsBase64}`
        );
        break;
      case '.png':
        this.isImage = true;
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `data:image/png;base64,${file.fileAsBase64}`
        );
        break;
      case '.docx':
        this.isWordDoc = true;
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://view.officeapps.live.com/op/embed.aspx?src=' + file.sasUrl);
        break;
      case '.doc':
        this.isWordDoc = true;
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://view.officeapps.live.com/op/embed.aspx?src=' + file.sasUrl);
        break;
      case '.xlsx':
        this.isWordDoc = true;
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://view.officeapps.live.com/op/embed.aspx?src=' + file.sasUrl);
        break;
      case '.xls':
        this.isWordDoc = true;
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://view.officeapps.live.com/op/embed.aspx?src=' + file.sasUrl);
        break;
      default:

    }
    this.changeDetectorRef.markForCheck();
  }

  setDocumentMimeTypeDefaults() {
    this.isPdf = false;
    this.isWordDoc = false;
    this.isImage = false;
    this.isExcel = false;
    this.previewUrl = '';
    this.fileAsBase64 = '';
  }

  public onClosePreview(): void {
    this.setDocumentMimeTypeDefaults();
    this.previewUrl = null;
    this.downloadedFileName = '';
    this.changeDetectorRef.markForCheck();
    this.store.dispatch(new ShowDocPreviewSideDialog(false));
  }

  public downloadDocument(docItem: DocumentLibraryDto) {
    this.setDocumentMimeTypeDefaults();
    const downloadFilter: DownloadDocumentDetailFilter = {
      documentId: docItem.id,
      businessUnitType: this.filterSelecetdBusinesType,
      businessUnitId: this.filterSelectedBusinesUnitId
    }
    this.store.dispatch(new GetDocumentDownloadDeatils(downloadFilter));
    this.documentDownloadDetail$.pipe(takeUntil(this.unsubscribe$))
      .subscribe((data: DownloadDocumentDetail) => {
        if (data) {
          if (this.downloadedFileName != data.name) {
            this.downloadedFileName = data.name;
            this.createLinkToDownload(data.fileAsBase64, data.name, data.contentType);
          }
        }
      });
    this.changeDetectorRef.markForCheck();
  }
  createLinkToDownload(base64String: string, fileName: string, contentType: string) {
    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
      const byteChar = atob(base64String);
      const byteArray = new Array(byteChar.length);
      for (let i = 0; i < byteChar.length; i++) {
        byteArray[i] = byteChar.charCodeAt(i);
      }
      const uIntArray = new Uint8Array(byteArray);
      const blob = new Blob([uIntArray], { type: contentType });
      (window.navigator as any).msSaveOrOpenBlob(blob, `${fileName}`);
    } else {
      const source = `data:${contentType};base64,${base64String}`;
      const link = document.createElement('a');
      link.href = source;
      link.download = `${fileName}`;
      link.click();
    }
  }
  public menuOptionSelected(event: any, data: DocumentLibraryDto): void {
    switch (Number(event.item.properties.id)) {
      case MoreMenuType['Edit']:
        this.editDocument(data);
        break;
      case MoreMenuType['Delete']:
        this.deleteDocument(data);
        break;
      case MoreMenuType['Share']:
        this.ShareDocument(data);
        break;
      case MoreMenuType['UnShare']:
        this.UnShareDocumewnt(data);
        break;
    }
  }

  public handleOnUploadBtnClick() {
    this.editLocationIds = [];
    this.isAddNewFolder = false;
    this.isUpload = true;
    this.documentId = 0;
    this.isEditDocument = false;
    this.dialogWidth = '800px';
    this.createForm();
    this.formDailogTitle = FormDailogTitle.Upload;
    if (
      this.selectedNodeText == 'Documents' ||
      this.selectedDocumentNode != null
      && this.selectedDocumentNode?.id != undefined
      && this.selectedDocumentNode?.id != -1
      && this.selectedDocumentNode?.parentID != -1)
      this.store.dispatch(new ShowSideDialog(true));
    else
      this.store.dispatch([new ShowToast(MessageTypes.Warning, "Please select BusinessUnit and select folder.")]);
  }

  private editDocument(docItem: DocumentLibraryDto) {
    if (docItem) {
      this.editLocationIds = [];
      this.currentDocumentData = docItem;
      this.isEditDocument = true;
      this.formDailogTitle = FormDailogTitle.EditDocument;
      this.documentId = docItem.id;
      this.isAddNewFolder = false;
      this.isShare = false;
      this.isUpload = true;
      this.dialogWidth = '800px';
      this.createForm();
      this.documentLibraryform.reset();
      this.loadRegionsAndLocations(docItem.businessUnitId != null ? docItem.businessUnitId : 0);
      let status = this.statusItems.find((x) => x.text == docItem.status);
      this.startDate = docItem.startDate != null ? new Date(docItem.startDate.toString()) : this.startDate;
      this.store.dispatch(new GetDocumentById(docItem.id));
      this.documentLibraryDto$.pipe(takeUntil(this.unsubscribe$),distinctUntilChanged())
        .subscribe((data: DocumentLibraryDto) => {
          if (data) {
            this.documentLibraryform.get(FormControlNames.DocumentName)?.setValue(data.name);
            this.documentLibraryform.get(FormControlNames.TypeIds)?.setValue(data.docType);
            this.documentLibraryform.get(FormControlNames.Tags)?.setValue(data.tags);
            this.documentLibraryform.get(FormControlNames.StatusIds)?.setValue(status?.id);
            this.documentLibraryform.get(FormControlNames.StartDate)?.setValue(data.startDate != null ? new Date(data.startDate.toString()) : null);
            this.documentLibraryform.get(FormControlNames.EndDate)?.setValue(data.endDate != null ? new Date(data.endDate.toString()) : null);
            this.documentLibraryform.get(FormControlNames.Comments)?.setValue(data.comments);
              const editRegionIds = data?.regionId?.split(',').map(Number) != undefined ? data?.regionId?.split(',').map(Number) : [];
              this.documentLibraryform.get(FormControlNames.RegionIds)?.setValue(editRegionIds);
              this.editLocationIds = data?.locationId?.split(',').map(Number) != undefined ? data?.locationId?.split(',').map(Number) : [];
            this.store.dispatch(new ShowSideDialog(true));
          }
        });
    }
  }

  public setRegionsOnEdit(editRegionIds: any) {

    if (editRegionIds.length > 0) {
      this.regions$.pipe(takeUntil(this.unsubscribe$),distinctUntilChanged()).subscribe((data) => {
        this.documentLibraryform.get(FormControlNames.RegionIds)?.setValue(editRegionIds);
      });
    } else {
      this.documentLibraryform.get(FormControlNames.RegionIds)?.setValue(editRegionIds);
    }
  }

  public setLocationsOnEdit(editLocationIds: any) {
    if (editLocationIds.length > 0) {
      this.locations$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
        this.documentLibraryform.get(FormControlNames.LocationIds)?.setValue(editLocationIds);
      });
    } else {
      this.documentLibraryform.get(FormControlNames.LocationIds)?.setValue(editLocationIds);
    }
  }

  private deleteDocument(data: DocumentLibraryDto): void {
    this.addActiveCssClass(event);
    this.confirmService
      .confirm(DELETE_RECORD_TEXT, {
        title: DELETE_RECORD_TITLE,
        okButtonLabel: 'Delete',
        okButtonClass: 'delete-button'
      }).pipe(
        take(1)
      ).subscribe((confirm) => {
        if (confirm && data.id) {
          const deletedocumentFilter: DeleteDocumentsFilter = {
            documentIds: [data.id],
            businessUnitType: this.filterSelecetdBusinesType,
            businessUnitId: this.filterSelectedBusinesUnitId
          }
          this.store.dispatch(new DeletDocuments(deletedocumentFilter)).pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
            this.store.dispatch(new GetFoldersTree({ businessUnitType: this.filterSelecetdBusinesType, businessUnitId: this.filterSelectedBusinesUnitId })).pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
              this.getDocuments(this.filterSelectedBusinesUnitId);
            });
          });
        }
        this.removeActiveCssClass();
      });
  }
  public deleteSelectedDocuments(event: any) {
    let selectedRows: any;
    selectedRows = this.gridApi.getSelectedRows();
    if (selectedRows.length > 0) {
      this.addActiveCssClass(event);
      this.confirmService
        .confirm(DELETE_RECORD_TEXT, {
          title: DELETE_RECORD_TITLE,
          okButtonLabel: 'Delete',
          okButtonClass: 'delete-button'
        }).pipe(take(1))
        .subscribe((confirm) => {
          if (confirm) {
            let selectedIds = selectedRows.map((item: any) => {
              return item.id;
            })
            const deletedocumentFilter: DeleteDocumentsFilter = {
              documentIds: selectedIds,
              businessUnitType: this.filterSelecetdBusinesType,
              businessUnitId: this.filterSelectedBusinesUnitId
            }
            this.store.dispatch(new DeletDocuments(deletedocumentFilter)).pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
              this.closeDialog();
              this.store.dispatch(new GetFoldersTree({ businessUnitType: this.filterSelecetdBusinesType, businessUnitId: this.filterSelectedBusinesUnitId }));
            });
          }
          this.removeActiveCssClass();
        });
    }
    else {
      this.store.dispatch([
        new ShowToast(MessageTypes.Warning, "Please select atleast one document."),
      ]);
    }
  }

  public handleOnSave() {
    this.documentLibraryform.markAllAsTouched();
    if (this.documentLibraryform.invalid && (this.isUpload || this.isEditDocument)) {
      return;
    }
    this.SaveFolderOrDocument();
  }

  public setDictionaryRegionMappings() {

    let mapping: { [id: number]: number[]; } = {};
    if (this.isAgency) {
      return mapping;
    }

    const selectedRegions = this.documentLibraryform.get(FormControlNames.RegionIds)?.value;
    if (selectedRegions.length > 0) {
      selectedRegions.forEach((regionItem: any) => {
        let mappingLocItems: number[] = [];
        const selectedLoactions = this.documentLibraryform.get(FormControlNames.LocationIds)?.value;
        let x = this.locations$.pipe(takeUntil(this.unsubscribe$),distinctUntilChanged()).subscribe((data: any) => {
          if (selectedLoactions.length > 0) {
            selectedLoactions.forEach((selLocItem: any) => {
              let selectedLocation = data.filter((locItem: any) => { return locItem.id == selLocItem && locItem.regionId == regionItem });
              if (selectedLocation.length > 0)
                mappingLocItems.push(selectedLocation[0].id);
            });
            mapping[regionItem] = mappingLocItems;
          }
          else {
            mapping[regionItem] = [];
          }
        });

      });
    }
    return mapping;
  }


  public SaveFolderOrDocument() {
    if (this.isAddNewFolder) {
      const documentFolder: DocumentFolder = {
        id: 0,
        name: this.documentLibraryform.get(FormControlNames.FolderName)?.value,
        parentFolderId: this.selectedDocumentNode?.id != undefined ? this.selectedDocumentNode?.id : null,
        businessUnitType: this.filterSelecetdBusinesType,
        businessUnitId: this.filterSelectedBusinesUnitId,
        status: 1,
        isDeleted: false
      }
      if (this.documentLibraryform.get(FormControlNames.FolderName)?.value.trim() == '') {
        this.documentLibraryform.get(FormControlNames.FolderName)?.setValue(this.documentLibraryform.get(FormControlNames.FolderName)?.value.trim());
        this.documentLibraryform.markAllAsTouched();
        return;
      }
      this.store.dispatch(new SaveDocumentFolder(documentFolder)).pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
        this.documentLibraryform.reset();
        this.closeDialog();
        this.store.dispatch(new GetFoldersTree({ businessUnitType: this.filterSelecetdBusinesType, businessUnitId: this.filterSelectedBusinesUnitId }));
      });
    }
    else if (this.isUpload || this.isEditDocument) {
      const document: Documents = {
        id: this.documentId,
        businessUnitType: this.filterSelecetdBusinesType,
        businessUnitId: this.filterSelectedBusinesUnitId,
        regionLocationMappings: this.setDictionaryRegionMappings(),
        documentName: this.documentLibraryform.get(FormControlNames.DocumentName)?.value,
        folderId: this.selectedDocumentNode?.id != undefined ? this.selectedDocumentNode?.id : 1,
        startDate: this.documentLibraryform.get(FormControlNames.StartDate)?.value,
        endDate: this.documentLibraryform.get(FormControlNames.EndDate)?.value,
        docTypeId: this.documentLibraryform.get(FormControlNames.TypeIds)?.value,
        tags: this.documentLibraryform.get(FormControlNames.Tags)?.value,
        comments: this.documentLibraryform.get(FormControlNames.Comments)?.value,
        selectedFile: this.selectedFile,
        status: parseInt(this.documentLibraryform.get(FormControlNames.StatusIds)?.value),
        isEdit: this.isEditDocument
      }
      if (this.documentLibraryform.get(FormControlNames.DocumentName)?.value.trim() == '') {
        this.documentLibraryform.get(FormControlNames.DocumentName)?.setValue(this.documentLibraryform.get(FormControlNames.DocumentName)?.value.trim());
        this.documentLibraryform.markAllAsTouched();
        return;
      }
      this.store.dispatch(new SaveDocuments(document)).pipe(takeUntil(this.unsubscribe$)).subscribe((val) => {  
        this.selectedDocumentNode!.id = Number(val?.documentLibrary?.savedDocumentLibraryDto?.folderId);
        if (this.isShare) {
          this.shareDocumentIds = [val?.documentLibrary?.savedDocumentLibraryDto?.id];
          this.saveShareDocument(true);
        }
        else {
          this.documentLibraryform.reset();
          this.closeDialog();
          this.store.dispatch(new GetFoldersTree({ businessUnitType: this.filterSelecetdBusinesType, businessUnitId: this.filterSelectedBusinesUnitId }));
        }
      });
    }
    else if (this.isShare) {
      this.saveShareDocument();
    }
  }

  public closeDialog() {
    this.documentLibraryform.reset();
    this.isAddNewFolder = false;
    this.isUpload = false;
    this.isEditDocument = false;
    this.selectedFile = null;
    this.isShare = false;
    this.previousFolderId = -2;
    this.halmarkSwitch = false;
    this.agencySwitch = false;
    this.organizationSwitch = false;
    this.allOrgnizations = false;
    this.allAgencies = false;
    this.documentLibraryform.get(FormControlNames.Orgnizations)?.setValue([]);
    this.documentLibraryform.get(FormControlNames.Agencies)?.setValue([]);
    this.documentLibraryform.get(FormControlNames.AllOrgnizations)?.setValue(this.allOrgnizations);
    this.documentLibraryform.get(FormControlNames.AllAgencies)?.setValue(this.allAgencies);
    if (this.isAddNewFolder) {
      this.store.dispatch(new IsAddNewFolder(false));
    }
    else {
      this.store.dispatch(new ShowSideDialog(false));
    }
  }

  public saveShareDocument(shareWhileUpload: boolean = false) {
    let unitType: number = 0;
    let unitIds: number[] = [];
    let allFlag: boolean = false;
    if (this.agencySwitch) {
      unitType = BusinessUnitType.Agency;
      unitIds = this.documentLibraryform.get(FormControlNames.Agencies)?.value;
      allFlag = this.documentLibraryform.get(FormControlNames.AllAgencies)?.value;
    }
    else if (this.organizationSwitch) {
      unitType = BusinessUnitType.Organization;
      unitIds = this.documentLibraryform.get(FormControlNames.Orgnizations)?.value;
      allFlag = this.documentLibraryform.get(FormControlNames.AllOrgnizations)?.value;
    }
    let mapping: { [id: number]: number[]; } = {};
    if (unitType != 0 && (unitIds?.length > 0 || allFlag)) {
      const shareDocumentsFilter: ShareDocumentsFilter = {
        documentIds: this.shareDocumentIds,
        businessUnitType: unitType,
        businessUnitIds: allFlag ? [-1] : unitIds,
        regionLocationMappings: mapping,
        isShareWhileUpload: shareWhileUpload
      }
      this.store.dispatch(new ShareDocuments(shareDocumentsFilter)).pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
        this.documentLibraryform.reset();
        this.closeDialog();
        this.store.dispatch(new GetFoldersTree({ businessUnitType: this.filterSelecetdBusinesType, businessUnitId: this.filterSelectedBusinesUnitId }));
      });
    }
    else {
      if(!allFlag && this.sharedDocumentInformation && this.sharedDocumentInformation?.length == 1 && this.sharedDocumentInformation[0].id === -1 && this.sharedDocumentInformation[0].name === 'All'){
        this.UnShareDocumewnt(this.currentDocumentData);
      }
      this.documentLibraryform.reset();
      this.closeDialog();
      this.store.dispatch(new GetFoldersTree({ businessUnitType: this.filterSelecetdBusinesType, businessUnitId: this.filterSelectedBusinesUnitId }));
    }
  }


  private ShareDocument(data: DocumentLibraryDto) {
    if (data) {
      this.currentDocumentData = data;
      this.documentId=data.id;
      this.formDailogTitle = "";
      this.isAddNewFolder = false;
      this.isUpload = false;
      this.isEditDocument = false;
      this.isShare = true;
      this.dialogWidth = '600px'
      this.createForm();
      this.isShowSharedWith=false;
      this.shareDocumentIds = [data.id];
      if(this.businessFilterForm.get('filterBusinessUnit')?.value === this.businessUnitTypes.Organization)
      {
        this.onAgencyChanges();
      }
      if(this.businessFilterForm.get('filterBusinessUnit')?.value === this.businessUnitTypes.Agency)
      {
        this.onOrganizationChanges();
      }
      this.store.dispatch(new ShowSideDialog(true));
    }
  }

  private UnShareDocumewnt(data: DocumentLibraryDto) {
    if (data) {
      let unShareDocumentsFilter: UnShareDocumentsFilter = { documentIds: [data.id] };
      this.store.dispatch(new UnShareDocuments(unShareDocumentsFilter)).pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        this.store.dispatch(new GetFoldersTree({ businessUnitType: this.filterSelecetdBusinesType, businessUnitId: this.filterSelectedBusinesUnitId }));
        this.store.dispatch(new GetDocuments(this.getDocumentFilter(this.filterSelectedBusinesUnitId)));
      });
    }
  }
  public onHallmarkSwitcher(event: any) {
    this.halmarkSwitch = !this.halmarkSwitch;
    if (this.halmarkSwitch) {
      this.agencySwitch = false;
      this.organizationSwitch = false;
      this.allOrgnizations = false;
      this.allAgencies = false;
      this.documentLibraryform.get(FormControlNames.Orgnizations)?.setValue([]);
      this.documentLibraryform.get(FormControlNames.Agencies)?.setValue([]);
      this.documentLibraryform.get(FormControlNames.AllOrgnizations)?.setValue(this.allOrgnizations);
      this.documentLibraryform.get(FormControlNames.AllAgencies)?.setValue(this.allAgencies);
    }
    this.changeDetectorRef.markForCheck();
  }
public onAgencyChanges(showSharedDoc=true)
{
  this.agencySwitch = !this.agencySwitch;
    this.allAgencies = false;
    this.documentLibraryform.get(FormControlNames.AllAgencies)?.setValue(this.allAgencies);
    if (this.agencySwitch) {
      this.documentLibraryform.get(FormControlNames.Orgnizations)?.setValue([]);
      if(showSharedDoc){
        this.isShowSharedWith=true;
        this.getSharedDocumentInformation(this.documentId,BusinessUnitType.Agency)
      }
      this.getAssociateAgencyData();
      this.isShare = true;
      this.halmarkSwitch = false;
      this.organizationSwitch = false;
      this.allOrgnizations = false;
      this.documentLibraryform.get(FormControlNames.AllOrgnizations)?.setValue(this.allOrgnizations);
    }
    else {
      this.documentLibraryform.get(FormControlNames.Agencies)?.setValue([]);
      this.sharedWith?.gridOptions?.api?.setRowData([]);
      this.isShowSharedWith=false;
    }
}
  public onAgencySwitcher(event: any) {
    this.onAgencyChanges();
    this.changeDetectorRef.markForCheck();
  }

  public allAgenciesChange(event: any) {
    this.allAgencies=!this.allAgencies;
    this.documentLibraryform.get(FormControlNames.AllAgencies)?.setValue(this.allAgencies);
    if (this.allAgencies && !this.agencySwitch){
      this.isShowSharedWith=false;
    } else if (!this.allAgencies && !this.agencySwitch){
      this.isShowSharedWith=true;
    }
    this.changeDetectorRef.markForCheck();
  }

  public allOrgnizationsChange(event: any) {
    this.allOrgnizations=!this.allOrgnizations;
    this.documentLibraryform.get(FormControlNames.AllOrgnizations)?.setValue(this.allOrgnizations);
    if (this.allOrgnizations && !this.organizationSwitch){
      this.isShowSharedWith=false;
    } else if (!this.allOrgnizations && !this.organizationSwitch){
      this.isShowSharedWith=true;
    }
    this.changeDetectorRef.markForCheck();
  }

  private getAssociateAgencyData() {
    this.shareAssociateAgencies$.pipe(takeUntil(this.unsubscribe$))
      .subscribe((agencyData: AssociateAgencyDto[]) => {
        if (agencyData && agencyData.length > 0) {
          this.AssociateAgencyData = agencyData;
        }
      });
  }

  public onOrganizationChanges(showSharedDoc=true)  {
    this.organizationSwitch = !this.organizationSwitch;
    this.allOrgnizations = false;
    this.documentLibraryform.get(FormControlNames.AllOrgnizations)?.setValue(this.allOrgnizations);
    if (this.organizationSwitch) {
      this.documentLibraryform.get(FormControlNames.Agencies)?.setValue([]);
      if(showSharedDoc){
        this.isShowSharedWith=true;
        this.getSharedDocumentInformation(this.documentId,BusinessUnitType.Organization)
      }
      this.getShareOrganizationsData();
      this.isShare = true;
      this.halmarkSwitch = false;
      this.agencySwitch = false;
      this.allAgencies = false;
      this.documentLibraryform.get(FormControlNames.AllAgencies)?.setValue(this.allAgencies);
    }
    else {
      this.documentLibraryform.get(FormControlNames.Orgnizations)?.setValue([]);
      this.sharedWith?.gridOptions.api?.setRowData([]);
      this.isShowSharedWith=false;
    }
  }

  public onOrganizationSwitcher(event: any){
    this.onOrganizationChanges();
    this.changeDetectorRef.markForCheck();
  }

  private getShareOrganizationsData() {
    this.shareOrganizationsData$.pipe(takeUntil(this.unsubscribe$))
      .subscribe((shareOrgsData: ShareOrganizationsData[]) => {
        if (shareOrgsData && shareOrgsData.length > 0) {
          this.ShareOrganizationsData = shareOrgsData;
        }
      });
  }

  keywordToSearchDocument() {
    this.search?.inputKeyUpEnter
      .pipe(
        map((event: KeyboardEvent) => (event.target as HTMLInputElement).value),
        map((q) => q.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((q) => {
        this.IsSearchDone = false;
        this.searchText=q;
        const businessUnitId = this.businessFilterForm.get('filterBusiness')?.value
        const businessUnitType = this.businessFilterForm.get('filterBusinessUnit')?.value
        if (q.length >= 2) {
          this.IsSearchDone = true;
          let folderId = this.selectedDocumentNode?.fileType == FileType.Folder ? (this.selectedDocumentNode?.id != undefined ? this.selectedDocumentNode?.id : null) : null;
          if (this.selectedDocumentNode?.id != -1 && this.selectedDocumentNode?.parentID != -1)
          this.store.dispatch(new GetDocumentsByCognitiveSearch(q, businessUnitType, businessUnitId, folderId));
          else if (this.selectedDocumentNode?.id == -1 || this.selectedDocumentNode.parentID == -1) {
            this.store.dispatch(new GetSharedDocumentsByCognitiveSearch(q, businessUnitType, businessUnitId, folderId));
          }
        }
        if(q.length === 0){
          if (this.selectedDocumentNode?.id != -1 && this.selectedDocumentNode?.parentID != -1)
            this.getDocuments(this.filterSelectedBusinesUnitId);
          else if (this.selectedDocumentNode?.id == -1 || this.selectedDocumentNode.parentID == -1) {
            this.isSharedFolderClick = true;
            this.store.dispatch(new IsDeleteEmptyFolder(false));
            this.getSharedDocuments(this.filterSelectedBusinesUnitId);
          }
        }
      });
  }
}
