import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GridComponent } from "@syncfusion/ej2-angular-grids";
import { AbstractGridConfigurationComponent } from "@shared/components/abstract-grid-configuration/abstract-grid-configuration.component";
import { Store } from "@ngxs/store";
import { AgencyOrder, OrderCandidatesListPage } from "@shared/models/order-management.model";
import { GetAgencyOrderCandidatesList } from "@agency/store/order-management.actions";
import { debounceTime, Subject } from "rxjs";
import { UserState } from 'src/app/store/user.state';
import { BusinessUnitType } from '@shared/enums/business-unit-type';
import { disabledBodyOverflow } from '@shared/utils/styles.utils';

@Component({
  selector: 'app-order-candidates-list',
  templateUrl: './order-candidates-list.component.html',
  styleUrls: ['./order-candidates-list.component.scss']
})
export class OrderCandidatesListComponent extends AbstractGridConfigurationComponent implements OnInit{
  @ViewChild('orderCandidatesGrid') grid: GridComponent;

  @Input() candidatesList: OrderCandidatesListPage;
  @Input() order: AgencyOrder;

  private pageSubject = new Subject<number>();

  constructor(private store: Store, private router: Router) {
    super();
  }

  ngOnInit() {
    this.pageSubject.pipe(debounceTime(1)).subscribe((page) => {
      this.currentPage = page;
      this.store.dispatch(new GetAgencyOrderCandidatesList(this.order.orderId, this.order.organizationId, this.currentPage, this.pageSize));
    });
  }

  public onRowsDropDownChanged(): void {
    this.pageSize = parseInt(this.activeRowsPerPageDropDown);
    this.pageSettings = { ...this.pageSettings, pageSize: this.pageSize };
  }

  public onGoToClick(event: any): void {
    if (event.currentPage || event.value) {
      this.pageSubject.next(event.currentPage || event.value);
    }
  }

  public onViewNavigation(id: number): void {
    const user = this.store.selectSnapshot(UserState.user);
    const url = user?.businessUnitType === BusinessUnitType.Organization ? '/agency/candidates' : '/agency/candidates/edit';
    this.router.navigate([url, id], { state: { orderId: this.order.orderId }});
    disabledBodyOverflow(false);
  }

  public onEdit(data: unknown): void {}

  getBillRate(rate: number): string {
    return rate ? `$10.00 - ${rate}` :' $10.00';
  }
}
