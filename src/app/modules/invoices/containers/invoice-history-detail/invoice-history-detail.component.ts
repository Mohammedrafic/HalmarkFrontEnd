import { Component, OnInit, ChangeDetectionStrategy, Input, ViewChild, OnDestroy, ChangeDetectorRef, Inject } from '@angular/core';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { PendingApprovalInvoice } from '../../interfaces';
import { Actions, Select, Store, ofActionDispatched } from '@ngxs/store';
import { AppState } from 'src/app/store/app.state';
import { AbstractPermissionGrid } from '@shared/helpers/permissions';
import { GlobalWindow } from '@core/tokens';
import { ExpandEventArgs } from '@syncfusion/ej2-angular-navigations';
import { GRID_CONFIG } from '@shared/constants';
import { FilterChangedEvent, GridOptions } from '@ag-grid-community/core';
import { Invoices } from '../../store/actions/invoices.actions';
import { Invoicebase, agencyInvoicebase, agencypaymentDetails, paymentDetatils } from '../../interfaces/invoice-auditlog.interface';
import { InvoicesContainerService } from '../../services/invoices-container/invoices-container.service';
import { ColumnDefinitionModel } from '@shared/components/grid/models';
import { InvoiceAuditHistoryTableColumnsDefinition, agencyInvoiceAuditHistoryTableColumnsDefinition, agencypaymentAuditHistoryTableColumnsDefinition, paymentAuditHistoryTableColumnsDefinition } from './invoice-history-detail.constants';
import { CustomNoRowsOverlayComponent } from '@shared/components/overlay/custom-no-rows-overlay/custom-no-rows-overlay.component';
import { InvoicesState } from '../../store/state/invoices.state';

@Component({
  selector: 'app-invoice-history-detail',
  templateUrl: './invoice-history-detail.component.html',
  styleUrls: ['./invoice-history-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceHistoryDetailComponent extends AbstractPermissionGrid implements OnInit, OnDestroy {
  @ViewChild('sideDialog') sideDialog: DialogComponent;
  @Input() historyDetails: Subject<PendingApprovalInvoice>;
  private unsubscribe$: Subject<void> = new Subject();
  public gridApi: any;
  public paymentDetails: any;
  public agencyInvoice: any

  private isAlive: boolean = true;
  viewedTab: number[] = [];
  @Select(InvoicesState.getInvoiceAuditHistory)
  invoiceHistoryDetails$: Observable<Invoicebase[]>;

  @Select(InvoicesState.getAgecnyInvoiceAuditHistory)
  agencyinvoiceHistoryDetails$: Observable<agencyInvoicebase[]>;

  @Select(AppState.getMainContentElement)
  public readonly targetElement$: Observable<HTMLElement | null>;
  public targetElement: HTMLElement = document.body;
  invoiceDetails: any;
  public readonly gridConfig: typeof GRID_CONFIG = GRID_CONFIG;
  invoiceAuditHistoryDetails: Array<Invoicebase> = [];
  agencyinvoiceAuditHistoryDetails: Array<agencyInvoicebase> = [];

  paymentHistory: Array<paymentDetatils> = [];
  agencypaymentHistory: Array<agencypaymentDetails> = []

  isAgency: boolean;
  public readonly InvoicehistorycolumnDefinitions: ColumnDefinitionModel[] = InvoiceAuditHistoryTableColumnsDefinition();
  public readonly paymentDetailcolumnDefintion: ColumnDefinitionModel[] = paymentAuditHistoryTableColumnsDefinition();

  public readonly agencyInvoicehistorycolumnDefinitions: ColumnDefinitionModel[] = agencyInvoiceAuditHistoryTableColumnsDefinition();
  public readonly agencypaymentDetailcolumnDefintion: ColumnDefinitionModel[] = agencypaymentAuditHistoryTableColumnsDefinition();

  public noRowsOverlayComponentParams: any = {
    noRowsMessageFunc: () => 'No Rows To Show',
  };
  title = "Organization"
  agencypaymentDetails: any;
  constructor(
    private actions$: Actions,
    protected override store: Store,
    private _detector: ChangeDetectorRef,
    @Inject(GlobalWindow) protected readonly globalWindow: WindowProxy & typeof globalThis,
    private invoicesContainerService: InvoicesContainerService
  ) {
    super(store);
  }

  public override ngOnInit(): void {
    super.ngOnInit();
    this.onOpenEvent()
    this.isAgency = this.invoicesContainerService.isAgency();
    if (this.isAgency) {
      this.title = 'Agency'
    }



  }
  onOpenEvent() {
    this.historyDetails.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
      if (data?.invoiceId > 0) {
        this.gridApi?.setRowData([]);
        this.invoiceDetails = data;
        this.sideDialog.refresh();
        this.sideDialog.show();
      }
      else {
        this.gridApi.setRowData([]);
        this.sideDialog.hide();
      }
      this._detector.detectChanges();
    });

  }



  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridApi.setRowData();
  }
  public gridOptions: GridOptions = {
    pagination: true,
    cacheBlockSize: this.pageSize,
    paginationPageSize: this.pageSize,
    columnDefs: this.InvoicehistorycolumnDefinitions,
    rowData: this.invoiceAuditHistoryDetails,
    noRowsOverlayComponent: CustomNoRowsOverlayComponent,
    noRowsOverlayComponentParams: this.noRowsOverlayComponentParams,
    onFilterChanged: (event: FilterChangedEvent) => {
      if (!event.api.getDisplayedRowCount()) {
        this.gridApi?.showNoRowsOverlay();
      }
      else {
        this.gridApi?.hideOverlay();
      }
    }
  };

  public paymentDetailGridOptions: GridOptions = {
    pagination: true,
    cacheBlockSize: this.pageSize,
    paginationPageSize: this.pageSize,
    columnDefs: this.paymentDetailcolumnDefintion,
    rowData: this.paymentHistory,
    noRowsOverlayComponent: CustomNoRowsOverlayComponent,
    noRowsOverlayComponentParams: this.noRowsOverlayComponentParams,
    onFilterChanged: (event: FilterChangedEvent) => {
      if (!event.api.getDisplayedRowCount()) {
        this.paymentDetails?.showNoRowsOverlay();
      }
      else {
        this.paymentDetails?.hideOverlay();
      }
    }
  };
  public agencygridOptions: GridOptions = {
    pagination: true,
    cacheBlockSize: this.pageSize,
    paginationPageSize: this.pageSize,
    columnDefs: this.agencyInvoicehistorycolumnDefinitions,
    rowData: this.invoiceAuditHistoryDetails,
    noRowsOverlayComponent: CustomNoRowsOverlayComponent,
    noRowsOverlayComponentParams: this.noRowsOverlayComponentParams,
    onFilterChanged: (event: FilterChangedEvent) => {
      if (!event.api.getDisplayedRowCount()) {
        this.agencyInvoice?.showNoRowsOverlay();
      }
      else {
        this.agencyInvoice?.hideOverlay();
      }
    }
  };

  public agencypaymentDetailGridOptions: GridOptions = {
    pagination: true,
    cacheBlockSize: this.pageSize,
    paginationPageSize: this.pageSize,
    columnDefs: this.agencypaymentDetailcolumnDefintion,
    rowData: this.paymentHistory,
    noRowsOverlayComponent: CustomNoRowsOverlayComponent,
    noRowsOverlayComponentParams: this.noRowsOverlayComponentParams,
    onFilterChanged: (event: FilterChangedEvent) => {
      if (!event.api.getDisplayedRowCount()) {
        this.agencypaymentDetails?.showNoRowsOverlay();
      }
      else {
        this.agencypaymentDetails?.hideOverlay();
      }
    }
  };
  onagencyInvoicegrid(params: any) {
    this.agencyInvoice = params.api;
    this.agencyInvoice.setRowData(this.agencyinvoiceAuditHistoryDetails)
  }
  onPaymentDetail(params: any) {
    this.paymentDetails = params.api;
    this.paymentDetails.setRowData(this.paymentHistory);
  }


  onagencyPaymentDetail(params: any) {
    this.agencypaymentDetails = params.api;
    this.agencypaymentDetails.setRowData(this.agencypaymentHistory);
  }

  public expanding(e: ExpandEventArgs) {
    const expandData: ExpandEventArgs = e;
    switch (e.index) {
      case 0:
        if (e.isExpanded && this.invoiceDetails?.invoiceId > 0) {
          if (!this.viewedTab.some(a => a == e.index)) {
            const entityType = this.isAgency
              ? "Einstein.CoreApplication.Domain.Entities.Timesheets.AgencyInvoice"
              : "Einstein.CoreApplication.Domain.Entities.Timesheets.OrganizationInvoice";
            const invoiceId = Number(this.invoiceDetails.invoiceId)
            const organizationId = Number(this.invoiceDetails.organizationId);
            const agencySuffix = this.invoiceDetails.agencySuffix;
            if (this.isAgency) {
              this.store.dispatch(new Invoices.GetAgencyInvoiceAuditHistory({ entityType: entityType, InvoiceId: invoiceId, organizationId: organizationId, AgencySuffix: agencySuffix }, this.isAgency));
              this.actions$.pipe(ofActionDispatched(Invoices.GetInvoiceHistoryDetailSucceeded),)
                .subscribe(() => {
                  this.viewedTab.push(expandData?.index!);
                  this.agencyinvoiceHistoryDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((order) => {
                    this.agencyinvoiceAuditHistoryDetails = order;
                    this.agencyInvoice?.setRowData(this.agencyinvoiceAuditHistoryDetails);
                  });
                });
            } else {
              this.store.dispatch(new Invoices.GetInvoiceAuditHistory({ entityType: entityType, InvoiceId: invoiceId, organizationId: organizationId }, this.isAgency));
              this.actions$.pipe(ofActionDispatched(Invoices.GetInvoiceHistoryDetailSucceeded),)
                .subscribe(() => {
                  this.viewedTab.push(expandData?.index!);
                  this.invoiceHistoryDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((order) => {
                    this.invoiceAuditHistoryDetails = order;
                    this.gridApi?.setRowData(this.invoiceAuditHistoryDetails);
                  });
                });
            }

          } else {
            if (!this.isAgency) {
              this.invoiceHistoryDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((order) => {
                this.invoiceAuditHistoryDetails = order;
                this.gridApi?.setRowData(this.invoiceAuditHistoryDetails);
              });
            }
            else {
              this.agencyinvoiceHistoryDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((order) => {
                this.agencyinvoiceAuditHistoryDetails = order;
                this.agencyInvoice?.setRowData(this.agencyinvoiceAuditHistoryDetails);
              });
            }

          }
        }
        break;
      case 1:
        if (e.isExpanded) {
          if (!this.viewedTab.some(a => a == e.index)) {
            if (!this.isAgency) {
              const processedData = this.invoiceAuditHistoryDetails.map((item) => ({
                ...item,
                paymentDetails: item.jsonData.paymentDetails?.map((payment) => ({
                  ...payment,
                  organizationName: item.jsonData.organizationName,
                  invoiceStateText: item.jsonData.invoiceStateText,
                })),
              }));
              const paymentDetailsArray = processedData
                .map(item => item.paymentDetails)
                .filter(Boolean)

              const flattenedPaymentDetailsArray = paymentDetailsArray.flat();

              this.paymentHistory = flattenedPaymentDetailsArray;
              this.paymentDetails?.setRowData(this.paymentHistory);

            } else {
              const processedData = this.agencyinvoiceAuditHistoryDetails.map((item) => ({
                ...item,
                paymentDetails: item.jsonData.paymentDetails?.map((payment) => ({
                  ...payment,
                  organizationName: item.jsonData.organizationName,
                  invoiceStateText: item.jsonData.invoiceStateText,
                })),
              }));
              const paymentDetailsArray = processedData
                .map(item => item.paymentDetails)
                .filter(Boolean)

              const flattenedPaymentDetailsArray = paymentDetailsArray.flat();

              this.agencypaymentHistory = flattenedPaymentDetailsArray;
              this.agencypaymentDetails?.setRowData(this.agencypaymentHistory);

            }

          }
        }
        break;


    }
  }
  ngOnDestroy(): void {
    this.sideDialog.hide();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.isAlive = false;
  }

  public onClose(): void {
    this.viewedTab = [];
    this.gridApi?.setRowData([]);
    this.invoiceAuditHistoryDetails = [];
    this.sideDialog.hide();
  }

}