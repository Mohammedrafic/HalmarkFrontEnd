import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { filter, Observable, Subject, takeUntil, takeWhile, zip } from 'rxjs';
import { Select, Store } from '@ngxs/store';

import { SelectEventArgs, TabComponent } from '@syncfusion/ej2-angular-navigations';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
import { ChipListComponent } from '@syncfusion/ej2-angular-buttons';

import { disabledBodyOverflow, windowScrollTop } from '@shared/utils/styles.utils';
import { AgencyOrderManagement, Order, OrderCandidatesListPage } from '@shared/models/order-management.model';
import { OrderType } from '@shared/enums/order-type';
import { ChipsCssClass } from '@shared/pipes/chips-css-class.pipe';
import { OrderManagementState } from '@agency/store/order-management.state';
import { DialogNextPreviousOption } from '@shared/components/dialog-next-previous/dialog-next-previous.component';
import isNil from 'lodash/fp/isNil';
import { GetAgencyExtensions } from '@agency/store/order-management.actions';
import { OrderStatus } from '@shared/enums/order-management';
import { CandidatStatus } from '@shared/enums/applicant-status.enum';

@Component({
  selector: 'app-preview-order-dialog',
  templateUrl: './preview-order-dialog.component.html',
  styleUrls: ['./preview-order-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewOrderDialogComponent implements OnInit, OnChanges, OnDestroy {
  @Input() order: AgencyOrderManagement;
  @Input() openEvent: Subject<boolean>;
  @Input() orderPositionSelected$: Subject<boolean>;
  @Input() openCandidateTab: boolean;
  @Input() openDetailsTab: boolean;

  @Output() compareEvent = new EventEmitter<never>();
  @Output() nextPreviousOrderEvent = new EventEmitter<boolean>();

  @ViewChild('sideDialog') sideDialog: DialogComponent;
  @ViewChild('chipList') chipList: ChipListComponent;
  @ViewChild('tab') tab: TabComponent;

  @Select(OrderManagementState.orderDialogOptions)
  public orderDialogOptions$: Observable<DialogNextPreviousOption>;

  @Select(OrderManagementState.orderCandidatesLenght)
  public countOrderCandidates$: Observable<number>;

  @Select(OrderManagementState.selectedOrder)
  public selectedOrder$: Observable<Order>;

  public currentOrder: Order;

  @Select(OrderManagementState.extensions) extensions$: Observable<any>;
  public extensions: any[] = [];

  @Select(OrderManagementState.orderCandidatePage)
  public orderCandidatePage$: Observable<OrderCandidatesListPage>;

  public firstActive = true;
  public targetElement: HTMLElement | null = document.body.querySelector('#main');
  public orderType = OrderType;
  public readonly reasonClosure = {
    orderClosureReason: 'Candidate Rejected',
  } as Order;

  public get showRejectInfo(): boolean {
    return !!(
      this.currentOrder?.status === OrderStatus.Closed &&
      this.currentOrder?.extensionFromId &&
      this.currentOrder.candidates?.length &&
      this.currentOrder.candidates[0].status === CandidatStatus[CandidatStatus.Rejected]
    );
  }

  public get orderInformation(): Order {
    return this.showRejectInfo ? this.reasonClosure : this.currentOrder;
  }

  private excludeDeployed: boolean;
  private isAlive = true;
  private unsubscribe$: Subject<void> = new Subject();

  @Output() selectReOrder = new EventEmitter<any>();

  constructor(private chipsCssClass: ChipsCssClass, private store: Store, private cd: ChangeDetectorRef) {}

  public get isReOrder(): boolean {
    return !isNil(this.order?.reOrderId || this.order?.id);
  }

  public get getTitle(): string {
    return (
      (this.isReOrder ? `Re-Order ID ` : `Order ID `) + `${this.order?.organizationPrefix}-${this.order?.publicId}`
    );
  }

  ngOnInit(): void {
    this.onOpenEvent();
    this.subsToSelectedOrder();
    this.subscribeOnOrderCandidatePage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chipList && changes['order']?.currentValue) {
      this.chipList.cssClass = this.chipsCssClass.transform(changes['order'].currentValue.statusText);
    }
  }

  ngOnDestroy(): void {
    this.isAlive = false;
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private subsToSelectedOrder(): void {
    this.selectedOrder$.pipe(takeUntil(this.unsubscribe$)).subscribe((order) => {
      this.currentOrder = order;
      this.cd.markForCheck();
    });
  }

  private subscribeOnOrderCandidatePage(): void {
    zip([
      this.orderCandidatePage$.pipe(filter((data) => !!data)),
      this.selectedOrder$.pipe(filter((data) => !!data)),
      this.orderPositionSelected$,
    ])
      .pipe(takeWhile(() => this.isAlive))
      .subscribe(([order, selectedOrder, isOrderPositionSelected]: [OrderCandidatesListPage, Order, boolean]) => {
        this.extensions = [];
        if (
          order?.items[0]?.candidateJobId &&
          isOrderPositionSelected &&
          (selectedOrder.orderType === OrderType.ContractToPerm || selectedOrder.orderType === OrderType.Traveler)
        ) {
          this.store.dispatch(
            new GetAgencyExtensions(
              order.items[0].candidateJobId,
              selectedOrder.id!,
              selectedOrder.organizationId!
            )
          );
        }
        this.cd.markForCheck();
      });
    this.extensions$.pipe(takeWhile(() => this.isAlive)).subscribe((extensions) => {
      this.extensions = extensions?.filter((extension: any) => extension.id !== this.order?.id);
      this.cd.markForCheck();
    });
  }

  public onTabSelecting(event: SelectEventArgs): void {
    if (event.isSwiped) {
      event.cancel = true;
    }
  }

  public onTabCreated(): void {
    this.tab.selected.pipe(takeWhile(() => this.isAlive)).subscribe((event: SelectEventArgs) => {
      const visibilityTabIndex = 0;
      this.tab.refresh();
      if (event.selectedIndex !== visibilityTabIndex) {
        this.firstActive = false;
      } else {
        this.firstActive = true;
      }
      if (event.selectedIndex === event.previousIndex) {
        this.tab.select(0);
        this.firstActive = true;
      }
      this.cd.markForCheck();
    });
  }

  public onClose(): void {
    this.tab.select(0);
    this.sideDialog.hide();
    this.openEvent.next(false);
  }

  public onNextPreviousOrder(next: boolean): void {
    this.nextPreviousOrderEvent.emit(next);
  }

  public onExcludeDeployed(event: boolean): void {
    this.excludeDeployed = event;
  }

  public onCompare(): void {
    disabledBodyOverflow(false);
    this.compareEvent.emit();
    // TODO temp solution for opening add reorder dialog
    // this.store.dispatch(new ShowSideDialog(true));
  }

  private onOpenEvent(): void {
    this.openEvent.pipe(takeWhile(() => this.isAlive)).subscribe((isOpen) => {
      if (isOpen) {
        if (this.openDetailsTab) {
          this.tab.select(0);
        } else {
          this.tab.select(1);
        }

        windowScrollTop();
        this.sideDialog.show();
        disabledBodyOverflow(true);
      } else {
        this.sideDialog.hide();
        disabledBodyOverflow(false);
      }
    });
  }
}
