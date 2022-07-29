import { Observable, takeUntil } from 'rxjs';
import { FieldSettingsModel } from '@syncfusion/ej2-angular-dropdowns';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { DestroyableDirective } from '@shared/directives/destroyable.directive';
import { Order, OrderManagement } from '@shared/models/order-management.model';
import { ShowCloseOrderDialog } from '../../../store/app.actions';
import { OrderType, OrderTypeTitlesMap } from '@shared/enums/order-type';
import { RejectReasonPage } from '@shared/models/reject-reason.model';
import { CloseOrderService } from '@client/order-management/close-order/close-order.service';
import { GetClosureReasonsByPage } from "@organization-management/store/reject-reason.actions";
import { RejectReasonState } from "@organization-management/store/reject-reason.state";
import { CloseOrderPayload } from "@client/order-management/close-order/models/closeOrderPayload.model";

@Component({
  selector: 'app-close-order',
  templateUrl: './close-order.component.html',
  styleUrls: ['./close-order.component.scss'],
})
export class CloseOrderComponent extends DestroyableDirective implements OnChanges, OnInit {
  @Input() public order: Order | OrderManagement;
  @Output() private closeOrderSuccess: EventEmitter<Order | OrderManagement> = new EventEmitter<Order | OrderManagement>();

  @Select(RejectReasonState.closureReasonsPage)
  public closureReasonsPage$: Observable<RejectReasonPage>;

  public readonly reasonFields: FieldSettingsModel = { text: 'reason', value: 'id' };
  public readonly datepickerMask = { month: 'MM', day: 'DD', year: 'YYYY' };
  public minDate: Date | null;

  public dialogTitleType: string;
  public isPosition: boolean = false;
  public closeForm: FormGroup;

  public constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private actions: Actions,
    private closeOrderService: CloseOrderService
  ) {
    super();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['order']?.currentValue) {
     this.dialogTitleType = OrderTypeTitlesMap.get(this.order.orderType) as string;
     this.setMinDate();
    }
  }

  public ngOnInit(): void {
    this.store.dispatch(new GetClosureReasonsByPage(undefined, undefined, undefined, true));
    this.initForm();
    this.subscribeOnCloseSideBar();
  }

  public onCancel(): void {
    this.closeDialog();
  }

  public onSave(): void {
    if (this.closeForm.invalid) {
      this.closeForm.markAllAsTouched();
    } else {
      this.submit();
    }
  }

  private initForm(): void {
    this.closeForm = this.formBuilder.group({
        reasonId: [null, Validators.required],
        closingDate: [null, Validators.required],
      });
  }

  private setMinDate(): void {
    this.minDate = this.order.orderType !== OrderType.OpenPerDiem ? this.order?.jobStartDate as Date : null;
  }

  public setCloseDateAvailability(isPosition: boolean): void {
    this.isPosition = isPosition;
    if (this.isPosition && this.order?.orderType === OrderType.ReOrder) {
      this.closeForm.patchValue({closingDate: new Date(this.order.jobStartDate as Date)});
      this.closeForm.get('closingDate')?.disable();
    } else {
      this.closeForm.get('closingDate')?.enable();
    }
  }

  private closeDialog(): void {
    this.store.dispatch(new ShowCloseOrderDialog(false));
  }

  private submit(): void {
    const formData = this.closeForm.getRawValue();

    if (this.isPosition) {
      this.closePosition(formData);
    } else {
      this.closeOrder(formData);
    }
  }

  private closeOrder(formData: Omit<CloseOrderPayload, 'orderId'>): void {
    this.closeOrderService
      .closeOrder({...formData, orderId: this.order.id})
      .subscribe(() => {
        this.closeOrderSuccess.emit(this.order);
        this.closeDialog();
      });
  }

  private closePosition(formData: Omit<CloseOrderPayload, 'orderId'>): void {
    //TODO change to close positions method
    this.closeOrderService
      .closePosition({...formData, orderId: this.order.id})
      .subscribe(() => {
        this.closeOrderSuccess.emit(this.order);
        this.closeDialog();
      });
  }

  private subscribeOnCloseSideBar(): void {
    this.actions.pipe(
      ofActionSuccessful(ShowCloseOrderDialog),
      takeUntil(this.destroy$)
    ).subscribe((res) => {
      if(!res.isDialogShown) {
        this.closeForm.reset();
      }
    });
  }
}
