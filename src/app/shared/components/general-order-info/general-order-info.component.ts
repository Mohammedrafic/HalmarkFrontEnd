import { Component, Input } from '@angular/core';
import { OrderType } from '@shared/enums/order-type';
import { Order } from '@shared/models/order-management.model';
import { OrderManagementService } from '@client/order-management/order-management-content/order-management.service';
import { ReasonForRequisition } from '@shared/enums/reason-for-requisition';
import { ReasonForRequisitionList } from '@shared/models/reason-for-requisition-list';

enum Active {
  No,
  Yes,
}

@Component({
  selector: 'app-general-order-info',
  templateUrl: './general-order-info.component.html',
  styleUrls: ['./general-order-info.component.scss'],
})
export class GeneralOrderInfoComponent {
  @Input() orderInformation: Order;

  public orderType = OrderType;

  constructor(private orderManagementService: OrderManagementService) {}

  public activeValue(value: boolean): string {
    return Active[Number(value)];
  }

  public moveToInitialOrder(): void {
    this.orderManagementService.orderId$.next(this.orderInformation.extensionInitialOrderId!);
  }

  public moveToPreviousExtension(): void {
    this.orderManagementService.orderId$.next(this.orderInformation.extensionFromId!);
  }

  public getReasonsForRequisition(reason: ReasonForRequisition): string {
    return reason !== null || true
      ? (ReasonForRequisitionList.find((item) => item.id === reason)?.name as string)
      : 'No';
  }
}
