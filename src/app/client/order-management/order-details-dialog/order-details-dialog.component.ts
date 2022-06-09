import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Select } from '@ngxs/store';

import { SelectEventArgs, TabComponent } from '@syncfusion/ej2-angular-navigations';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
import { ChipListComponent } from '@syncfusion/ej2-angular-buttons';

import { disabledBodyOverflow, windowScrollTop } from '@shared/utils/styles.utils';
import { OrderManagement } from '@shared/models/order-management.model';
import { OrderType } from '@shared/enums/order-type';
import { ChipsCssClass } from '@shared/pipes/chips-css-class.pipe';
import { DialogNextPreviousOption } from '@shared/components/dialog-next-previous/dialog-next-previous.component';
import { OrderManagementContentState } from '@client/store/order-managment-content.state';

@Component({
  selector: 'app-order-details-dialog',
  templateUrl: './order-details-dialog.component.html',
  styleUrls: ['./order-details-dialog.component.scss'],
})
export class OrderDetailsDialogComponent implements OnInit, OnChanges, OnDestroy {
  @Input() order: OrderManagement;
  @Input() openEvent: Subject<boolean>;

  @Output() nextPreviousOrderEvent = new EventEmitter<boolean>();

  @ViewChild('sideDialog') sideDialog: DialogComponent;
  @ViewChild('chipList') chipList: ChipListComponent;
  @ViewChild('tab') tab: TabComponent;

  @Select(OrderManagementContentState.orderDialogOptions)
  public orderDialogOptions$: Observable<DialogNextPreviousOption>;

  private unsubscribe$: Subject<void> = new Subject();

  public firstActive = true;
  public targetElement: HTMLElement = document.body;
  public orderType = OrderType;

  constructor(private chipsCssClass: ChipsCssClass) {}

  ngOnInit(): void {
    this.onOpenEvent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chipList && changes['order'].currentValue) {
      this.chipList.cssClass = this.chipsCssClass.transform(changes['order'].currentValue.statusText);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public lockOrder(): void {

  }

  public onTabSelecting(event: SelectEventArgs): void {
    if (event.isSwiped) {
      event.cancel = true;
    }
  }

  public onTabCreated(): void {
    this.tab.selected.pipe(takeUntil(this.unsubscribe$)).subscribe((event: SelectEventArgs) => {
      const visibilityTabIndex = 0;
      if (event.selectedIndex !== visibilityTabIndex) {
        this.tab.refresh();
        this.firstActive = false;
      } else {
        this.firstActive = true;
      }
    });
  }

  public onClose(): void {
    this.sideDialog.hide();
    this.openEvent.next(false);
  }

  public onNextPreviousOrder(next: boolean): void {
    this.nextPreviousOrderEvent.emit(next);
  }

  private onOpenEvent(): void {
    this.openEvent.pipe(takeUntil(this.unsubscribe$)).subscribe((isOpen) => {
      if (isOpen) {
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
