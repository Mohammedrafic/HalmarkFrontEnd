import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { Select, Store } from '@ngxs/store';
import { debounceTime, Observable, Subject } from 'rxjs';

import { AgencyOrderManagement, Order, OrderManagement, ReOrder } from '@shared/models/order-management.model';
import { OrderManagementContentService } from '@shared/services/order-management-content.service';
import { AbstractGridConfigurationComponent } from
  '@shared/components/abstract-grid-configuration/abstract-grid-configuration.component';
import { AddEditReorderService } from '@client/order-management/components/add-edit-reorder/add-edit-reorder.service';
import { SidebarDialogTitlesEnum } from '@shared/enums/sidebar-dialog-titles.enum';
import { AppState } from 'src/app/store/app.state';
import { OrderManagementAgencyService } from '@agency/order-management/order-management-agency.service';
import { OrderManagementService } from
'@client/order-management/components/order-management-content/order-management.service';
import { UserState } from '../../../../../store/user.state';
import { PermissionService } from '../../../../../security/services/permission.service';
import { CurrentUserPermission } from '@shared/models/permission.model';
import { GetReOrdersByOrderId } from '../../store/re-order.actions';
import { ReOrderPage } from '../../interfaces';


@Component({
  selector: 'app-order-reorders-list',
  templateUrl: './order-re-orders-list.component.html',
  styleUrls: ['./order-re-orders-list.component.scss'],
})
export class OrderReOrdersListComponent extends AbstractGridConfigurationComponent implements OnInit {
  @Input() public isAgency = false;
  @Input() public order: Order | OrderManagement | AgencyOrderManagement;
  @Input() public set reOrders(value: ReOrderPage | null) {
    this.reOrdersList = value?.items || [];
    this.totalCountRecords = value?.totalCount || 0;
  }

  @Output() editReorder = new EventEmitter();
  @Output() selectReOrder = new EventEmitter<{
    reOrder: OrderManagement | AgencyOrderManagement;
    order: Order | OrderManagement | AgencyOrderManagement;
  }>();

  public reOrdersList: ReOrder[];
  public totalCountRecords: number;
  public canCreateOrder: boolean;

  @Select(UserState.currentUserPermissions)
  public readonly currentUserPermissions$: Observable<CurrentUserPermission[]>;

  private pageSubject = new Subject<number>();

  constructor(
    private store: Store,
    private orderManagementService: OrderManagementContentService,
    private addEditReOrderService: AddEditReorderService,
    private orderManagementAgencyService: OrderManagementAgencyService,
    private orderService: OrderManagementService,
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  ngOnInit() {
    this.subscribeOnPageChanges();
    this.subscribeOnPermissions();
  }

  private subscribeOnPageChanges(): void {
    this.pageSubject.pipe(debounceTime(1)).subscribe((page) => {
      this.currentPage = page;
      this.getReOrdersByPageSettings();
      this.cdr.markForCheck();
    });
  }

  public onRowsDropDownChanged(event: number): void {
    this.pageSize = event;
    this.currentPage = 1;
    this.pageSettings = { ...this.pageSettings, pageSize: this.pageSize };
  }

  public onViewNavigation(reOrder: OrderManagement): void {
    this.selectReOrder.emit({ reOrder: reOrder, order: this.order });
    const { isAgencyArea } = this.store.selectSnapshot(AppState.isOrganizationAgencyArea);

    if (reOrder.publicId) {
      if (isAgencyArea) {
        this.orderManagementAgencyService.reorderId$.next({
          id: reOrder.publicId,
          prefix: reOrder.organizationPrefix,
        });
      } else {
        this.orderService.reorderId$.next({
          id: reOrder.publicId,
          prefix: reOrder.organizationPrefix,
        });
      }
    }
  }

  public edit(order: OrderManagement): void {
    if (!this.canCreateOrder) {
      return;
    }
    this.addEditReOrderService.setReOrderDialogTitle(SidebarDialogTitlesEnum.EditReOrder);
    this.orderManagementService.getOrderById(order.id).subscribe((order) => this.editReorder.emit(order));
  }

  private subscribeOnPermissions(): void {
    this.permissionService.getPermissions().subscribe(({ canCreateOrder }) => {
      this.canCreateOrder = canCreateOrder;
    });
  }

  public gridPageChanged(page: number): void  {
    this.pageSubject.next(page);  
  }

  private getReOrdersByPageSettings(): void {
    this.store.dispatch(new GetReOrdersByOrderId(this.order.id as number, this.currentPage, this.pageSize));
  }
}
