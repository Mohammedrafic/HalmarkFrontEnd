import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Order, OrderContactDetails, OrderWorkLocation } from '@shared/models/order-management.model';
import { Subject, takeUntil } from 'rxjs';
import { OrderType } from '@shared/enums/order-type';
import { Store } from '@ngxs/store';
import { CommentsService } from '@shared/services/comments.service';
import { Comment } from '@shared/models/comment.model';
import { SetIsDirtyOrderForm } from '@client/store/order-managment-content.actions';

type ContactDetails = Partial<OrderContactDetails> & Partial<OrderWorkLocation>;
@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent implements OnChanges, OnDestroy {
  @Input() isPosition: boolean = false;
  @Input() set currentOrder(value: Order) {
    this.order = value;
    this.getContactDetails();
  }

  public order: Order;
  public orderType = OrderType;
  public contactDetails: ContactDetails;
  public comments: Comment[] = [];

  private unsubscribe$: Subject<void> = new Subject();

  constructor(private store: Store, private commentsService: CommentsService, private cdr: ChangeDetectorRef) {}

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const { currentOrder } = changes;

    if (currentOrder?.currentValue) {
      this.getComments();
    }
  }

  private getComments(): void {
    this.commentsService
      .getComments(this.order.commentContainerId as number, null)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((comments: Comment[]) => {
        this.comments = comments;
        this.cdr.markForCheck();
      });
  }

  public onBillRatesChanged(): void {
    this.store.dispatch(new SetIsDirtyOrderForm(true));
  }

  private getContactDetails(): void {
    if (!this.order) {
      return;
    }
    const { contactDetails, workLocations, reOrderFrom } = this.order || {};
    const contact = contactDetails?.length
      ? contactDetails.find((contact) => contact.isPrimaryContact) || contactDetails[0]
      : reOrderFrom?.contactDetails[0];
    const location = workLocations?.length ? workLocations : reOrderFrom?.workLocations!;
    this.contactDetails = {
      name: contact?.name,
      email: contact?.email,
      address: location?.[0]?.address,
      city: location?.[0]?.city,
      state: location?.[0]?.state,
      zipCode: location?.[0]?.zipCode,
    };
  }
}
